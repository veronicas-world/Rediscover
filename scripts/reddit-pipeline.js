#!/usr/bin/env node
'use strict';

/**
 * Reddit Community Pipeline
 * Usage: node scripts/reddit-pipeline.js "<condition>"
 * Example: node scripts/reddit-pipeline.js "endometriosis"
 *
 * Fetches top posts from condition-specific subreddits, sends them to Claude,
 * and outputs SQL to stdout. Progress messages go to stderr.
 * Redirect to a file: node scripts/reddit-pipeline.js "endometriosis" > output.sql
 */

const { readFileSync } = require('fs');
const { randomUUID } = require('crypto');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────

const ANTHROPIC_BASE = 'https://api.anthropic.com';
const MODEL = 'claude-sonnet-4-6';
// Posts fetched per query per subreddit — keep low since we run many queries
const POSTS_PER_QUERY = 10;

// User-Agent required by Reddit API terms of service
const REDDIT_UA = 'WomensHealthEvidenceLab/1.0 (research tool; contact via github)';

// ── Subreddit map ─────────────────────────────────────────────────────────────

const CONDITION_SUBREDDITS = {
  endometriosis: ['Endo', 'endometriosis'],
  adenomyosis:   ['Endo', 'endometriosis'],
  pmdd:          ['PMDD'],
  pcos:          ['PCOS'],
  menopause:     ['Menopause', 'Perimenopause'],
  perimenopause: ['Perimenopause', 'Menopause'],
  vulvodynia:    ['vulvodynia', 'PelvicFloor'],
};

// Treatment-focused queries run against every condition-specific subreddit.
// Multiple targeted queries surface more posts than one broad query.
const TREATMENT_QUERIES = [
  'what helped',
  'medication',
  'treatment',
  'anyone tried',
  'worked for me',
  'off label',
  'my doctor prescribed',
  'supplement',
];

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

// ── Reddit fetching ───────────────────────────────────────────────────────────

async function fetchSubredditPosts(subreddit, query) {
  const url =
    `https://www.reddit.com/r/${subreddit}/search.json` +
    `?q=${encodeURIComponent(query)}&sort=top&limit=${POSTS_PER_QUERY}&t=all&restrict_sr=1`;

  const resp = await fetch(url, {
    headers: { 'User-Agent': REDDIT_UA },
  });

  if (!resp.ok) {
    log(`   Warning: r/${subreddit} "${query}" returned ${resp.status}. Skipping.`);
    return [];
  }

  const data = await resp.json();
  const posts = data?.data?.children ?? [];

  return posts
    .map(p => p.data)
    .filter(p => p && (p.selftext || p.title))
    .map(p => ({
      subreddit:   `r/${p.subreddit}`,
      title:       (p.title ?? '').trim(),
      body:        (p.selftext ?? '').slice(0, 1200).trim(),
      score:       p.score ?? 0,
      url:         `https://www.reddit.com${p.permalink}`,
      numComments: p.num_comments ?? 0,
    }));
}

