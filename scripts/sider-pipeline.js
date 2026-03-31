#!/usr/bin/env node
'use strict';

/**
 * SIDER (Side Effect Resource) Pipeline
 * Usage: node scripts/sider-pipeline.js "<drug name>"
 *        node scripts/sider-pipeline.js "<drug name>" --debug
 * Example: node scripts/sider-pipeline.js "atorvastatin"
 *
 * --debug  Prints matched STITCH IDs, raw side-effect counts, exits before Claude.
 *
 * Downloads SIDER 4.1 data files (once) to data/sider/, parses side effects for
 * the given drug, filters for condition-relevant terms, sends to Claude, outputs SQL.
 * Progress messages go to stderr; SQL goes to stdout.
 *
 * SIDER 4.1 file formats:
 *   drug_names.tsv        — col[0]: STITCH_ID, col[1]: drug_name
 *   meddra_all_se.tsv.gz  — col[0]: stitch_flat, col[1]: stitch_stereo,
 *                            col[2]: umls_label, col[3]: meddra_type (PT/LLT),
 *                            col[4]: umls_meddra, col[5]: side_effect_name
 *   meddra_freq.tsv.gz    — col[0]: stitch_flat, col[1]: stitch_stereo,
 *                            col[2]: umls_label, col[3]: placebo,
 *                            col[4]: freq_description, col[5]: freq_lower,
 *                            col[6]: freq_upper, col[7]: meddra_type,
 *                            col[8]: umls_meddra, col[9]: side_effect_name
 */

const { createGunzip } = require('zlib');
const {
  existsSync, mkdirSync, createReadStream, createWriteStream,
} = require('fs');
const { readFileSync } = require('fs');
const { pipeline: streamPipeline } = require('stream/promises');
const { Readable } = require('stream');
const readline = require('readline');
const path = require('path');
const { randomUUID } = require('crypto');

// ── Config ─────────────────────────────────────────────────────────────────────

const SIDER_BASE = 'http://sideeffects.embl.de/media/files';
const SIDER_DRUG_PAGE = 'http://sideeffects.embl.de/drugs';
const DATA_DIR = path.join(__dirname, '..', 'data', 'sider');
const ANTHROPIC_BASE = 'https://api.anthropic.com';
const MODEL = 'claude-sonnet-4-5';

// SIDER files to download (only once — cached in data/sider/)
const SIDER_FILES = {
  drugNames: {
    url:     `${SIDER_BASE}/drug_names.tsv`,
    local:   path.join(DATA_DIR, 'drug_names.tsv'),
    gzipped: false,
  },
  allSe: {
    url:     `${SIDER_BASE}/meddra_all_se.tsv.gz`,
    local:   path.join(DATA_DIR, 'meddra_all_se.tsv.gz'),
    gzipped: true,
  },
  freq: {
    url:     `${SIDER_BASE}/meddra_freq.tsv.gz`,
    local:   path.join(DATA_DIR, 'meddra_freq.tsv.gz'),
    gzipped: true,
  },
};

// ── Condition-relevant side effect terms (mirrors openfda-pipeline.js) ─────────

