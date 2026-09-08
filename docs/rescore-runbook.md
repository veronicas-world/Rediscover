# Rescore Runbook

The pipeline is a five-stage sequence. The stages MUST run in this order.
Running them out of order — or skipping stage 3 — produces signals scored
against stale data.

## Required order

```
0. fetch + chunk          →  fetch_pubmed / fetch_trials / fetch_community /
                             fetch_pathway (opentargets), then chunk.run()
1. re-extract claims      →  extract_claims.run()
2. re-run entailment      →  verify_provenance.run(), then AEMS + SIDER
                             (dependent structured sources — see below)
3. rebuild contradictions →  backup; DELETE FROM contradictions; detect_contradictions.run()
4. score signals          →  score_claims.run() + export_signals()
```

After stage 4 the driver **finalizes**: it exports the seed migrations
(047 + 051), writes the dated retrieval manifest (`run-manifest-<run>.json`),
and writes the dated PRISMA flow record (`prisma-flow-<run>.json`). Finalize
also runs on an interrupted run — what completed is exported, honestly.

The driver script `scripts/substrate/rescore.py` enforces this order.
Run it from the repo root:

```bash
python3 scripts/substrate/rescore.py                                   # full end-to-end (all 5 stages)
python3 scripts/substrate/rescore.py --from-stage 3                    # resume from stage 3
python3 scripts/substrate/rescore.py --dry-run                         # full dry run: every stage,
                                                                       # zero API calls, zero writes,
                                                                       # prints plan + cost estimate
python3 scripts/substrate/rescore.py --check-integrity                 # standalone check
python3 scripts/substrate/rescore.py --limit 5                         # stage 3, 5 NLI calls, NO DELETE
python3 scripts/substrate/rescore.py --limit 5 --i-know-this-deletes   # stage 3, 5 NLI, WITH DELETE
python3 scripts/substrate/rescore.py --restore-backup PATH             # restore rows from a backup
```

## Stage 0 — Fetch + chunk

Retrieval runs against the caps in `scripts/substrate/config.py`
(`config.RETRIEVAL`). **A retrieval change — including a future `retmax` or
`max_documents` change — is a config edit, not a code edit.** The values in
this version reproduce the original fetchers' behaviour exactly (retmax=2,
5 documents per condition, etc.); the decision to raise them is pending.

Every query/dataset is recorded into an in-run manifest at the moment it runs
(PRISMA-S: query string, database, interface, timestamp, limits and filters,
records matching, records fetched, records inserted). The manifest is written
after the fetch stage and again at finalize, so the artifact exists even if a
later stage is interrupted.

Stage 0 is safe to re-run: existing documents are deduplicated by content
hash / external id, never refetched. Re-run behaviour per source:

| Source | On re-run |
|---|---|
| PubMed | Re-runs esearch (live API calls) but skips known PMIDs; no duplicates |
| ClinicalTrials.gov | Re-fetches the page, skips known NCT ids + hash; no duplicates |
| Reddit | Always re-searches (fresh top posts); hash dedup; an *edited* post re-inserts (same external id, new hash) |
| Open Targets | v2 renders (2026-09-08) do NOT embed the retrieval date, so the statement/hash is stable; re-runs dedup on hash + (source, external_id, condition). No duplicates |
| AEMS (openFDA) | Same v2 fix (date moved to meta); re-runs dedup. No duplicates |
| SIDER | Hash-stable; dedups on every re-run |

The retrieval date is provenance, not content, for the structured arms: it lives
in each document's meta (record JSON) and in the run manifest, never in the
hashed statement. The first re-run after the 2026-09-08 v2 switch is safe: the
two-key dedup guard ((source, external_id, condition) in addition to the content
hash) prevents the 118 pre-fix rows from being re-inserted once under their new
date-free hash.

## Stage 2 — Entailment, then AEMS + SIDER

AEMS and SIDER are **dependent** structured sources: they need candidate drugs
already in the substrate, which only exist after extraction (stage 1). So they
run at the end of stage 2, after entailment, matching the original `run.py`
order. Their statements are rendered deterministically and inserted
pre-verified (`provenance_verified=1`, `entailment_label='entailed'`) — no LLM
call.

## Why each stage matters

### Stage 1 — Re-extract claims

Claim text, directions, and aspects can change when the extraction prompt
is revised. Downstream stages read claim text and direction, so they must
see the current extraction.

### Stage 2 — Re-run entailment

Entailment labels change when the entailment prompt, guard, or model
changes. A claim that was "entailed" may move to "neutral" or
"contradicted." This is the stage that invalidates existing contradiction
rows: a contradiction row references two claims, and if either claim's
entailment_label is no longer "entailed", the row is stale.

### Stage 3 — Rebuild contradictions (backup + DELETE + regenerate)

**This step is not optional and not idempotent with append.**