async function fetchAllPosts(condition) {
  const key = condition.toLowerCase().replace(/\s+/g, '');
  const subreddits = CONDITION_SUBREDDITS[key] ?? ['TwoXChromosomes'];

  log(`   Subreddits: ${subreddits.map(s => `r/${s}`).join(', ')}`);
  log(`   Queries: ${TREATMENT_QUERIES.length} treatment-focused searches per subreddit`);

  const allPosts = [];

  for (const sub of subreddits) {
    for (const query of TREATMENT_QUERIES) {
      // Space every request to avoid rate limiting
      await new Promise(r => setTimeout(r, 800));
      const posts = await fetchSubredditPosts(sub, query);
      allPosts.push(...posts);
    }
    log(`   r/${sub}: done (${TREATMENT_QUERIES.length} queries)`);
  }

  // Deduplicate by URL, then sort by score descending
  const seen = new Set();
  const unique = allPosts.filter(p => {
    if (seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  });

  log(`   Total unique posts collected: ${unique.length}`);
  return unique.sort((a, b) => b.score - a.score);
}

// ── Claude analysis ───────────────────────────────────────────────────────────

function buildSystemPrompt(condition) {
  return (
    `You are analyzing patient forum posts from women with ${condition}. ` +
    `Identify any drugs, supplements, or compounds that multiple women report as helpful, ` +
    `with emphasis on treatments that were not originally developed for this condition. ` +
    `Look for off label use, unexpected benefits, and treatments that surprised people. ` +
    `Only include treatments mentioned by 2 or more people. ` +
    `Return as JSON array with: compound_name, signal_type (always community_report), ` +
    `evidence_strength (always preliminary), summary, post_count, ` +
    `contributing_posts (array of objects, each with post_index as the integer POST number ` +
    `from the input and excerpt as a brief quote from that post showing what the person reported).`
  );
}

async function analyzeWithClaude(apiKey, condition, posts) {
  // posts are already capped by the caller
  const formatted = posts
    .map((p, i) =>
      `--- POST ${i + 1} (${p.subreddit}, score: ${p.score}) ---\n` +
      `Title: ${p.title}\n` +
      `URL: ${p.url}\n` +
      (p.body ? `Body: ${p.body}` : '')
    )
    .join('\n\n');

  const userMessage =
    `Here are ${posts.length} posts from condition-specific subreddits. ` +
    `Return ONLY a valid JSON array (no markdown, no commentary). ` +
    `If no treatments meet the 2-post threshold, return [].\n\n` +
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
      max_tokens: 4000,
      system: buildSystemPrompt(condition),
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
    throw new Error(`Claude did not return a JSON array.\nRaw: ${rawText}`);
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (e) {
    // Truncated response: recover complete objects
    const partialMatches = [...jsonMatch[0].matchAll(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)?\}/g)];
    if (partialMatches.length > 0) {
      const recovered = [];
      for (const m of partialMatches) {
        try { recovered.push(JSON.parse(m[0])); } catch { /* skip malformed */ }
      }
      if (recovered.length > 0) {
        log(`[warn] Claude JSON truncated. Recovered ${recovered.length} complete object(s).`);
        return recovered;
      }
    }
    throw new Error(`Failed to parse Claude JSON: ${e.message}\nRaw: ${jsonMatch[0]}`);
  }
}

// ── Condition ID lookup ───────────────────────────────────────────────────────

const CONDITION_ALIASES = {
  endometriosis:  ['endometriosis'],
  adenomyosis:    ['adenomyosis'],
  pmdd:           ['pmdd', 'premenstrual dysphoric'],
  pcos:           ['pcos', 'polycystic'],
  menopause:      ['menopause', 'perimenopause'],
  perimenopause:  ['perimenopause', 'menopause'],
  vulvodynia:     ['vulvodynia', 'vulvar'],
};

async function lookupConditionId(supabaseUrl, supabaseKey, condition) {
  if (!supabaseUrl || !supabaseKey) return null;
  const key = condition.toLowerCase().replace(/\s+/g, '');
  const terms = CONDITION_ALIASES[key] ?? [condition.toLowerCase()];

  for (const term of terms) {
    try {
      const url =
        `${supabaseUrl}/rest/v1/conditions?name=ilike.*${encodeURIComponent(term)}*&select=id,name&limit=1`;
      const resp = await fetch(url, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      });
      if (!resp.ok) continue;
      const rows = await resp.json();
      if (rows?.[0]?.id) {
        log(`   Found condition: "${rows[0].name}" (${rows[0].id})`);
        return rows[0].id;
      }
    } catch (err) {
      log(`   Lookup error: ${err.message}`);
    }
  }
  return null;
}

// ── SQL helpers ───────────────────────────────────────────────────────────────

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

