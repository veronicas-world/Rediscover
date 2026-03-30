#!/usr/bin/env node
'use strict';

/**
 * Research Pipeline
 * Usage: node scripts/research-pipeline.js "<condition>"
 * Example: node scripts/research-pipeline.js "endometriosis"
 *
 * Outputs SQL to stdout; progress messages go to stderr.
 * Redirect to a file: node scripts/research-pipeline.js "endometriosis" > output.sql
 */

const { readFileSync } = require('fs');
const { randomUUID } = require('crypto');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────

const PUBMED_BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const ANTHROPIC_BASE = 'https://api.anthropic.com';
const MODEL = 'claude-sonnet-4-5';   // update if needed
const MAX_RESULTS = 20;

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

// ── PubMed ────────────────────────────────────────────────────────────────────

async function pubmedSearch(condition) {
  const strategies = [
    `"${condition}" drug repurposing`,
    `"${condition}" off-label treatment`,
    `"${condition}" novel therapeutic`,
  ];
  // Combine with OR so we cast a wide net
  const term = strategies.map(s => `(${s})`).join(' OR ');

  const url =
    `${PUBMED_BASE}/esearch.fcgi` +
    `?db=pubmed` +
    `&term=${encodeURIComponent(term)}` +
    `&retmax=${MAX_RESULTS}` +
    `&retmode=json` +
    `&sort=relevance`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`PubMed esearch failed: ${resp.status} ${resp.statusText}`);
  const data = await resp.json();
  return data.esearchresult?.idlist ?? [];
}

async function pubmedFetch(pmids) {
  if (pmids.length === 0) return [];

  const url =
    `${PUBMED_BASE}/efetch.fcgi` +
    `?db=pubmed` +
    `&id=${pmids.join(',')}` +
    `&rettype=medline` +
    `&retmode=text`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`PubMed efetch failed: ${resp.status} ${resp.statusText}`);
  const text = await resp.text();
  return parseMedline(text);
}

/**
 * Parse PubMed MEDLINE flat-file format into an array of article objects.
 * MEDLINE fields are 4-char tags followed by "- " and a value, with
 * continuation lines indented by 6 spaces.
 */
function parseMedline(text) {
  const records = [];
  const lines = text.split('\n');

  let current = null;
  let tag = null;
  let val = '';

  function saveField() {
    if (!current || !tag) return;
    const v = val.trim();
    if (!v) return;
    if (tag === 'AU') {
      // Accumulate authors as comma-separated string
      current._authors = current._authors ? `${current._authors}, ${v}` : v;
    } else if (tag === 'PMID') {
      current.PMID = v.split(' ')[0]; // strip version suffix
    } else {
      current[tag] = current[tag] ? `${current[tag]} ${v}` : v;
    }
  }

  for (const line of lines) {
    const m = line.match(/^([A-Z0-9]{2,6})\s*- (.*)/);
    if (m) {
      saveField();
      tag = m[1];
      val = m[2];
      if (tag === 'PMID') {
        if (current?.PMID) records.push(current);
        current = {};
      }
      if (!current) current = {};
    } else if (/^      /.test(line) && tag) {
      // Continuation line (6-space indent)
      val += ' ' + line.trim();
    }
  }
  saveField();
  if (current?.PMID) records.push(current);

  return records
    .map(r => ({
      pmid:     r.PMID ?? '',
      title:    (r.TI ?? '').replace(/\.$/, ''),
      abstract: r.AB ?? '',
      authors:  r._authors ?? '',
      journal:  r.TA ?? r.JT ?? '',
      date:     r.DP ?? '',
    }))
    .filter(r => r.pmid && r.abstract.length > 50); // skip records with no real abstract
}

// ── Claude ────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a medical research analyst specializing in drug repurposing for women's health. Analyze these abstracts and identify any drugs or compounds that show potential for repurposing. For each signal found, provide: compound_name, original_indication, signal_type (clinical_trial_finding, case_report, mechanism_overlap, review_article, population_study, side_effect_signal, observational_study), evidence_strength (preliminary, moderate, strong), summary, mechanism_hypothesis. Only include signals supported by the abstracts. Return as JSON array.`;