const GYNAE_TERMS = [
  // Menstrual / cycle (endometriosis, PMDD, PCOS, adenomyosis)
  'menstrual', 'menstruation', 'dysmenorrhea', 'dysmenorrhoea', 'menorrhagia',
  'metrorrhagia', 'amenorrhea', 'amenorrhoea', 'oligomenorrhea', 'oligomenorrhoea',
  'intermenstrual bleeding', 'heavy menstrual bleeding', 'uterine bleeding',
  'abnormal uterine bleeding', 'menstrual disorder', 'irregular menstruation',

  // Pelvic / reproductive (endometriosis, adenomyosis, vulvodynia, PCOS)
  'endometriosis', 'endometrial', 'adenomyosis',
  'pelvic pain', 'pelvic', 'uterine', 'uterine spasm', 'uterine pain',
  'uterine fibroid', 'leiomyoma',
  'ovarian', 'ovarian cyst', 'ovarian pain', 'polycystic',
  'vaginal', 'vaginal pain', 'vaginal haemorrhage', 'vaginal hemorrhage',
  'vaginal discharge', 'vulval pain', 'vulvodynia', 'vulvar',
  'dyspareunia', 'sexual pain',
  'breast pain', 'mastalgia', 'breast tenderness',

  // Pain (endometriosis, adenomyosis, vulvodynia, PMDD)
  'abdominal pain', 'abdominal cramp', 'cramping', 'pelvic floor',
  'chronic pelvic pain', 'headache', 'migraine',

  // Mood / neurological (PMDD, menopause)
  'depression', 'depressed mood', 'major depressive', 'anxiety', 'anxious',
  'mood swing', 'irritability', 'irritable', 'emotional disturbance',
  'affect lability', 'crying', 'tearfulness',
  'insomnia', 'sleep disorder', 'sleep disturbance', 'hypersomnia',
  'fatigue', 'asthenia', 'cognitive', 'concentration impaired',
  'memory impairment', 'confusion',

  // Metabolic / hormonal (PCOS, menopause)
  'weight gain', 'weight increased', 'obesity',
  'insulin resistance', 'glucose', 'hyperglycemia', 'hyperglycaemia',
  'androgen', 'testosterone', 'hirsutism', 'hair loss', 'alopecia',
  'acne', 'seborrhoea', 'hormone', 'hormonal',
  'fertility', 'infertility', 'anovulation', 'ovulation disorder',

  // Vasomotor (menopause)
  'hot flush', 'hot flash', 'hot flushes', 'hot flashes',
  'night sweat', 'night sweats', 'flushing', 'sweating', 'hyperhidrosis',

  // Inflammatory (endometriosis, adenomyosis)
  'inflammation', 'inflammatory', 'oedema', 'edema',
  'bloating', 'abdominal distension',

  // Sexual / urinary (vulvodynia, menopause)
  'libido', 'decreased libido', 'sexual dysfunction', 'vaginismus',
  'urinary incontinence', 'urinary tract', 'cystitis',
  'interstitial cystitis', 'bladder pain', 'urinary frequency',

  // Named conditions
  'premenstrual dysphoric disorder', 'pmdd', 'premenstrual syndrome',
  'polycystic ovary syndrome', 'pcos',
  'vulvodynia', 'menopause', 'perimenopause', 'menopausal',
];

// ── Condition aliases (same as other pipelines) ───────────────────────────────

const CONDITION_ALIASES = {
  'polycystic ovary syndrome':       ['pcos', 'polycystic ovary', 'polycystic ovarian'],
  'polycystic ovarian syndrome':     ['pcos', 'polycystic ovary', 'polycystic ovarian'],
  'pcos':                            ['pcos', 'polycystic ovary', 'polycystic ovarian'],
  'premenstrual dysphoric disorder': ['pmdd', 'premenstrual dysphoric'],
  'pmdd':                            ['pmdd', 'premenstrual dysphoric'],
  'premenstrual syndrome':           ['pmdd', 'pms', 'premenstrual'],
  'menopause':                       ['menopause', 'perimenopause', 'menopausal'],
  'perimenopause':                   ['perimenopause', 'menopause', 'menopausal'],
  'vulvodynia':                      ['vulvodynia', 'vulvar pain', 'vulvar'],
  'endometriosis':                   ['endometriosis', 'endometrial'],
  'adenomyosis':                     ['adenomyosis'],
};

// ── .env.local loader ─────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  try {
    const content = readFileSync(envPath, 'utf8');
    const env = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
    }
    return env;
  } catch {
    return {};
  }
}

// ── Logging ───────────────────────────────────────────────────────────────────

function log(msg) {
  process.stderr.write(msg + '\n');
}

// ── Download helpers ──────────────────────────────────────────────────────────

/**
 * Download a URL to a local file path, showing a byte-progress counter.
 * Uses Node's built-in fetch (Node 18+).
 */
async function downloadFile(url, dest, label) {
  log(`   Downloading ${label}...`);
  log(`   URL: ${url}`);

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(
      `Failed to download ${label}: HTTP ${resp.status} ${resp.statusText}\n` +
      `  URL: ${url}\n` +
      `  The SIDER server (sideeffects.embl.de) may be temporarily unavailable.\n` +
      `  Try again later or manually download the file and place it at:\n` +
      `  ${dest}`
    );
  }

  const totalBytes = parseInt(resp.headers.get('content-length') ?? '0', 10);
  let received = 0;
  let lastLog = 0;

  const fileStream = createWriteStream(dest);

  // Pipe web ReadableStream → Node Readable → file
  const nodeStream = Readable.fromWeb(resp.body);
  nodeStream.on('data', chunk => {
    received += chunk.length;
    const now = Date.now();
    if (now - lastLog > 2000) {
      const mb = (received / 1048576).toFixed(1);
      const total = totalBytes > 0 ? ` / ${(totalBytes / 1048576).toFixed(1)} MB` : '';
      process.stderr.write(`\r   ${label}: ${mb} MB${total} downloaded…`);
      lastLog = now;
    }
  });

  await streamPipeline(nodeStream, fileStream);
  process.stderr.write(`\r   ${label}: done (${(received / 1048576).toFixed(1)} MB)\n`);
}

