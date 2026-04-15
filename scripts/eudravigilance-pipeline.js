#!/usr/bin/env node
'use strict';

/**
 * EudraVigilance EVDAS Pipeline
 * Usage: node scripts/eudravigilance-pipeline.js "<drug class>"
 *        node scripts/eudravigilance-pipeline.js "<drug class>" --debug
 * Example: node scripts/eudravigilance-pipeline.js "statins"
 *          node scripts/eudravigilance-pipeline.js "metformin" --debug
 *
 * --debug  Prints substance lookups and raw response shapes, then exits before Claude.
 *
 * Queries the EudraVigilance ADR Reports database (adrreports.eu / dap.ema.europa.eu)
 * for adverse event reports involving female patients. Requires a session cookie
 * from a logged-in EudraVigilance session stored in .env.local as EMA_SESSION_COOKIE.
 *
 * FREE ACCESS: Register at https://register.ema.europa.eu — no charge for public/research use.
 * After logging in at https://dap.ema.europa.eu, export your session cookie via browser
 * DevTools > Application > Cookies > dap.ema.europa.eu and paste as EMA_SESSION_COOKIE=...
 *
 * Progress messages go to stderr; SQL goes to stdout.
 */

const { readFileSync } = require('fs');
const { randomUUID } = require('crypto');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────

const ADRREPORTS_BASE   = 'https://www.adrreports.eu';
const EVDAS_BASE        = 'https://dap.ema.europa.eu/analyticsSOAP/saw.dll';
const ANTHROPIC_BASE    = 'https://api.anthropic.com';
const MODEL             = 'claude-opus-4-6';
const REQUEST_DELAY_MS  = 2000;

// ── Drug class map (mirrors openfda-pipeline.js) ──────────────────────────────

const DRUG_CLASS_MAP = {
  statins:               ['atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin', 'lovastatin', 'fluvastatin', 'pitavastatin'],
  'glp-1 agonists':      ['semaglutide', 'liraglutide', 'dulaglutide', 'exenatide', 'tirzepatide'],
  'glp-1':               ['semaglutide', 'liraglutide', 'dulaglutide', 'exenatide', 'tirzepatide'],
  'dopamine agonists':   ['bromocriptine', 'cabergoline', 'pramipexole', 'ropinirole'],
  ssris:                 ['sertraline', 'fluoxetine', 'escitalopram', 'citalopram', 'paroxetine', 'fluvoxamine'],
  nsaids:                ['ibuprofen', 'naproxen', 'celecoxib', 'diclofenac', 'meloxicam'],
  'beta blockers':       ['metoprolol', 'propranolol', 'atenolol', 'carvedilol', 'bisoprolol'],
  'aromatase inhibitors':['letrozole', 'anastrozole', 'exemestane'],
  naltrexone:            ['naltrexone'],
  metformin:             ['metformin'],
  spironolactone:        ['spironolactone'],
};

// ── Gynecological / hormonal reaction terms (same list as openfda-pipeline.js) ─

const GYNAE_TERMS = [
  'menstruation', 'menstrual', 'dysmenorrhoea', 'dysmenorrhea', 'menorrhagia',
  'metrorrhagia', 'amenorrhoea', 'amenorrhea', 'oligomenorrhoea', 'oligomenorrhea',
  'menstrual disorder', 'heavy menstrual bleeding', 'uterine bleeding',
  'endometriosis', 'endometrial', 'adenomyosis',
  'pelvic pain', 'pelvic', 'uterine', 'uterine pain', 'ovarian', 'ovarian cyst',
  'polycystic ovaries', 'vaginal', 'vaginal pain', 'vulval pain', 'vulvodynia', 'vulvar',
  'dyspareunia', 'mastalgia', 'breast pain',
  'abdominal pain', 'cramping',
  'depression', 'depressed mood', 'anxiety', 'mood', 'mood swings', 'irritability',
  'insomnia', 'sleep disorder', 'fatigue', 'cognitive',
  'weight increased', 'weight gain', 'hirsutism', 'hair loss', 'alopecia', 'acne',
  'insulin resistance', 'androgen', 'testosterone', 'hormone',
  'fertility', 'infertility', 'anovulation',
  'hot flush', 'hot flash', 'night sweat', 'flushing', 'hyperhidrosis',
  'premenstrual syndrome', 'premenstrual dysphoric disorder', 'pmdd',
  'polycystic ovary syndrome', 'pcos',
  'libido', 'decreased libido', 'sexual dysfunction',
  'urinary', 'urinary incontinence', 'interstitial cystitis',
];