async function analyzeWithClaude(apiKey, condition, articles) {
  const formatted = articles
    .map(
      (a, i) =>
        `--- ABSTRACT ${i + 1} (PMID: ${a.pmid}) ---\n` +
        `Title: ${a.title}\n` +
        `Journal: ${a.journal}  Date: ${a.date}\n` +
        `Authors: ${a.authors}\n` +
        `Abstract: ${a.abstract}`
    )
    .join('\n\n');

  const userMessage =
    `Condition: ${condition}\n\n` +
    `Analyze the following ${articles.length} PubMed abstracts for drug repurposing signals related to ${condition}. ` +
    `For each signal, include a "pmids" field — an array of the PMID strings from the abstracts that support it. ` +
    `Return ONLY a valid JSON array (no markdown, no commentary). If no signals are found, return [].\n\n` +
    formatted;

  const resp = await fetch(`${ANTHROPIC_BASE}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Claude API error ${resp.status}: ${body}`);
  }

  const data = await resp.json();
  const rawText = data.content?.[0]?.text ?? '';

  // Extract JSON array — handles both bare arrays and ```json code blocks
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(
      `Claude did not return a JSON array. Raw response:\n${rawText}`
    );
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error(`Failed to parse Claude JSON: ${e.message}\nRaw: ${jsonMatch[0]}`);
  }
}

// ── Condition alias map ───────────────────────────────────────────────────────
// Maps common search terms to the DB names / keywords we should try when
// looking up a condition in Supabase. Add entries here as needed.
// Each key is lowercased; values are arrays of search terms tried in order.

const CONDITION_ALIASES = {
  'polycystic ovary syndrome':            ['pcos', 'polycystic ovary', 'polycystic ovarian'],
  'polycystic ovarian syndrome':          ['pcos', 'polycystic ovary', 'polycystic ovarian'],
  'pcos':                                 ['pcos', 'polycystic ovary', 'polycystic ovarian'],
  'premenstrual dysphoric disorder':      ['pmdd', 'premenstrual dysphoric'],
  'pmdd':                                 ['pmdd', 'premenstrual dysphoric'],
  'premenstrual syndrome':                ['pmdd', 'pms', 'premenstrual'],
  'menopause':                            ['menopause', 'perimenopause', 'menopausal'],
  'perimenopause':                        ['perimenopause', 'menopause', 'menopausal'],
  'vulvodynia':                           ['vulvodynia', 'vulvar pain', 'vulvar'],
  'endometriosis':                        ['endometriosis', 'endometrial'],
  'adenomyosis':                          ['adenomyosis'],
  'uterine fibroids':                     ['fibroid', 'leiomyoma', 'uterine fibroid'],
  'interstitial cystitis':               ['interstitial cystitis', 'bladder pain'],
  'fibromyalgia':                         ['fibromyalgia'],
};

// ── Supabase lookup ───────────────────────────────────────────────────────────