/**
 * Ensure all SIDER data files are present locally, downloading them if needed.
 */
async function ensureDataFiles() {
  mkdirSync(DATA_DIR, { recursive: true });

  for (const [key, info] of Object.entries(SIDER_FILES)) {
    if (existsSync(info.local)) {
      log(`   ${key}: already cached at ${path.relative(process.cwd(), info.local)}`);
      continue;
    }
    await downloadFile(info.url, info.local, key);
  }
}

// ── SIDER parsing ─────────────────────────────────────────────────────────────

/**
 * Stream-parse a TSV file (optionally gzip-compressed), calling onLine(cols[])
 * for each non-comment, non-empty line.
 */
async function streamTSV(filePath, gzipped, onLine) {
  const fileStream = createReadStream(filePath);
  const source = gzipped ? fileStream.pipe(createGunzip()) : fileStream;
  const rl = readline.createInterface({ input: source, crlfDelay: Infinity });
  for await (const line of rl) {
    if (!line || line.startsWith('#')) continue;
    onLine(line.split('\t'));
  }
}

/**
 * Load drug_names.tsv into a Map<drug_name_lower → Set<stitch_id>>.
 * This file is small (~a few MB) so we load it entirely.
 */
async function loadDrugNames() {
  log('   Parsing drug_names.tsv...');
  const nameToIds = new Map(); // lowercase name → Set of stitch IDs

  await streamTSV(SIDER_FILES.drugNames.local, false, cols => {
    if (cols.length < 2) return;
    const stitchId = cols[0].trim();
    const name = cols[1].trim().toLowerCase();
    if (!name || !stitchId) return;
    if (!nameToIds.has(name)) nameToIds.set(name, new Set());
    nameToIds.get(name).add(stitchId);
  });

  log(`   Loaded ${nameToIds.size.toLocaleString()} drug names.`);
  return nameToIds;
}

/**
 * Find all STITCH IDs for a query drug name.
 * Uses exact match first, then prefix match, then substring match.
 * Returns { stitchIds: Set<string>, matchedNames: string[] }
 */
function resolveStitchIds(nameToIds, query) {
  const q = query.toLowerCase().trim();
  const found = new Map(); // stitchId → matchedName

  // 1. Exact match
  if (nameToIds.has(q)) {
    for (const id of nameToIds.get(q)) found.set(id, q);
  }

  // 2. Prefix match (e.g. "atorvastatin" matches "atorvastatin calcium")
  if (found.size === 0) {
    for (const [name, ids] of nameToIds) {
      if (name.startsWith(q) || q.startsWith(name)) {
        for (const id of ids) if (!found.has(id)) found.set(id, name);
      }
    }
  }

  // 3. Substring match
  if (found.size === 0) {
    for (const [name, ids] of nameToIds) {
      if (name.includes(q)) {
        for (const id of ids) if (!found.has(id)) found.set(id, name);
      }
    }
  }

  return {
    stitchIds: new Set(found.keys()),
    matchedNames: [...new Set(found.values())],
  };
}

/**
 * Check if a MedDRA side-effect term is relevant to any of our 6 conditions.
 */
function isGynaeRelevant(term) {
  if (!term) return false;
  const lower = term.toLowerCase();
  return GYNAE_TERMS.some(t => lower.includes(t) || t.includes(lower));
}

/**
 * Parse meddra_all_se.tsv.gz for the given STITCH IDs.
 * Returns Map<side_effect_name_lower → { term, count, umlsId }>
 * (count = how many distinct STITCH ID + label combinations mention this term)
 */
async function parseSideEffects(stitchIds) {
  log('   Scanning meddra_all_se.tsv.gz (this may take a moment)...');
  const effects = new Map(); // lower_name → { term, count, umlsId }
  let linesRead = 0;

  await streamTSV(SIDER_FILES.allSe.local, true, cols => {
    linesRead++;
    if (linesRead % 1_000_000 === 0) {
      process.stderr.write(`\r   meddra_all_se: ${(linesRead / 1_000_000).toFixed(1)}M lines scanned…`);
    }
    if (cols.length < 6) return;
    const stitchFlat = cols[0].trim();
    if (!stitchIds.has(stitchFlat)) return;

    // col[3] is MedDRA concept type: PT = Preferred Term, LLT = Lowest Level Term
    // Prefer PT terms; include LLT too for coverage
    const meddraType = cols[3].trim();
    if (meddraType !== 'PT' && meddraType !== 'LLT') return;

    const termName = cols[5].trim();
    if (!termName) return;

    const lower = termName.toLowerCase();
    if (effects.has(lower)) {
      effects.get(lower).count++;
    } else {
      effects.set(lower, { term: termName, count: 1, umlsId: cols[4].trim() });
    }
  });

  process.stderr.write(`\r   meddra_all_se: ${(linesRead / 1_000_000).toFixed(1)}M lines scanned (done)\n`);
  return effects;
}