// ── Condition alias map ───────────────────────────────────────────────────────

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Substance lookup (public, no auth required) ───────────────────────────────
//
// adrreports.eu publishes an A-Z table of substance names + their internal
// EudraVigilance substance codes. These pages are publicly accessible and
// map to the substance detail pages on dap.ema.europa.eu.

async function lookupSubstanceCode(drugName, debug = false) {
  const letter = drugName.trim().charAt(0).toLowerCase();
  const url    = `${ADRREPORTS_BASE}/tables/substance/${letter}.html`;

  if (debug) log(`[DEBUG] Substance table URL: ${url}`);

  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WHEL-research-pipeline/1.0)' },
    });
    if (!resp.ok) {
      log(`   Substance table fetch failed: ${resp.status} for letter "${letter}"`);
      return null;
    }
    const html = await resp.text();

    // Each row: <a href="...&P3=1+{CODE}">{SUBSTANCE_NAME}</a>
    const needle = drugName.toUpperCase();
    const rowRegex = /<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    let match;
    while ((match = rowRegex.exec(html)) !== null) {
      const name = match[2].trim().toUpperCase();
      // Exact match first, then prefix match for compound names
      if (name === needle || name.startsWith(needle + ' ')) {
        const codeMatch = match[1].match(/P3=1\+(\d+)/);
        if (codeMatch) {
          if (debug) log(`[DEBUG] Matched "${match[2]}" with code ${codeMatch[1]}`);
          return { name: match[2].trim(), code: codeMatch[1], href: match[1] };
        }
      }
    }
    if (debug) log(`[DEBUG] No substance code found for "${drugName}" in letter table`);
    return null;
  } catch (err) {
    log(`   Substance lookup error for "${drugName}": ${err.message}`);
    return null;
  }
}

// ── EudraVigilance data query (requires session cookie) ───────────────────────
//
// The EVDAS Drug Analysis Print (DAP) page shows all reported adverse reactions
// for a substance, including counts broken down by gender.
// Requires a valid session cookie set in .env.local as EMA_SESSION_COOKIE.
//
// To obtain your session cookie:
//   1. Register at https://register.ema.europa.eu (free, no charge)
//   2. Log in at https://dap.ema.europa.eu
//   3. Open DevTools > Application > Cookies > dap.ema.europa.eu
//   4. Copy the value of the _WL_AUTHCOOKIE_JSESSIONID or OAMAuthnCookie cookie
//   5. Add to .env.local: EMA_SESSION_COOKIE=<cookie_name>=<cookie_value>
//      Example: EMA_SESSION_COOKIE=_WL_AUTHCOOKIE_JSESSIONID=abc123xyz

async function fetchEVDASData(substanceCode, substanceName, sessionCookie, debug = false) {
  const params = new URLSearchParams({
    PortalPath: '/shared/PHV DAP/_portal/DAP',
    Action:     'Navigate',
    P0:         '1',
    P1:         'eq',
    P2:         '"Line Listing Objects"."Substance High Level Code"',
    P3:         `1 ${substanceCode}`,
  });

  const url = `${EVDAS_BASE}?PortalPages&${params.toString()}`;

  if (debug) log(`[DEBUG] EVDAS DAP URL:\n  ${url}`);

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    'Accept':     'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Cookie':     sessionCookie,
  };

  try {
    const resp = await fetch(url, { headers });
    if (debug) log(`[DEBUG] EVDAS response status: ${resp.status} ${resp.statusText}`);

    if (resp.status === 302 || resp.url.includes('loginpublic.ema.europa.eu') || resp.url.includes('SAWLogon')) {
      return { error: 'auth_required' };
    }

    if (!resp.ok) {
      return { error: `http_${resp.status}`, message: resp.statusText };
    }

    const html = await resp.text();

    if (debug) {
      log(`[DEBUG] Response length: ${html.length} chars`);
      log(`[DEBUG] First 1000 chars:\n  ${html.slice(0, 1000)}`);
    }

    // Check for Oracle BI error codes (indicates session expired or invalid)
    if (html.includes('GCARFLCS') || html.includes('Your session has expired') || html.includes('SAWLogon')) {
      return { error: 'session_expired' };
    }

    return { html };
  } catch (err) {
    return { error: 'fetch_error', message: err.message };
  }
}

