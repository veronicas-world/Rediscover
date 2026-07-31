# Provenance tables: which one is live

Whel has two provenance systems in the database. Only one of them is read by
the site. This note exists because that is not obvious from the schema, and
because an audit in July 2026 was run against the wrong one before anyone
noticed.

## The live system: `claims` → `documents`

This is the substrate's provenance layer and the only one the public site
reads. `lib/substrate-candidates.ts` queries `claims` (joined to `documents`)
inside `getCandidates()`. Every quote shown on a candidate card or signal page
comes from here.

Shape:

- `claims.exact_quote` — the verbatim passage
- `claims.quote_start_char` / `quote_end_char` — offsets into `documents.raw_text`
- `claims.provenance_verified` — whether the quote was located in the source
- `claims.entailment_label` / `entailment_score` — whether the quote supports
  the claim (`entailed`, `neutral`, `contradicted`)
- `claims.model_name` — what produced the claim. Values starting with
  `pathway-render/` are rendered from structured records (Open Targets, AEMS,
  SIDER) rather than extracted from prose. Their quotes are generated from the
  same data they describe, so verifying them against their own source proves
  nothing. Exclude them from any reported entailment figure.
- `documents.raw_text` — the stored source text the offsets point into

Scripts that operate on this system:

- `scripts/repair-claim-spans.py` — widens quotes that are too narrow to
  support their claim; writes a reviewable migration
- `scripts/rescore-claim-entailment.py` — re-scores claims whose label is null

## The legacy system: `sources`

`sources` is per-signal provenance from the older `repurposing_signals`
engine, before the substrate cutover. The site does not read it. `getCandidates()`
never references it.

It is keyed on `signal_id` and carries title, authors, journal, url,
`key_finding_excerpt`, and study-type fields. Roughly 2,100 rows, the large
majority of them FAERS adverse-event records.

Scripts that operate on this system, and therefore describe data the public
site does not display:

- `scripts/extract-key-findings.py` — populates `sources.key_finding_excerpt`
- `scripts/verify-summary-grounding.py` — the Phase 2a grounding verifier
- `scripts/export-sources-for-audit.py` — writes `lib/sources-audit-snapshot.json`

## Why it is still here

Removing it would mean a destructive migration against production for no
functional gain, since nothing queries it at runtime. It also holds the audit
history from the pre-cutover engine, which is worth keeping.

The risk is not cost, it is confusion. Anyone reading the schema, or running
one of the legacy scripts, can reasonably assume they are looking at what the
site shows. They are not. If you want a figure that describes the live corpus,
compute it from `claims` restricted to ids referenced by active
`substrate_signals`, and drop the `pathway-render/*` rows first.

## If you do decide to retire it

Retire the scripts before the table. Anything that reads or writes `sources`
should be moved into `scripts/legacy/` or deleted, so nobody runs a legacy
audit and reports the number as current. The table itself can stay indefinitely
without harm.

_Last updated July 2026, after the claim-span repair and entailment re-score._