/**
 * Parse meddra_freq.tsv.gz for the given STITCH IDs.
 * Returns Map<side_effect_name_lower → { term, freqDescription, freqLower, freqUpper }>
 * for the highest-frequency entry found (non-placebo, PT terms preferred).
 */
async function parseFrequencies(stitchIds) {
  log('   Scanning meddra_freq.tsv.gz (this may take a moment)...');
  const freqs = new Map(); // lower_name → best freq entry
  let linesRead = 0;

  await streamTSV(SIDER_FILES.freq.local, true, cols => {
    linesRead++;
    if (linesRead % 500_000 === 0) {
      process.stderr.write(`\r   meddra_freq: ${(linesRead / 1_000_000).toFixed(2)}M lines scanned…`);
    }
    if (cols.length < 10) return;
    const stitchFlat = cols[0].trim();
    if (!stitchIds.has(stitchFlat)) return;

    const placebo = cols[3].trim();
    if (placebo === '1') return; // skip placebo rows

    const meddraType = cols[7].trim();
    if (meddraType !== 'PT' && meddraType !== 'LLT') return;

    const termName = cols[9].trim();
    if (!termName) return;

    const lower = termName.toLowerCase();
    const freqDesc  = cols[4].trim();
    const freqLower = parseFloat(cols[5]) || 0;
    const freqUpper = parseFloat(cols[6]) || 0;

    // Keep entry with higher upper-bound frequency; postmarketing wins over nothing
    const existing = freqs.get(lower);
    const betterFreq = !existing ||
      freqUpper > (existing.freqUpper ?? 0) ||
      (freqDesc === 'postmarketing' && !existing.freqDesc);

    if (betterFreq) {
      freqs.set(lower, { term: termName, freqDesc, freqLower, freqUpper });
    }
  });

  process.stderr.write(`\r   meddra_freq: ${(linesRead / 1_000_000).toFixed(2)}M lines scanned (done)\n`);
  return freqs;
}

// ── Format for Claude ─────────────────────────────────────────────────────────

function formatFreq(entry) {
  if (!entry) return '';
  if (entry.freqDesc === 'postmarketing') return ' (postmarketing)';
  if (entry.freqUpper > 0) {
    const lo = entry.freqLower > 0 ? `${(entry.freqLower * 100).toFixed(1)}–` : '<';
    return ` (${lo}${(entry.freqUpper * 100).toFixed(1)}%)`;
  }
  if (entry.freqDesc) return ` (${entry.freqDesc})`;
  return '';
}

function formatForClaude(drugName, relevantEffects, freqMap) {
  if (relevantEffects.length === 0) return '';

  const lines = relevantEffects
    .sort((a, b) => b.count - a.count)
    .map(e => {
      const freq = formatFreq(freqMap.get(e.term.toLowerCase()));
      return `  - ${e.term}${freq} [label count: ${e.count}]`;
    });

  return (
    `Drug: ${drugName}\n` +
    `Source: SIDER 4.1 (official drug labels / package inserts)\n` +
    `Total condition-relevant side effects found: ${relevantEffects.length}\n\n` +
    `Side effects (sorted by label occurrence count, with frequency data where available):\n` +
    lines.join('\n')
  );
}

// ── Claude analysis ───────────────────────────────────────────────────────────

const CONDITIONS_CONTEXT = `
The six conditions covered by this research tool are:
1. Endometriosis — estrogen-dependent inflammatory condition; relevant: menstrual/cycle, pelvic/uterine pain, inflammatory, mood
2. PMDD (Premenstrual Dysphoric Disorder) — severe luteal-phase mood disorder; relevant: mood/neurological, menstrual, pain
3. PCOS (Polycystic Ovary Syndrome) — metabolic-hormonal condition; relevant: metabolic/hormonal, menstrual/cycle, ovarian, mood
4. Adenomyosis — uterine inflammatory condition; relevant: menstrual/uterine/pelvic pain, inflammatory
5. Vulvodynia — chronic vulvovaginal pain; relevant: vulvar/vaginal pain, sexual pain, urinary, mood
6. Menopause — hormonal transition; relevant: vasomotor, mood/neurological, metabolic, urinary/sexual

Cross-condition overlaps:
- Endometriosis ↔ Adenomyosis: share inflammatory and estrogen-driven pathways
- PCOS ↔ all: metabolic and hormonal dysregulation creates upstream overlap
- Pain signals: relevant to endometriosis, adenomyosis, AND vulvodynia
- Mood signals: relevant to PMDD AND menopause; also secondary to chronic pain
- Vasomotor signals: primarily menopause; also relevant to surgical menopause after endometriosis treatment
`.trim();