// ── Parse EVDAS Drug Analysis Print HTML ──────────────────────────────────────
//
// The DAP report contains an Oracle BI table with columns:
//   Reaction | Total | Serious | Fatal | Female | Male | ...
// We extract rows where Female count > 0 and reaction is in our GYNAE_TERMS list.

function parseEVDASReactions(html, debug = false) {
  const reactions = [];

  // Oracle BI renders tables as <table> with class containing "DataTable" or similar.
  // Row cells are <td> or <th> elements. Extract all table data.
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  const rowRegex   = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex  = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;

  function stripTags(str) {
    return str.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim();
  }

  let tableMatch;
  let tableIndex = 0;
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    tableIndex++;
    const tableHTML = tableMatch[1];
    const rows = [];

    let rowMatch;
    rowRegex.lastIndex = 0;
    while ((rowMatch = rowRegex.exec(tableHTML)) !== null) {
      const cells = [];
      let cellMatch;
      cellRegex.lastIndex = 0;
      while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        cells.push(stripTags(cellMatch[1]));
      }
      if (cells.length >= 2) rows.push(cells);
    }

    if (rows.length < 2) continue;

    // Find the header row to identify column positions
    const header = rows[0].map(c => c.toLowerCase());
    const reactionCol = header.findIndex(h => h.includes('reaction') || h.includes('pt term') || h.includes('preferred term'));
    const totalCol    = header.findIndex(h => h.includes('total') && !h.includes('female') && !h.includes('male'));
    const femaleCol   = header.findIndex(h => h.includes('female') || h.includes('f '));

    if (reactionCol === -1) continue;

    if (debug && tableIndex <= 3) {
      log(`[DEBUG] Table ${tableIndex} header: ${JSON.stringify(rows[0])}`);
      log(`[DEBUG] Columns found: reaction=${reactionCol}, total=${totalCol}, female=${femaleCol}`);
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row[reactionCol]) continue;

      const reactionName = row[reactionCol].toLowerCase().trim();
      // Check if this reaction term is in our gynecological terms list
      const isRelevant = GYNAE_TERMS.some(term =>
        reactionName.includes(term.toLowerCase()) || term.toLowerCase().includes(reactionName)
      );

      if (!isRelevant) continue;

      const total  = totalCol  !== -1 ? (parseInt(row[totalCol], 10)  || 0) : null;
      const female = femaleCol !== -1 ? (parseInt(row[femaleCol], 10) || 0) : null;

      if (female !== null && female === 0) continue;

      reactions.push({
        reaction: row[reactionCol],
        total:    total,
        female:   female,
      });
    }
  }

  return reactions;
}

// ── Claude analysis ───────────────────────────────────────────────────────────

const CONDITIONS_CONTEXT = `
The six conditions covered by this research tool are:
1. Endometriosis — estrogen-dependent inflammatory condition; relevant reactions: menstrual, pelvic pain, inflammatory, mood
2. PMDD — severe luteal-phase mood disorder; relevant: mood, menstrual, pain
3. PCOS — metabolic-hormonal condition; relevant: metabolic, menstrual, ovarian, mood
4. Adenomyosis — uterine inflammatory condition; relevant: menstrual, uterine pain, inflammatory
5. Vulvodynia — chronic vulvovaginal pain; relevant: vulvar pain, sexual pain, urinary, mood
6. Menopause — hormonal transition; relevant: vasomotor, mood, metabolic, urinary, bone

Cross-condition overlaps:
- Endometriosis and Adenomyosis share estrogen-driven inflammatory pathways
- PCOS metabolic dysregulation creates upstream overlap with all conditions
- Pain signals implicate endometriosis, adenomyosis, and vulvodynia
- Mood signals implicate PMDD and menopause (also secondary to chronic pain)
- Vasomotor signals (hot flush, night sweat) primarily menopause
`.trim();