`detect_contradictions.py` skips pairs that already have a row in the
contradictions table. Without the DELETE, stale rows survive — rows that
reference claims whose entailment_label has changed since the row was
created. `score_claims.py` would then read contradictions computed against
a claim set that no longer exists.

The rebuild has three sub-steps:

1. **Backup:** Write all existing rows to a timestamped JSON file in
   `scripts/audit-output/contradictions-backup-{timestamp}.json`. This
   runs BEFORE the DELETE so the rows are recoverable.
2. **DELETE:** Remove all rows from the contradictions table.
3. **Regenerate:** `detect_contradictions.run()` re-populates the table
   against the current claim set.

#### Why no transaction

The DELETE and the regeneration **cannot** be wrapped in a single SQLite
transaction. `detect_contradictions.run()` opens its own connection via
`db.connect()` and commits after each found contradiction. A transaction
on a different connection would not protect the DELETE, and the
per-contradiction commits would commit the DELETE anyway.

Safety relies on the JSON backup. If stage 3 dies partway:

- The backup has the pre-rescore rows (from sub-step 1).
- The table has a partial set from the current run (rows found before
  credits ran out, each committed individually by detect_contradictions).
- The table is not empty — it has whatever contradictions the NLI found
  before it stopped.

#### Re-running --from-stage 3 after a partial failure

`--from-stage 3` is safe to re-run against a partially rebuilt table. It:

1. Backs up whatever rows exist (the partial set from the failed run).
2. Deletes them.
3. Re-runs `detect_contradictions.run()` from scratch.

All candidate pairs are re-evaluated because the table is empty after the
DELETE. `detect_contradictions.run()` checks for existing rows and skips
them, but there are none to skip. The cost is that NLI calls from the
failed run are repeated — there is no resume-within-stage-3 mechanism.

### Stage 4 — Score signals

`score_claims.py` reads the rebuilt contradictions table and applies the
consistency penalty (§5d of SCORING_SPEC.md). Running this stage before
stage 3 means scoring against stale contradiction data. Stage 4 ends with
`export_signals()`, which emits `supabase/migrations/051_substrate_signals_seed.sql`.

## The dry run — verify the whole pipeline before spending (zero API, zero LLM, zero writes)

```bash
python3 scripts/substrate/rescore.py --dry-run
```

Plans every stage against the current store: what each source would fetch
(caps from `config.RETRIEVAL`), how many spans would be extracted, claims
entailed, contradiction pairs sent to the NLI, signal groups scored — plus a
cost estimate built from `config.DRY_RUN_COST_ASSUMPTIONS` (planning figures;
recalibrate after the first real run). Nothing is fetched, nothing is
written, no credits are spent.

### Limited run — a real run (N NLI calls)

```bash
python3 scripts/substrate/rescore.py --limit 5                          # safe: NO DELETE
python3 scripts/substrate/rescore.py --limit 5 --i-know-this-deletes     # real: backup + DELETE + regenerate
```

**`--limit N` without `--i-know-this-deletes`** is the safe default. It
does NOT delete the table. It runs `detect_contradictions.run(limit=N)`
against the existing table, which evaluates N candidate pairs (skipping
pairs that already have rows) and appends any new contradictions found.
The existing rows are preserved. This is a test, not a rebuild.

**`--limit N --i-know-this-deletes`** is the destructive variant. It runs
the full stage 3 (backup + DELETE + regenerate with limit N).

### Integrity check (zero credits)

```bash
python3 scripts/substrate/rescore.py --check-integrity
```

Counts contradiction rows whose `claim_a` or `claim_b` is not currently
`entailed` and `provenance_verified`. Should always be zero. A non-zero
count means the table holds rows from a previous claim set.

## Restoring a backup

```bash
python3 scripts/substrate/rescore.py --restore-backup scripts/audit-output/contradictions-backup-{timestamp}.json
```

Reads a `contradictions-backup-*.json` file, deletes all existing rows
from the contradictions table, and inserts the backed-up rows.

## Credits exhaustion

If Anthropic credits run out mid-run, the driver stops immediately.
Nothing is self-adjudicated. What completed is exported (047 + 051) and the
manifest + flow are still written — the gap is visible in the numbers, not
hidden. Resume with `--from-stage` set to the last stage that completed:

```bash
python3 scripts/substrate/rescore.py --from-stage 3
```

To restore the pre-rescore contradictions from the backup:

```bash
python3 scripts/substrate/rescore.py --restore-backup scripts/audit-output/contradictions-backup-{timestamp}.json
```

## Relationship to the initial pipeline

The initial pipeline (`scripts/substrate/run.py`) is the earlier incremental
driver for the same stages. The rescore driver is now the one-command
end-to-end path: it adds the lossless rescue semantics of stage 3 (backup +
DELETE) and the scoring/export finalize. `run.py` is kept for backward
compatibility; new runs should use `rescore.py`.