const SIDER_SYSTEM_PROMPT =
  `You are a medical research analyst. Analyze these drug label side effects for signals relevant to women's health conditions: endometriosis, PMDD, PCOS, adenomyosis, vulvodynia, or menopause. These come from official drug labels and package inserts (SIDER database). Identify any effects that suggest this drug may influence these conditions positively or negatively.

${CONDITIONS_CONTEXT}

For each relevant signal, provide:
- compound_name: the generic drug name (lowercase)
- signal_type: "drug_label_signal"
- evidence_strength: "preliminary", "moderate", or "strong". Official label side effects represent confirmed pharmacological effects — weight accordingly.
- summary: 2–3 sentences. Cite specific side effect terms and their frequencies from the label data. Explain what the labeled effects reveal about the drug's interaction with the biological pathways relevant to the condition.
- mechanism_hypothesis: 1–2 sentences on the biological mechanism specific to the condition
- relevant_conditions: array using ONLY these exact names: ["endometriosis", "premenstrual dysphoric disorder", "polycystic ovary syndrome", "adenomyosis", "vulvodynia", "menopause"]
- label_effects: object mapping the most relevant labeled side effect terms to their label occurrence counts. Example: {"hot flush": 3, "depression": 2, "vaginal haemorrhage": 1}

Err on the side of inclusion. Official drug label data is strong mechanistic evidence — even a single labeled side effect that implicates a relevant hormonal, inflammatory, pain, or neurological pathway warrants a signal entry. Generate ONE entry per condition implicated.

Only skip a signal if there is genuinely no labeled effect that could connect to any of the six conditions or their biology.
Return ONLY a valid JSON array. If nothing is noteworthy, return [].`;

async function analyzeWithClaude(apiKey, drugName, content) {
  const userMessage =
    `Drug: ${drugName}\n\n` +
    `The following side effects are from official drug labels (SIDER 4.1 database — sourced from FDA drug label data).\n` +
    `These are confirmed pharmacological effects, not just statistical signals.\n\n` +
    `INSTRUCTIONS:\n` +
    `1. For each relevant finding, generate ONE signal entry PER CONDITION implicated.\n` +
    `2. Apply the cross-condition overlaps from your system prompt.\n` +
    `3. The label_effects field must include ALL label terms relevant to that condition.\n` +
    `4. Return ONLY a valid JSON array (no markdown, no commentary). If no signals, return [].\n\n` +
    content;

  const resp = await fetch(`${ANTHROPIC_BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system: SIDER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Claude API error ${resp.status}: ${body}`);
  }

  const data = await resp.json();
  const rawText = data.content?.[0]?.text ?? '';

  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(`Claude did not return a JSON array. Raw response:\n${rawText}`);
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error(`Failed to parse Claude JSON: ${e.message}\nRaw: ${jsonMatch[0]}`);
  }
}

// ── Supabase condition lookup ──────────────────────────────────────────────────