const EVDAS_SYSTEM_PROMPT = `You are a pharmacovigilance analyst specializing in women's health and drug repurposing. You are reviewing EudraVigilance (European adverse event database) data.

${CONDITIONS_CONTEXT}

For each drug with relevant findings, identify cross-condition repurposing signals — cases where a drug approved for another condition shows reaction patterns relevant to any of the six conditions above.

For each signal, provide:
- drug_name: generic drug name (lowercase)
- signal_type: "cross_condition_signal" or "side_effect_signal" or "pathway_signal"
- evidence_strength: "preliminary", "moderate", or "strong"
- summary: 2-3 sentences including EudraVigilance report counts. Format: "In EudraVigilance adverse event data for [drug], female patients reported [key finding]. [Scientific interpretation]. Full-scale analysis across all European reporters may reveal additional patterns."
- mechanism_hypothesis: 1-2 sentences on biological mechanism
- relevant_conditions: array of condition names from this exact list: ["endometriosis", "premenstrual dysphoric disorder", "polycystic ovary syndrome", "adenomyosis", "vulvodynia", "menopause"]
- reaction_counts: object mapping reaction terms to female patient report counts (sorted descending)

Generate one signal per (drug, condition) pair. Return ONLY a valid JSON array. If no signals are found, return [].`;

async function analyzeWithClaude(apiKey, drugClass, content, debug = false) {
  if (debug) {
    log(`[DEBUG] Claude input content (first 500 chars):\n  ${content.slice(0, 500)}`);
    return [];
  }

  const userMessage =
    `Drug class: ${drugClass}\n\n` +
    `The following is a summary of EudraVigilance adverse event data for female patients:\n\n` +
    `${content}\n\n` +
    `For each drug with relevant findings, generate one signal entry per relevant condition. ` +
    `Return ONLY a valid JSON array (no markdown, no commentary). If no signals are found, return [].`;

  const resp = await fetch(`${ANTHROPIC_BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'x-api-key':     apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      MODEL,
      max_tokens: 6000,
      system:     EVDAS_SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: userMessage }],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Claude API error ${resp.status}: ${body}`);
  }

  const data = await resp.json();
  const rawText = data.content?.[0]?.text ?? '';

  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error(`Claude did not return a JSON array.\n${rawText}`);

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    const partial = [...jsonMatch[0].matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}/g)];
    const recovered = [];
    for (const m of partial) {
      try { recovered.push(JSON.parse(m[0])); } catch { /* skip */ }
    }
    if (recovered.length > 0) return recovered;
    throw new Error(`Failed to parse Claude JSON from response.`);
  }
}

// ── Supabase condition lookup ─────────────────────────────────────────────────

