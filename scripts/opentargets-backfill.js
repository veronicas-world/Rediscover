#!/usr/bin/env node
'use strict';

/**
 * Open Targets Backfill Migration
 * Usage: node scripts/opentargets-backfill.js
 *
 * Reads all opentargets sources from Supabase, looks up the ChEMBL ID for each
 * drug via the Open Targets API, then outputs SQL UPDATEs that fix:
 *   - external_id: set to ChEMBL ID (e.g. CHEMBL12345)
 *   - url: set to evidence page (platform.opentargets.org/evidence/{chemblId}/{efoId})
 *
 * The EFO ID is extracted from the current URL stored in the sources table.
 * Outputs SQL to stdout; progress to stderr.
 */

const { readFileSync } = require('fs');
const path             = require('path');

const OT_GRAPHQL = 'https://api.platform.opentargets.org/api/v4/graphql';

function log(msg) { process.stderr.write(msg + '\n'); }

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  return `'${String(val).replace(/'/g, "''")}'`;
}

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
  } catch { return {}; }
}

// Query Open Targets for a drug's ChEMBL ID by name
async function lookupChemblId(drugName) {
  const query = `
    query DrugSearch($q: String!) {
      search(queryString: $q, entityNames: ["drug"], page: {index: 0, size: 5}) {
        hits { id name }
      }
    }
  `;
  try {
    const resp = await fetch(OT_GRAPHQL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ query, variables: { q: drugName } }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const hits = data.data?.search?.hits ?? [];
    // Find best match by name (case-insensitive)
    const lower = drugName.toLowerCase();
    const exact = hits.find(h => h.name.toLowerCase() === lower);
    const best  = exact ?? hits[0];
    return best?.id ?? null;
  } catch { return null; }
}

async function main() {
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    process.stderr.write('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local\n');
    process.exit(1);
  }

  log('Fetching opentargets sources from Supabase...');

  // Fetch all opentargets sources with their signal compound names and condition EFO context
  const resp = await fetch(
    `${supabaseUrl}/rest/v1/sources` +
    `?source_type=eq.opentargets` +
    `&select=id,external_id,url,title,signal_id`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  );
  if (!resp.ok) {
    process.stderr.write(`Supabase error: ${resp.status} ${resp.statusText}\n`);
    process.exit(1);
  }
  const sources = await resp.json();
  log(`Found ${sources.length} opentargets source records.`);

  if (sources.length === 0) {
    log('Nothing to backfill.');
    process.exit(0);
  }

  // Extract drug name and EFO ID from each source
  // Title format: "Open Targets: {DrugName} — {signal_type} for {conditionName} ..."
  // URL format:   "https://platform.opentargets.org/disease/{EFO_ID}" (old format)
  const updates = [];
  const seenDrugs = new Map(); // drug name (lower) -> chemblId

  process.stdout.write('-- Open Targets Backfill Migration\n');
  process.stdout.write('-- Updates external_id to ChEMBL ID and url to evidence page format\n');
  process.stdout.write('-- Generated: ' + new Date().toISOString().slice(0, 10) + '\n\n');

  for (const source of sources) {
    // Parse drug name from title: "Open Targets: DrugName — ..."
    const titleMatch = (source.title ?? '').match(/^Open Targets:\s+(.+?)\s+[—–]/);
    const drugName   = titleMatch ? titleMatch[1].trim() : null;

    // Extract EFO ID from current URL
    const urlMatch = (source.url ?? '').match(/\/disease\/([A-Z0-9_]+)$/i) ??
                     (source.url ?? '').match(/\/evidence\/[^/]+\/([A-Z0-9_]+)$/i);
    const efoId    = urlMatch ? urlMatch[1] : null;

    if (!drugName) {
      log(`  Skipping source ${source.id}: could not parse drug name from title: ${source.title}`);
      continue;
    }

    log(`  Processing: ${drugName} (EFO: ${efoId ?? 'unknown'})`);

    // Look up ChEMBL ID (cached)
    let chemblId = seenDrugs.get(drugName.toLowerCase());
    if (chemblId === undefined) {
      chemblId = await lookupChemblId(drugName);
      seenDrugs.set(drugName.toLowerCase(), chemblId);
      if (chemblId) {
        log(`    ChEMBL ID: ${chemblId}`);
      } else {
        log(`    No ChEMBL ID found for "${drugName}" — skipping URL update`);
      }
    }

    if (!chemblId) continue;

    const newExternalId = chemblId;
    const newUrl = (chemblId && efoId)
      ? `https://platform.opentargets.org/evidence/${chemblId}/${efoId}`
      : (chemblId ? `https://platform.opentargets.org/drug/${chemblId}` : source.url);

    updates.push({ id: source.id, newExternalId, newUrl, drugName, efoId });
  }

  log(`\nGenerating ${updates.length} UPDATE statements...`);

  for (const u of updates) {
    process.stdout.write(
      `-- ${u.drugName} (${u.efoId ?? 'no EFO'}) -> ${u.newUrl}\n` +
      `UPDATE sources SET\n` +
      `  external_id = ${esc(u.newExternalId)},\n` +
      `  url         = ${esc(u.newUrl)}\n` +
      `WHERE id = ${esc(u.id)};\n\n`
    );
  }

  log(`\nDone. ${updates.length} source records will be updated.`);
  log('Review the SQL above then paste into Supabase SQL editor.');
}

main().catch(err => {
  process.stderr.write(`Fatal error: ${err.message}\n`);
  process.exit(1);
});