async function lookupConditionId(supabaseUrl, supabaseKey, condition) {
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    // Fetch all conditions with both name and description — small dataset
    const url = `${supabaseUrl}/rest/v1/conditions?select=id,name,description&limit=200`;
    const resp = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    if (!resp.ok) return null;
    const rows = await resp.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const q = condition.toLowerCase().trim();

    // Build the full list of search terms to try for this condition:
    // always include the raw input, then append any alias expansions.
    const aliasTerms = CONDITION_ALIASES[q] ?? [];
    const searchTerms = [q, ...aliasTerms.filter(t => t !== q)];

    log(`   Search terms: ${searchTerms.map(t => `"${t}"`).join(', ')}`);

    // Helper: check whether a row matches any of the search terms against
    // both its name and description fields.
    function rowMatches(r, terms) {
      const name = (r.name ?? '').toLowerCase();
      const desc = (r.description ?? '').toLowerCase();
      return terms.some(term => {
        const t = term.toLowerCase();
        return name.includes(t) || desc.includes(t) || t.includes(name);
      });
    }

    // Strategy 1 — any search term appears in name or description (or vice-versa)
    let match = rows.find(r => rowMatches(r, searchTerms));
    if (match) {
      log(`   Matched "${match.name}" via search terms (${match.id})`);
      return match.id;
    }

    // Strategy 2 — significant word overlap across name + description
    const STOP = new Set(['and', 'or', 'the', 'of', 'in', 'for', 'a', 'an', 'with', 'to', 'by']);
    // Collect all unique meaningful words from every search term
    const queryWords = [...new Set(
      searchTerms
        .join(' ')
        .split(/[\s\-\/\(\)]+/)
        .filter(w => w.length >= 4 && !STOP.has(w))
    )];

    const scored = rows
      .map(r => {
        const haystack = `${r.name} ${r.description ?? ''}`.toLowerCase();
        const haystackTokens = haystack.split(/[\s\-\/\(\)]+/);
        const score = queryWords.reduce((acc, qw) => {
          if (haystackTokens.some(nw => nw === qw))                        return acc + 2;
          if (haystackTokens.some(nw => nw.includes(qw) || qw.includes(nw))) return acc + 1;
          return acc;
        }, 0);
        return { row: r, score };
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      match = scored[0].row;
      log(`   Matched "${match.name}" via word overlap (score: ${scored[0].score}, id: ${match.id})`);
      return match.id;
    }

    // Strategy 3 — acronym: check if any short DB name is an acronym whose
    // letters appear (in order) as initials of the query words.
    const initials = queryWords.map(w => w[0]);
    match = rows.find(r => {
      const name = r.name.replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (name.length < 2 || name.length > 6) return false;
      let pos = 0;
      for (const ch of name) {
        const found = initials.indexOf(ch, pos);
        if (found === -1) return false;
        pos = found + 1;
      }
      return true;
    });
    if (match) {
      log(`   Matched "${match.name}" via acronym (${match.id})`);
      return match.id;
    }

    // No match — list everything so the user can identify the right row
    log(`   No match found for "${condition}".`);
    log(`   Conditions in your database:`);
    for (const r of rows) log(`     • ${r.name}  →  ${r.id}`);
    log(`   Tip: re-run with the exact DB name above, or replace CONDITION_ID_HERE manually.`);
    return null;

  } catch (err) {
    log(`   Lookup error: ${err.message}`);
    return null;
  }
}

// ── Date parsing ─────────────────────────────────────────────────────────────

const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

/**
 * Convert a PubMed DP (date of publication) string to YYYY-MM-DD.
 * Examples:
 *   "2020 Feb"        → "2020-02-01"
 *   "2020 Feb 15"     → "2020-02-15"
 *   "2020"            → "2020-01-01"
 *   "2020 Feb-Mar"    → "2020-02-01"  (range: take first month)
 *   unparseable       → null
 */
function parsePubmedDate(dp) {
  if (!dp) return null;
  const s = dp.trim();

  // Extract year
  const yearMatch = s.match(/\b(19|20)\d{2}\b/);
  if (!yearMatch) return null;
  const year = yearMatch[1] + s.slice(yearMatch.index + 2, yearMatch.index + 4);

  // Extract month abbreviation (first 3 chars, case-insensitive)
  const monthMatch = s.match(/\b([A-Za-z]{3})/);
  const month = monthMatch ? MONTH_MAP[monthMatch[1].toLowerCase()] : null;
  if (!month) return `${year}-01-01`;

  // Extract day
  const dayMatch = s.match(/\b([0-3]?\d)\b(?!\d)/g);
  // dayMatch may contain the year digits too, so filter to 1–31
  const day = dayMatch
    ? dayMatch.map(Number).find(n => n >= 1 && n <= 31 && String(n) !== year)
    : null;
  const dd = day ? String(day).padStart(2, '0') : '01';

  return `${year}-${month}-${dd}`;
}