async function lookupConditionId(supabaseUrl, supabaseKey, condition) {
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    const resp = await fetch(`${supabaseUrl}/rest/v1/conditions?select=id,name,description&limit=200`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    if (!resp.ok) return null;
    const rows = await resp.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const q           = condition.toLowerCase().trim();
    const aliasTerms  = CONDITION_ALIASES[q] ?? [];
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
        const hay = `${r.name} ${r.description ?? ''}`.toLowerCase();
        const tok = hay.split(/[\s\-\/\(\)]+/);
        const score = queryWords.reduce((acc, qw) => {
          if (tok.some(nw => nw === qw)) return acc + 2;
          if (tok.some(nw => nw.includes(qw) || qw.includes(nw))) return acc + 1;
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

async function generateSQL(drugClass, signals, supabaseUrl, supabaseKey) {
  const today = new Date().toISOString().slice(0, 10);
  const out   = [];

  out.push('-- ================================================================');
  out.push(`-- WHEL — EudraVigilance Pipeline Output`);
  out.push(`-- Drug class : ${drugClass}`);
  out.push(`-- Generated  : ${today}`);
  out.push(`-- Model      : ${MODEL}`);
  out.push(`-- Source     : EudraVigilance EVDAS (European Medicines Agency)`);
  out.push('-- ================================================================');
  out.push('');

  if (signals.length === 0) {
    out.push('-- No cross-condition signals were identified from the EudraVigilance data.');
    return out.join('\n');
  }

  // Resolve condition IDs
  const conditionNames  = [...new Set(signals.flatMap(s => s.relevant_conditions ?? []))];
  const conditionIdMap  = {};
  if (conditionNames.length > 0) {
    log(`\nResolving ${conditionNames.length} condition ID(s)...`);
    for (const cname of conditionNames) {
      const id = await lookupConditionId(supabaseUrl, supabaseKey, cname);
      conditionIdMap[cname] = id ?? 'CONDITION_ID_HERE';
      log(`   ${cname} -> ${conditionIdMap[cname]}`);
    }
  }

  // Expand signals: one row per (drug, condition)
  const enriched = [];
  for (const sig of signals) {
    const drug_name  = toTitleCase(sig.drug_name);
    const conditions = sig.relevant_conditions ?? [];
    if (conditions.length === 0) {
      enriched.push({ ...sig, drug_name, conditionId: 'CONDITION_ID_HERE', conditionName: null, compoundId: randomUUID(), signalId: randomUUID() });
    } else {
      for (const cname of conditions) {
        enriched.push({ ...sig, drug_name, conditionId: conditionIdMap[cname] ?? 'CONDITION_ID_HERE', conditionName: cname, compoundId: randomUUID(), signalId: randomUUID() });
      }
    }
  }

  const seenCompounds = new Set();

  // ── STEP 1: Compounds ──────────────────────────────────────────────────────
  out.push('-- ── STEP 1: Compounds (safe to run multiple times) ──────────────');
  for (const s of enriched) {
    if (seenCompounds.has(s.drug_name)) continue;
    seenCompounds.add(s.drug_name);
    out.push(`INSERT INTO compounds (id, name, drug_class, fda_status) VALUES (`);
    out.push(`  ${esc(s.compoundId)},`);
    out.push(`  ${esc(s.drug_name)},`);
    out.push(`  ${esc(drugClass)},`);
    out.push(`  'EMA Approved'`);
    out.push(`) ON CONFLICT (name) DO NOTHING;`);
    out.push('');
  }

  // ── STEP 2: Signals ────────────────────────────────────────────────────────
  out.push('-- ── STEP 2: Repurposing signals ─────────────────────────────────');
  for (const s of enriched) {
    if (s.conditionId === 'CONDITION_ID_HERE') {
      out.push(`--   Could not resolve condition "${s.conditionName}" — replace CONDITION_ID_HERE manually.`);
    }
    out.push(`INSERT INTO repurposing_signals`);
    out.push(`  (id, condition_id, compound_id, signal_type, evidence_strength, summary, mechanism_hypothesis, status)`);
    out.push(`SELECT`);
    out.push(`  ${esc(s.signalId)},`);
    out.push(`  ${esc(s.conditionId)},`);
    out.push(`  c.id,`);
    out.push(`  ${esc(s.signal_type)},`);
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

  // ── STEP 3: Sources ────────────────────────────────────────────────────────
  out.push('-- ── STEP 3: EudraVigilance source citations ────────────────────');
  const evdasUrl = 'https://www.adrreports.eu/en/search_subst.html';
  const seenSigs = new Set();

  for (const s of enriched) {
    if (seenSigs.has(s.signalId)) continue;
    seenSigs.add(s.signalId);

    // Delete existing EudraVigilance sources for this signal on re-runs
    out.push(`DELETE FROM sources`);
    out.push(`WHERE source_type = 'eudravigilance'`);
    out.push(`  AND signal_id = (`);
    out.push(`    SELECT rs.id FROM repurposing_signals rs`);
    out.push(`    JOIN compounds c ON c.id = rs.compound_id`);
    out.push(`    WHERE c.name = ${esc(s.drug_name)}`);
    out.push(`      AND rs.condition_id = ${esc(s.conditionId)}`);
    out.push(`    LIMIT 1`);
    out.push(`  );`);
    out.push('');

    const signalSubquery =
      `(SELECT rs.id FROM repurposing_signals rs ` +
      `JOIN compounds c ON c.id = rs.compound_id ` +
      `WHERE c.name = ${esc(s.drug_name)} AND rs.condition_id = ${esc(s.conditionId)} LIMIT 1)`;

    const reactionCounts = s.reaction_counts ?? {};
    const topReactions   = Object.entries(reactionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([r, n]) => `${r}: ${n}`)
      .join('; ');

    const title = `EudraVigilance EVDAS: ${s.drug_name} — female patient adverse reaction data` +
      (topReactions ? ` (${topReactions})` : '');

    out.push(`INSERT INTO sources`);
    out.push(`  (id, signal_id, source_type, external_id, title, authors, journal, publication_date, url)`);
    out.push(`VALUES (`);
    out.push(`  gen_random_uuid(), ${signalSubquery}, 'eudravigilance',`);
    out.push(`  ${esc(`EVDAS-${s.drug_name.toUpperCase()}`)},`);
    out.push(`  ${esc(title)},`);
    out.push(`  NULL, 'EudraVigilance EVDAS (European Medicines Agency)', ${esc(today)}, ${esc(evdasUrl)}`);
    out.push(`);`);
    out.push('');
  }

  out.push('-- ── End of pipeline output ──────────────────────────────────────');
  return out.join('\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const args      = process.argv.slice(2);
  const drugClass = args.find(a => !a.startsWith('--'));
  const debug     = args.includes('--debug');

  if (!drugClass) {
    process.stderr.write(
      'Usage:   node scripts/eudravigilance-pipeline.js "<drug class>"\n' +
      'Example: node scripts/eudravigilance-pipeline.js "statins"\n' +
      '\n' +
      'Requires EMA_SESSION_COOKIE in .env.local.\n' +
      'Free registration: https://register.ema.europa.eu\n'
    );
    process.exit(1);
  }

  const env           = loadEnv();
  const apiKey        = env.ANTHROPIC_API_KEY;
  const sessionCookie = env.EMA_SESSION_COOKIE;

  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    process.stderr.write('Error: ANTHROPIC_API_KEY is not set in .env.local\n');
    process.exit(1);
  }

  if (!sessionCookie) {
    process.stderr.write(
      '\nError: EMA_SESSION_COOKIE is not set in .env.local.\n\n' +
      'EudraVigilance EVDAS requires a free registered account:\n' +
      '  1. Register at https://register.ema.europa.eu (no charge)\n' +
      '  2. Log in at https://dap.ema.europa.eu\n' +
      '  3. Open DevTools > Application > Cookies > dap.ema.europa.eu\n' +
      '  4. Copy the _WL_AUTHCOOKIE_JSESSIONID or OAMAuthnCookie value\n' +
      '  5. Add to .env.local:  EMA_SESSION_COOKIE=_WL_AUTHCOOKIE_JSESSIONID=<value>\n\n' +
      'Note: Session cookies expire after inactivity. Re-copy if you see auth errors.\n'
    );
    process.exit(1);
  }

  // Resolve drug list
  const inputLower = drugClass.toLowerCase().trim();
  const drugNames  = DRUG_CLASS_MAP[inputLower] ?? [inputLower];

  log(`\nEudraVigilance Pipeline — Drug class: "${drugClass}"`);
  log(`Drugs to query: ${drugNames.join(', ')}`);

  // ── Step 1: Substance code lookup ─────────────────────────────────────────
  log(`\nStep 1 — Looking up EudraVigilance substance codes...`);
  const substanceLookups = [];
  for (const drug of drugNames) {
    const result = await lookupSubstanceCode(drug, debug);
    if (result) {
      log(`   ${drug} -> code ${result.code} (${result.name})`);
      substanceLookups.push({ drug, ...result });
    } else {
      log(`   ${drug} -> not found in EudraVigilance substance table (may use a different name)`);
    }
    await sleep(500);
  }

  if (substanceLookups.length === 0) {
    log(`\nNo substance codes found for "${drugClass}". Check spelling or try individual drug names.`);
    process.exit(0);
  }

  // ── Step 2: Fetch EVDAS data ───────────────────────────────────────────────
  log(`\nStep 2 — Fetching EudraVigilance EVDAS reaction data...`);
  const allDrugData = [];

  for (const sub of substanceLookups) {
    log(`   Querying ${sub.name} (code ${sub.code})...`);
    const result = await fetchEVDASData(sub.code, sub.name, sessionCookie, debug);

    if (result.error === 'auth_required' || result.error === 'session_expired') {
      process.stderr.write(
        `\nError: EudraVigilance session invalid or expired.\n` +
        `Your EMA_SESSION_COOKIE in .env.local needs to be refreshed.\n` +
        `Log in at https://dap.ema.europa.eu and copy a fresh session cookie.\n`
      );
      process.exit(1);
    }

    if (result.error) {
      log(`   Warning: Could not fetch data for ${sub.name}: ${result.error} ${result.message ?? ''}`);
      await sleep(REQUEST_DELAY_MS);
      continue;
    }

    const reactions = parseEVDASReactions(result.html, debug);
    const femaleReactions = reactions.filter(r => r.female === null || r.female > 0);
    log(`   ${sub.name}: found ${femaleReactions.length} relevant female-patient reactions`);

    if (femaleReactions.length > 0) {
      allDrugData.push({
        drug:        sub.drug,
        name:        sub.name,
        reactions:   femaleReactions,
        detailUrl:   `${EVDAS_BASE}?PortalPages&PortalPath=%2Fshared%2FPHV%20DAP%2F_portal%2FDAP&Action=Navigate&P0=1&P1=eq&P2=%22Line%20Listing%20Objects%22.%22Substance%20High%20Level%20Code%22&P3=1+${sub.code}`,
      });
    }

    await sleep(REQUEST_DELAY_MS);
  }

  if (debug) {
    log(`\n[DEBUG] Summary: found data for ${allDrugData.length}/${substanceLookups.length} substances`);
    for (const d of allDrugData) {
      log(`  ${d.name}: ${d.reactions.length} relevant reactions`);
      for (const r of d.reactions.slice(0, 5)) {
        log(`    ${r.reaction} | total=${r.total ?? 'N/A'} | female=${r.female ?? 'N/A'}`);
      }
    }
    process.exit(0);
  }

  if (allDrugData.length === 0) {
    log(`\nNo relevant female-patient reactions found. Exiting.`);
    process.exit(0);
  }

  // ── Step 3: Claude analysis ────────────────────────────────────────────────
  log(`\nStep 3 — Sending data to Claude (${MODEL}) for signal analysis...`);

  const sections = allDrugData.map(d => {
    const reactionLines = d.reactions
      .sort((a, b) => (b.female ?? b.total ?? 0) - (a.female ?? a.total ?? 0))
      .map(r => `  ${r.reaction}: female=${r.female ?? 'N/A'}, total=${r.total ?? 'N/A'}`)
      .join('\n');
    return `-- ${d.name.toUpperCase()} --\nDetail: ${d.detailUrl}\n${reactionLines}`;
  });

  const content = sections.join('\n\n');
  const signals = await analyzeWithClaude(apiKey, drugClass, content);
  log(`   Identified ${signals.length} repurposing signal(s).`);
  for (const s of signals) {
    log(`     ${s.drug_name} -> ${(s.relevant_conditions ?? []).join(', ')} (${s.evidence_strength})`);
  }

  // ── Step 4: SQL generation ─────────────────────────────────────────────────
  log(`\nGenerating SQL...`);
  const sql = await generateSQL(
    drugClass,
    signals,
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  process.stdout.write(sql + '\n');
  log('\nDone. Review the SQL above before pasting into Supabase.');
}

main().catch(err => {
  process.stderr.write(`\nFatal error: ${err.message}\n`);
  process.exit(1);
});
