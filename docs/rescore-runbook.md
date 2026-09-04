# Rescore Runbook

The rescore is a four-stage sequence. The stages MUST run in this order.
Running them out of order — or skipping stage 3 — produces signals scored
against stale data.

## Required order

```
1. re-extract claims      →  extract_claims.run()
2. re-run entailment      →  verify_provenance.run()
3. rebuild contradictions →  DELETE FROM contradictions; detect_contradictions.run()
4. score signals          →  score_claims.run()
```

The driver script `scripts/substrate/rescore.py` enforces this order.
Run it from the repo root:

```bash
python3 scripts/substrate/rescore.py                  # full rescore
python3 scripts/substrate/rescore.py --from-stage 3    # resume from stage 3
python3 scripts/substrate/rescore.py --check-integrity # standalone check
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

### Stage 3 — Rebuild contradictions (DELETE + regenerate)

**This step is not optional and not idempotent with append.**

`detect_contradictions.py` skips pairs that already have a row in the
contradictions table. Without the DELETE, stale rows survive — rows that
reference claims whose entailment_label has changed since the row was
created. `score_claims.py` would then read contradictions computed against
a claim set that no longer exists.

The rebuild is a full DELETE followed by re-detection:

```sql
DELETE FROM contradictions;
```

Then `detect_contradictions.run()` re-populates the table against the
current claim set.

### Stage 4 — Score signals

`score_claims.py` reads the rebuilt contradictions table and applies the
consistency penalty (§5d of SCORING_SPEC.md). Running this stage before
stage 3 means scoring against stale contradiction data.

## Integrity check

Run any time, without a full rescore:

```bash
python3 scripts/substrate/rescore.py --check-integrity
```

This counts contradiction rows whose `claim_a` or `claim_b` is not
currently `entailed` and `provenance_verified`. The count should always be
zero. A non-zero count means the contradictions table holds rows from a
previous claim set that has since been re-scored.

As of 2026-09-04, this count is **1** (the stale MHT/menopause row whose
both claims moved to `entailment_label = "neutral"`). It will return to
zero after the next rescore runs stage 3.

## Credits exhaustion

If Anthropic credits run out mid-rescore, the driver stops immediately.
Nothing is self-adjudicated. Resume with `--from-stage` set to the last
stage that completed:

```bash
python3 scripts/substrate/rescore.py --from-stage 3
```

## Relationship to the initial pipeline

The initial pipeline (`scripts/substrate/run.py`) runs the stages in a
different order because it also fetches and chunks documents:

```
fetch → chunk → extract → verify → detect → export
```

The rescore skips fetch/chunk/export and adds the DELETE before
detection, plus the scoring stage. The two scripts are separate because
the rescore is a model-only operation on an existing corpus.