// ── SQL generation ────────────────────────────────────────────────────────────

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

/**
 * Title-case a drug/compound name.
 * Capitalises the first letter of each word; leaves subsequent letters as-is
 * so acronyms like "GLP-1" or "mTOR" survive if Claude returns them correctly.
 * Handles hyphenated words (e.g. "anti-inflammatory" → "Anti-Inflammatory").
 */
function toTitleCase(name) {
  if (!name) return name;
  return name
    .split(/(\s+|-)/)
    .map((part, i, arr) => {
      // Preserve whitespace/hyphen tokens unchanged
      if (/^[\s-]+$/.test(part)) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('');
}

function generateSQL(condition, conditionId, signals, articlesByPmid) {
  const today = new Date().toISOString().slice(0, 10);
  const out = [];

  out.push('-- ================================================================');
  out.push(`-- Rediscover Women — Research Pipeline Output`);
  out.push(`-- Condition : ${condition}`);
  out.push(`-- Generated : ${today}`);
  out.push(`-- Model     : ${MODEL}`);
  out.push('-- ================================================================');
  out.push('');

  if (!conditionId) {
    out.push(`-- ⚠  Condition "${condition}" was not found in your database.`);
    out.push(`--    Run the query below to find the correct ID, then replace`);
    out.push(`--    every occurrence of 'CONDITION_ID_HERE' in this file.`);
    out.push(`--`);
    out.push(`--    SELECT id, name FROM conditions WHERE name ILIKE '%${condition}%';`);
    out.push('');
    conditionId = 'CONDITION_ID_HERE';
  }

  if (signals.length === 0) {
    out.push('-- No repurposing signals were identified from the analyzed abstracts.');
    return out.join('\n');
  }

  // Pre-assign deterministic UUIDs for this run; normalise compound name to title case
  const enriched = signals.map(sig => ({
    ...sig,
    compound_name: toTitleCase(sig.compound_name),
    compoundId: randomUUID(),
    signalId:   randomUUID(),
    pmids:      Array.isArray(sig.pmids) ? sig.pmids : [],
    sourceIds:  (Array.isArray(sig.pmids) ? sig.pmids : []).map(() => randomUUID()),
  }));

  // ── STEP 1: Compounds ──────────────────────────────────────────────────────
  out.push('-- ── STEP 1: Compounds (safe to run multiple times) ──────────────');
  for (const s of enriched) {
    out.push(`INSERT INTO compounds (id, name, drug_class, fda_status) VALUES (`);
    out.push(`  ${esc(s.compoundId)},`);
    out.push(`  ${esc(s.compound_name)},`);
    out.push(`  ${esc(s.original_indication ?? null)},`);
    out.push(`  'FDA Approved'`);
    out.push(`) ON CONFLICT (name) DO NOTHING;`);
    out.push('');
  }

  // ── STEP 2: Signals ────────────────────────────────────────────────────────
  out.push('-- ── STEP 2: Repurposing signals ─────────────────────────────────');
  for (const s of enriched) {
    // Use SELECT to resolve the compound_id by name — handles pre-existing rows
    out.push(`INSERT INTO repurposing_signals`);
    out.push(`  (id, condition_id, compound_id, signal_type, evidence_strength, summary, mechanism_hypothesis, status)`);
    out.push(`SELECT`);
    out.push(`  ${esc(s.signalId)},`);
    out.push(`  ${esc(conditionId)},`);
    out.push(`  c.id,`);
    out.push(`  ${esc(s.signal_type)},`);
    out.push(`  ${esc(s.evidence_strength)},`);
    out.push(`  ${esc(s.summary)},`);
    out.push(`  ${esc(s.mechanism_hypothesis)},`);
    out.push(`  'active'`);
    out.push(`FROM compounds c`);
    out.push(`WHERE c.name = ${esc(s.compound_name)};`);
    out.push('');
  }

  // ── STEP 3: Sources ────────────────────────────────────────────────────────
  out.push('-- ── STEP 3: Sources (PubMed citations) ─────────────────────────');
  for (const s of enriched) {
    if (s.pmids.length === 0) continue;
    for (let i = 0; i < s.pmids.length; i++) {
      const pmid     = String(s.pmids[i]);
      const sourceId = s.sourceIds[i];
      const art      = articlesByPmid[pmid];

      if (!art) {
        // PMID from Claude not in our fetch set — output placeholder
        out.push(`-- Note: PMID ${pmid} was not in the fetched batch; review manually.`);
        continue;
      }

      // Truncate author string to avoid DB limits
      const authors = art.authors.length > 300
        ? art.authors.slice(0, 297) + '...'
        : art.authors;

      out.push(`INSERT INTO sources`);
      out.push(`  (id, signal_id, source_type, external_id, title, authors, journal, publication_date, url)`);
      out.push(`VALUES (`);
      out.push(`  ${esc(sourceId)},`);
      out.push(`  ${esc(s.signalId)},`);
      out.push(`  'pubmed',`);
      out.push(`  ${esc(pmid)},`);
      out.push(`  ${esc(art.title)},`);
      out.push(`  ${esc(authors)},`);
      out.push(`  ${esc(art.journal)},`);
      out.push(`  ${esc(parsePubmedDate(art.date))},`);
      out.push(`  ${esc(`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`)}`);
      out.push(`);`);
      out.push('');
    }
  }

  out.push('-- ── End of pipeline output ──────────────────────────────────────');
  return out.join('\n');
}

// ── Logging (stderr so stdout stays clean SQL) ────────────────────────────────

function log(msg) {
  process.stderr.write(msg + '\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const condition = process.argv[2];

  if (!condition) {
    process.stderr.write(
      'Usage:   node scripts/research-pipeline.js "<condition>"\n' +
      'Example: node scripts/research-pipeline.js "endometriosis"\n'
    );
    process.exit(1);
  }

  // Load environment
  const env = loadEnv();
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    process.stderr.write(
      'Error: ANTHROPIC_API_KEY is not set in .env.local\n' +
      'Add: ANTHROPIC_API_KEY=sk-ant-...\n'
    );
    process.exit(1);
  }

  // ── Step 1: PubMed search
  log(`\nStep 1 — Searching PubMed for: "${condition}"`);
  const pmids = await pubmedSearch(condition);

  if (pmids.length === 0) {
    log('No PubMed results found. Try a different condition name.');
    process.exit(0);
  }
  log(`         Found ${pmids.length} article IDs. Fetching abstracts...`);

  const articles = await pubmedFetch(pmids);
  log(`         Parsed ${articles.length} abstracts with content.`);

  if (articles.length === 0) {
    log('Could not extract usable abstracts. Exiting.');
    process.exit(0);
  }

  // ── Step 2: Claude analysis
  log(`\nStep 2 — Sending ${articles.length} abstracts to Claude (${MODEL})...`);
  const signals = await analyzeWithClaude(apiKey, condition, articles);
  log(`         Identified ${signals.length} repurposing signal(s).`);

  if (signals.length > 0) {
    log('         Signals found:');
    for (const s of signals) {
      log(`           • ${s.compound_name} — ${s.signal_type} (${s.evidence_strength})`);
    }
  }

  // ── Step 3: Condition lookup
  log(`\nStep 3 — Looking up condition in Supabase...`);
  const conditionId = await lookupConditionId(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    condition
  );
  if (!conditionId) {
    log(`         Not found — you will need to fill in the condition ID manually.`);
  }

  // Build PMID → article lookup map
  const articlesByPmid = {};
  for (const a of articles) articlesByPmid[a.pmid] = a;

  // ── Output SQL to stdout
  log('\nGenerating SQL...\n');
  const sql = generateSQL(condition, conditionId, signals, articlesByPmid);
  process.stdout.write(sql + '\n');
  log('\nDone. Review the SQL above before pasting into Supabase.');
}

main().catch(err => {
  process.stderr.write(`\nFatal error: ${err.message}\n`);
  process.exit(1);
});