function toTitleCase(name) {
  if (!name) return name;
  return name
    .split(/(\s+)/)
    .map(part => (/^\s+$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
}

// ── SQL generation ────────────────────────────────────────────────────────────

function generateSQL(condition, conditionId, signals, fetchedSubreddits, posts = []) {
  const today = new Date().toISOString().slice(0, 10);
  const out = [];

  out.push('-- ================================================================');
  out.push(`-- Women\'s Health Evidence Lab: Reddit Community Pipeline Output`);
  out.push(`-- Condition : ${condition}`);
  out.push(`-- Generated : ${today}`);
  out.push(`-- Model     : ${MODEL}`);
  out.push('-- ================================================================');
  out.push('');

  if (!conditionId) {
    out.push(`-- Warning: Condition "${condition}" was not found in the database.`);
    out.push(`-- Run the query below to find the correct ID, then replace`);
    out.push(`-- every occurrence of CONDITION_ID_HERE in this file.`);
    out.push(`--`);
    out.push(`--   SELECT id, name FROM conditions WHERE name ILIKE '%${condition}%';`);
    out.push('');
    conditionId = 'CONDITION_ID_HERE';
  }

  if (signals.length === 0) {
    out.push('-- No community treatment signals met the 2-post threshold.');
    return out.join('\n');
  }

  const enriched = signals.map(sig => ({
    ...sig,
    compound_name: toTitleCase(sig.compound_name),
    compoundId:    randomUUID(),
    signalId:      randomUUID(),
    // Claude no longer returns subreddits in the simplified prompt;
    // fall back to the full list of subreddits fetched for this condition.
    subreddits: Array.isArray(sig.subreddits) && sig.subreddits.length > 0
      ? sig.subreddits
      : fetchedSubreddits,
  }));

  // ── STEP 1: Compounds ──────────────────────────────────────────────────────
  out.push('-- STEP 1: Compounds');
  for (const s of enriched) {
    out.push(`INSERT INTO compounds (id, name, drug_class, fda_status) VALUES (`);
    out.push(`  ${esc(s.compoundId)},`);
    out.push(`  ${esc(s.compound_name)},`);
    out.push(`  NULL,`);
    out.push(`  NULL`);
    out.push(`) ON CONFLICT (lower(name)) DO NOTHING;`);
    out.push('');
  }

  // ── STEP 2: Repurposing signals ────────────────────────────────────────────
  out.push('-- STEP 2: Repurposing signals');
  for (const s of enriched) {
    out.push(`INSERT INTO repurposing_signals`);
    out.push(`  (id, condition_id, compound_id, signal_type, evidence_strength, summary, mechanism_hypothesis, status)`);
    out.push(`SELECT`);
    out.push(`  ${esc(s.signalId)},`);
    out.push(`  ${esc(conditionId)},`);
    out.push(`  c.id,`);
    out.push(`  'community_report',`);
    out.push(`  'preliminary',`);
    out.push(`  ${esc(s.summary)},`);
    out.push(`  NULL,`);
    out.push(`  'active'`);
    out.push(`FROM compounds c`);
    out.push(`WHERE c.name = ${esc(s.compound_name)}`);
    out.push(`ON CONFLICT (compound_id, condition_id) DO UPDATE SET`);
    out.push(`  summary           = EXCLUDED.summary,`);
    out.push(`  evidence_strength = EXCLUDED.evidence_strength;`);
    out.push('');
  }

  // ── STEP 3: Sources (one row per contributing post, or per subreddit as fallback) ──
  out.push('-- STEP 3: Sources (Reddit community citations)');
  for (const s of enriched) {
    // Build source rows from contributing_posts when Claude returned them
    const contributingPosts = Array.isArray(s.contributing_posts) && s.contributing_posts.length > 0
      ? s.contributing_posts
      : [];

    if (contributingPosts.length > 0) {
      // One source row per contributing post using actual post URL and title
      for (const cp of contributingPosts) {
        const postIdx = typeof cp.post_index === 'number' ? cp.post_index - 1 : -1;
        const post    = postIdx >= 0 && postIdx < posts.length ? posts[postIdx] : null;
        if (!post) continue;

        const subredditSlug = post.subreddit.replace(/^r\//, '');

        out.push(`INSERT INTO sources`);
        out.push(`  (id, signal_id, source_type, external_id, title, url, key_finding_excerpt)`);
        out.push(`SELECT`);
        out.push(`  gen_random_uuid(),`);
        out.push(`  rs.id,`);
        out.push(`  'reddit',`);
        out.push(`  ${esc(subredditSlug)},`);
        out.push(`  ${esc(post.title)},`);
        out.push(`  ${esc(post.url)},`);
        out.push(`  NULL`);
        out.push(`FROM repurposing_signals rs`);
        out.push(`JOIN compounds c ON rs.compound_id = c.id`);
        out.push(`WHERE c.name = ${esc(s.compound_name)}`);
        out.push(`AND rs.condition_id = ${esc(conditionId)}`);
        out.push(`ON CONFLICT DO NOTHING;`);
        out.push('');
      }
    } else {
      // Fallback: one row per subreddit (when Claude did not return contributing_posts)
      if (s.subreddits.length === 0) continue;

      for (const subreddit of s.subreddits) {
        const subredditName = subreddit.startsWith('r/') ? subreddit : `r/${subreddit}`;
        const subredditSlug = subredditName.replace('r/', '');
        const subredditUrl  = `https://www.reddit.com/${subredditName}`;

        out.push(`INSERT INTO sources`);
        out.push(`  (id, signal_id, source_type, external_id, title, url, key_finding_excerpt)`);
        out.push(`SELECT`);
        out.push(`  gen_random_uuid(),`);
        out.push(`  rs.id,`);
        out.push(`  'reddit',`);
        out.push(`  ${esc(subredditSlug)},`);
        out.push(`  ${esc(`${subredditName} community reports`)},`);
        out.push(`  ${esc(subredditUrl)},`);
        out.push(`  ${esc(s.summary ?? null)}`);
        out.push(`FROM repurposing_signals rs`);
        out.push(`JOIN compounds c ON rs.compound_id = c.id`);
        out.push(`WHERE c.name = ${esc(s.compound_name)}`);
        out.push(`AND rs.condition_id = ${esc(conditionId)}`);
        out.push(`ON CONFLICT DO NOTHING;`);
        out.push('');
      }
    }
  }

  out.push('-- End of pipeline output');
  return out.join('\n');
}

// ── Logging ───────────────────────────────────────────────────────────────────

function log(msg) {
  process.stderr.write(msg + '\n');
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const condition = process.argv[2];

  if (!condition) {
    process.stderr.write(
      'Usage:   node scripts/reddit-pipeline.js "<condition>"\n' +
      'Example: node scripts/reddit-pipeline.js "endometriosis"\n'
    );
    process.exit(1);
  }

  const env = loadEnv();
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    process.stderr.write(
      'Error: ANTHROPIC_API_KEY is not set in .env.local\n' +
      'Add: ANTHROPIC_API_KEY=sk-ant-...\n'
    );
    process.exit(1);
  }

  log(`\nReddit Community Pipeline: "${condition}"`);

  // Step 1: Fetch posts
  log('\nStep 1: Fetching Reddit posts...');
  const key = condition.toLowerCase().replace(/\s+/g, '');
  const fetchedSubreddits = (CONDITION_SUBREDDITS[key] ?? ['TwoXChromosomes']).map(s => `r/${s}`);
  const posts = await fetchAllPosts(condition);
  log(`        Total posts collected: ${posts.length}`);

  if (posts.length === 0) {
    log('No posts found. Try a different condition name.');
    process.exit(0);
  }

  // Step 2: Claude analysis (cap to 60 posts to stay within context)
  const cappedPosts = posts.slice(0, 60);
  if (cappedPosts.length < posts.length) {
    log(`        Capped to ${cappedPosts.length} highest-scored posts for Claude.`);
  }
  log(`\nStep 2: Sending posts to Claude (${MODEL})...`);
  const signals = await analyzeWithClaude(apiKey, condition, cappedPosts);
  log(`        Identified ${signals.length} community treatment signal(s).`);

  if (signals.length > 0) {
    for (const s of signals) {
      log(`          ${s.compound_name} (${s.post_count ?? '?'} posts)`);
    }
  }

  // Step 3: Condition ID lookup
  log('\nStep 3: Looking up condition in Supabase...');
  const conditionId = await lookupConditionId(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    condition
  );
  if (!conditionId) {
    log('        Not found. Fill in CONDITION_ID_HERE manually.');
  }

  // Output SQL
  log('\nGenerating SQL...\n');
  const sql = generateSQL(condition, conditionId, signals, fetchedSubreddits, cappedPosts);
  process.stdout.write(sql + '\n');
}

main().catch(err => {
  process.stderr.write(`Fatal error: ${err.message}\n`);
  process.exit(1);
});