async function lookupConditionId(supabaseUrl, supabaseKey, condition) {
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    const url = `${supabaseUrl}/rest/v1/conditions?select=id,name,description&limit=200`;
    const resp = await fetch(url, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    if (!resp.ok) return null;
    const rows = await resp.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const q = condition.toLowerCase().trim();
    const aliasTerms = CONDITION_ALIASES[q] ?? [];
    const searchTerms = [q, ...aliasTerms.filter(t => t !== q)];

    function rowMatches(r, terms) {
      const name = (r.name ?? '').toLowerCase();
      const desc = (r.description ?? '').toLowerCase();
      return terms.some(t => name.includes(t) || desc.includes(t) || t.includes(name));
    }

    let match = rows.find(r => rowMatches(r, searchTerms));
    if (match) return match.id;

    const STOP = new Set(['and', 'or', 'the', 'of', 'in', 'for', 'a', 'an', 'with', 'to', 'by']);
    const queryWords = [...new Set(
      searchTerms.join(' ').split(/[\s\-\/\(\)]+/).filter(w => w.length >= 4 && !STOP.has(w))
    )];

    const scored = rows
      .map(r => {
        const haystack = `${r.name} ${r.description ?? ''}`.toLowerCase();
        const tokens = haystack.split(/[\s\-\/\(\)]+/);
        const score = queryWords.reduce((acc, qw) => {
          if (tokens.some(nw => nw === qw))                          return acc + 2;
          if (tokens.some(nw => nw.includes(qw) || qw.includes(nw))) return acc + 1;
          return acc;
        }, 0);
        return { row: r, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) return scored[0].row.id;
    return null;
  } catch {
    return null;
  }
}

// ── SQL helpers ───────────────────────────────────────────────────────────────

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function toTitleCase(name) {
  if (!name) return name;
  return name
    .split(/(\s+|-)/)
    .map(part => (/^[\s-]+$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

// ── SQL generation ────────────────────────────────────────────────────────────

async function generateSQL(drugName, signals, stitchIds, matchedNames, supabaseUrl, supabaseKey) {
  const today = new Date().toISOString().slice(0, 10);
  const out = [];

  // Best SIDER drug page URL: search by first matched name
  const siderSearchName = encodeURIComponent((matchedNames[0] ?? drugName).toLowerCase());
  const siderUrl = `${SIDER_DRUG_PAGE}/?q=${siderSearchName}`;

  out.push('-- ================================================================');
  out.push('-- Rediscover Women — SIDER Pipeline Output');
  out.push(`-- Drug       : ${drugName}`);
  out.push(`-- Generated  : ${today}`);
  out.push(`-- Model      : ${MODEL}`);
  out.push(`-- Source     : SIDER 4.1 (sideeffects.embl.de)`);
  out.push(`-- STITCH IDs : ${[...stitchIds].join(', ')}`);
  out.push('-- ================================================================');
  out.push('');

  if (signals.length === 0) {
    out.push('-- No noteworthy signals were identified from SIDER label data.');
    return out.join('\n');
  }

  // Resolve condition IDs
  const conditionNames = [...new Set(signals.flatMap(s => s.relevant_conditions ?? []))];
  const conditionIdMap = {};

  if (conditionNames.length > 0) {
    log(`\nStep 5 — Resolving ${conditionNames.length} condition ID(s)...`);
    for (const cname of conditionNames) {
      const id = await lookupConditionId(supabaseUrl, supabaseKey, cname);
      conditionIdMap[cname] = id ?? 'CONDITION_ID_HERE';
      log(`   ${cname} → ${conditionIdMap[cname]}`);
    }
  }

  // Expand: one row per (drug × condition)
  const enriched = [];
  for (const sig of signals) {
    const drug_name = toTitleCase(sig.compound_name ?? drugName);
    const conditions = sig.relevant_conditions ?? [];
    const rows = conditions.length === 0
      ? [{ conditionId: 'CONDITION_ID_HERE', conditionName: null }]
      : conditions.map(cname => ({ conditionId: conditionIdMap[cname] ?? 'CONDITION_ID_HERE', conditionName: cname }));

    for (const { conditionId, conditionName } of rows) {
      enriched.push({
        ...sig,
        drug_name,
        conditionId,
        conditionName,
        compoundId: randomUUID(),
        signalId: randomUUID(),
      });
    }
  }

  const seenCompounds = new Set();

  // ── STEP 1: Compounds ─────────────────────────────────────────────────────
  out.push('-- ── STEP 1: Compounds (safe to run multiple times) ──────────────');
  for (const s of enriched) {
    if (seenCompounds.has(s.drug_name)) continue;
    seenCompounds.add(s.drug_name);
    out.push(`INSERT INTO compounds (id, name, drug_class, fda_status) VALUES (`);
    out.push(`  ${esc(s.compoundId)},`);
    out.push(`  ${esc(s.drug_name)},`);
    out.push(`  NULL,`);
    out.push(`  'FDA Approved'`);
    out.push(`) ON CONFLICT (name) DO NOTHING;`);
    out.push('');
  }

  // ── STEP 2: Signals ───────────────────────────────────────────────────────
  out.push('-- ── STEP 2: Repurposing signals ─────────────────────────────────');
  for (const s of enriched) {
    if (s.conditionId === 'CONDITION_ID_HERE') {
      out.push(`-- ⚠  Could not resolve condition "${s.conditionName}" — replace CONDITION_ID_HERE manually.`);
      out.push(`--    SELECT id, name FROM conditions WHERE name ILIKE '%${s.conditionName ?? ''}%';`);
    }
    out.push(`INSERT INTO repurposing_signals`);
    out.push(`  (id, condition_id, compound_id, signal_type, evidence_strength, summary, mechanism_hypothesis, status)`);
    out.push(`SELECT`);
    out.push(`  ${esc(s.signalId)},`);
    out.push(`  ${esc(s.conditionId)},`);
    out.push(`  c.id,`);
    out.push(`  'drug_label_signal',`);
    out.push(`  ${esc(s.evidence_strength)},`);
    out.push(`  ${esc(s.summary)},`);
    out.push(`  ${esc(s.mechanism_hypothesis)},`);
    out.push(`  'active'`);
    out.push(`FROM compounds c`);
    out.push(`WHERE c.name = ${esc(s.drug_name)}`);
    out.push(`ON CONFLICT (compound_id, condition_id) DO UPDATE SET`);
    out.push(`  signal_type          = EXCLUDED.signal_type,`);
    out.push(`  evidence_strength    = EXCLUDED.evidence_strength,`);
    out.push(`  summary              = EXCLUDED.summary,`);
    out.push(`  mechanism_hypothesis = EXCLUDED.mechanism_hypothesis,`);
    out.push(`  status               = EXCLUDED.status;`);
    out.push('');
  }

  // ── STEP 3: SIDER source rows ─────────────────────────────────────────────
  out.push('-- ── STEP 3: SIDER source citations ──────────────────────────────');
  const seenSignals = new Set();

  for (const s of enriched) {
    if (seenSignals.has(s.signalId)) continue;
    seenSignals.add(s.signalId);

    const signalIdSubquery =
      `(SELECT rs.id FROM repurposing_signals rs ` +
      `JOIN compounds c ON c.id = rs.compound_id ` +
      `WHERE c.name = ${esc(s.drug_name)} AND rs.condition_id = ${esc(s.conditionId)} LIMIT 1)`;

    // Delete existing SIDER sources (idempotent re-runs)
    out.push(`DELETE FROM sources`);
    out.push(`WHERE source_type = 'sider'`);
    out.push(`  AND signal_id = (`);
    out.push(`    SELECT rs.id FROM repurposing_signals rs`);
    out.push(`    JOIN compounds c ON c.id = rs.compound_id`);
    out.push(`    WHERE c.name = ${esc(s.drug_name)}`);
    out.push(`      AND rs.condition_id = ${esc(s.conditionId)}`);
    out.push(`    LIMIT 1`);
    out.push(`  );`);
    out.push('');

    // One source row per signal: database-level citation pointing to SIDER drug page
    const sourceId = randomUUID();
    const labelEffects = s.label_effects ?? {};
    const topEffects = Object.entries(labelEffects)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term, count]) => `${term} (n=${count})`)
      .join(', ');

    const title =
      `SIDER: ${s.drug_name} — drug label side effects` +
      (topEffects ? `. Top effects: ${topEffects}` : '');

    const stitchId = [...stitchIds][0] ?? '';
    // SIDER drug page by STITCH ID if available; fall back to search URL
    const drugPageUrl = stitchId
      ? `${SIDER_DRUG_PAGE}/${stitchId}/`
      : siderUrl;

    out.push(`INSERT INTO sources`);
    out.push(`  (id, signal_id, source_type, external_id, title, authors, journal, publication_date, url)`);
    out.push(`VALUES (`);
    out.push(`  ${esc(sourceId)}, ${signalIdSubquery}, 'sider',`);
    out.push(`  ${esc(`SIDER-${s.drug_name.toUpperCase()}`)},`);
    out.push(`  ${esc(title)},`);
    out.push(`  NULL, 'SIDER 4.1 — Side Effect Resource (sideeffects.embl.de)', ${esc(today)}, ${esc(drugPageUrl)}`);
    out.push(`);`);
    out.push('');

    // Per-effect rows for the top label_effects (n≥1 — these are from official labels, not stats)
    const effectEntries = Object.entries(labelEffects).sort((a, b) => b[1] - a[1]);
    for (const [term, count] of effectEntries) {
      const effectSourceId = randomUUID();
      const effectTitle = `SIDER: ${toTitleCase(term)} — labeled side effect of ${s.drug_name} (n=${count})`;
      const externalId = `SIDER-${s.drug_name.toUpperCase()}-${term.replace(/\s+/g, '_').toUpperCase()}`;

      out.push(`INSERT INTO sources`);
      out.push(`  (id, signal_id, source_type, external_id, title, authors, journal, publication_date, url)`);
      out.push(`VALUES (`);
      out.push(`  ${esc(effectSourceId)}, ${signalIdSubquery}, 'sider',`);
      out.push(`  ${esc(externalId)},`);
      out.push(`  ${esc(effectTitle)},`);
      out.push(`  NULL, 'SIDER 4.1 — Side Effect Resource (sideeffects.embl.de)', ${esc(today)}, ${esc(drugPageUrl)}`);
      out.push(`);`);
      out.push('');
    }
  }

  out.push('-- ── End of pipeline output ──────────────────────────────────────');
  return out.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const drugName = args.find(a => !a.startsWith('--'));
  const debug = args.includes('--debug');

  if (!drugName) {
    process.stderr.write(
      'Usage:   node scripts/sider-pipeline.js "<drug name>" [--debug]\n' +
      'Example: node scripts/sider-pipeline.js "atorvastatin"\n' +
      '         node scripts/sider-pipeline.js "metformin" --debug\n' +
      '\nData files are downloaded once to data/sider/ and reused on subsequent runs.\n'
    );
    process.exit(1);
  }

  const env = loadEnv();
  const apiKey = env.ANTHROPIC_API_KEY;
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!debug && (!apiKey || apiKey === 'your_anthropic_api_key_here')) {
    process.stderr.write('Error: ANTHROPIC_API_KEY is not set in .env.local\n');
    process.exit(1);
  }

  log(`\nDrug: "${drugName}"`);

  // ── Step 1: Ensure data files are present
  log('\nStep 1 — Ensuring SIDER data files are cached locally...');
  log(`   Cache directory: ${DATA_DIR}`);
  try {
    await ensureDataFiles();
  } catch (err) {
    process.stderr.write(`\nError downloading SIDER data:\n  ${err.message}\n`);
    process.exit(1);
  }

  // ── Step 2: Resolve drug → STITCH IDs
  log('\nStep 2 — Resolving drug name to STITCH compound ID(s)...');
  const nameToIds = await loadDrugNames();
  const { stitchIds, matchedNames } = resolveStitchIds(nameToIds, drugName);

  if (stitchIds.size === 0) {
    log(`\nNo STITCH ID found for "${drugName}" in SIDER drug_names.tsv.`);
    log('The drug may be listed under a different name. Try searching SIDER directly:');
    log(`  http://sideeffects.embl.de/drugs/?q=${encodeURIComponent(drugName)}`);
    process.exit(0);
  }

  log(`   Matched name(s): ${matchedNames.join(', ')}`);
  log(`   STITCH IDs: ${[...stitchIds].join(', ')}`);

  // ── Step 3: Extract side effects
  log('\nStep 3 — Extracting side effects from SIDER...');
  const [allEffects, freqMap] = await Promise.all([
    parseSideEffects(stitchIds),
    parseFrequencies(stitchIds),
  ]);

  log(`   Total unique side effects for "${drugName}": ${allEffects.size.toLocaleString()}`);

  // Filter for condition-relevant terms
  const relevantEffects = [...allEffects.values()].filter(e => isGynaeRelevant(e.term));
  log(`   Condition-relevant side effects: ${relevantEffects.length}`);

  if (debug) {
    log('\n[DEBUG] Matched STITCH IDs: ' + [...stitchIds].join(', '));
    log('[DEBUG] Condition-relevant side effects:');
    for (const e of relevantEffects.sort((a, b) => b.count - a.count)) {
      const freq = freqMap.get(e.term.toLowerCase());
      const freqStr = freq ? formatFreq(freq) : '';
      log(`  ${e.term}${freqStr} (label count: ${e.count})`);
    }
    log('\n[DEBUG] Done. Re-run without --debug to proceed to Claude analysis.');
    process.exit(0);
  }

  if (relevantEffects.length === 0) {
    log('\nNo condition-relevant side effects found in SIDER for this drug.');
    log('Run with --debug to see all matched side effects.');
    process.exit(0);
  }

  // ── Step 4: Format and send to Claude
  log('\nStep 4 — Formatting SIDER data for Claude analysis...');
  const content = formatForClaude(drugName, relevantEffects, freqMap);

  log(`\nStep 4b — Sending to Claude (${MODEL}) for analysis...`);
  const signals = await analyzeWithClaude(apiKey, drugName, content);
  log(`         Identified ${signals.length} signal(s).`);

  if (signals.length > 0) {
    log('         Signals:');
    for (const s of signals) {
      const conditions = (s.relevant_conditions ?? []).join(', ') || 'unspecified';
      log(`           • ${s.compound_name ?? drugName} — ${s.signal_type} (${s.evidence_strength}) → ${conditions}`);
    }
  }

  // ── Step 5: Resolve conditions + generate SQL
  log('\nGenerating SQL...\n');
  const sql = await generateSQL(drugName, signals, stitchIds, matchedNames, supabaseUrl, supabaseKey);
  process.stdout.write(sql + '\n');
  log('\nDone. Review the SQL above before pasting into Supabase.');
}

main().catch(err => {
  process.stderr.write(`Fatal error: ${err.message}\n${err.stack}\n`);
  process.exit(1);
});
