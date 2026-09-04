# Rescore Runbook

The rescore is a four-stage sequence. The stages MUST run in this order.
Running them out of order — or skipping stage 3 — produces signals scored
against stale data.

## Required order

```
1. re-extract claims      →  extract_claims.run()
2. re-run entailment      →  verify_provenance.run()
3. rebuild contradictions →  backup; DELETE FROM contradictions; detect_contradictions.run()
4. score signals          →  score_claims.run()
```

The driver script `scripts/substrate/rescore.py` enforces this order.
Run it from the repo root:

```bash
python3 scripts/substrate/rescore.py                              # full rescore
python3 scripts/substrate/rescore.py --from-stage 3               # resume from stage 3
python3 scripts/substrate/rescore.py --check-integrity            # standalone check
python3 scripts/substrate/rescore.py --dry-run                    # list stage 3 candidates, no NLI
python3 scripts/substrate/rescore.py --limit 5                    # stage 3, 5 NLI calls, NO DELETE (safe test)
python3 scripts/substrate/rescore.py --limit 5 --i-know-this-deletes  # stage 3, 5 NLI calls, WITH DELETE
python3 scripts/substrate/rescore.py --restore-backup PATH        # restore rows from a backup file
```

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
stage 3 means scoring against stale contradiction data.

## Verifying stage 3

### Dry run — the safe verification (zero credits)

```bash
python3 scripts/substrate/rescore.py --dry-run
```

Lists every candidate pair that would be sent to the NLI: direction,
same-document flag, outcome, and claim text (truncated). Does not DELETE,
does not call the NLI, does not modify the database. Use this to verify
the claim set is correct after stages 1 and 2.

### Limited run — a real run (N NLI calls)

```bash
python3 scripts/substrate/rescore.py --limit 5                          # safe: NO DELETE
python3 scripts/substrate/rescore.py --limit 5 --i-know-this-deletes     # real: backup + DELETE + regenerate
```

**`--limit N` without `--i-know-this-deletes`** is the safe default. It
does NOT delete the table. It runs `detect_contradictions.run(limit=N)`
against the existing table, which evaluates N candidate pairs (skipping
pairs that already have rows) and appends any new contradictions found.
The existing rows are preserved. This is a test, not a rebuild — the
table will have old rows plus whatever the limited run found.

**`--limit N --i-know-this-deletes`** is the destructive variant. It runs
the full stage 3 (backup + DELETE + regenerate with limit N). The table
will have at most N evaluated rows. Use this to verify the backup + DELETE
+ NLI pipeline end-to-end. To complete the rebuild, re-run `--from-stage 3`
without `--limit`.

The safe default exists because someone reaching for `--limit` is
precisely someone who is short on credits. The cheapest way to test
stage 3 should not also be the one that wipes the table.

### Integrity check (zero credits)

```bash
python3 scripts/substrate/rescore.py --check-integrity
```

Counts contradiction rows whose `claim_a` or `claim_b` is not currently
`entailed` and `provenance_verified`. Should always be zero. A non-zero
count means the table holds rows from a previous claim set.

As of 2026-09-04, this count is **1** (the stale MHT/menopause row whose
both claims moved to `entailment_label = "neutral"`). It will return to
zero after the next rescore runs stage 3.

## Restoring a backup

```bash
python3 scripts/substrate/rescore.py --restore-backup scripts/audit-output/contradictions-backup-20260904T120000Z.json
```

Reads a `contradictions-backup-*.json` file, deletes all existing rows
from the contradictions table, and inserts the backed-up rows. Prints
how many rows were restored and runs the integrity check afterward.

Use this if a stage 3 run died partway and you want to get back to the
pre-rescore state before trying again. The backup files are in
`scripts/audit-output/` with timestamps in the filename.

## Credits exhaustion

If Anthropic credits run out mid-rescore, the driver stops immediately.
Nothing is self-adjudicated. The pre-rescore contradictions are backed up
in `scripts/audit-output/`. Resume with `--from-stage` set to the last
stage that completed:

```bash
python3 scripts/substrate/rescore.py --from-stage 3
```

To restore the pre-rescore contradictions from the backup:

```bash
python3 scripts/substrate/rescore.py --restore-backup scripts/audit-output/contradictions-backup-{timestamp}.json
```

## Relationship to the initial pipeline

The initial pipeline (`scripts/substrate/run.py`) runs the stages in a
different order because it also fetches and chunks documents:

```
fetch → chunk → extract → verify → detect → export
```

The rescore skips fetch/chunk/export and adds the backup + DELETE before
detection, plus the scoring stage. The two scripts are separate because
the rescore is a model-only operation on an existing corpus.
