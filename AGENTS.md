# Start here

**Read [`README.md`](README.md) in full before writing any code or making any claim
about this project.** It covers what Whel is, the long-term vision, the current state
including what is explicitly *not* yet validated, the architecture and pipeline order,
the data sources and their limits, the counting vocabulary, the reporting standards
this project is held to, the prioritised work queue, and the guardrails.

Section 9, "How to work on this project", is not optional. It is written from things
that have actually gone wrong here, including an agent that fabricated a citation and
a URL.

Three more worth reading before touching the relevant area:

- [`docs/provenance-tables.md`](docs/provenance-tables.md) — there are two provenance
  systems in this database, one live and one legacy. Confusing them is the most common
  mistake made on this repo.
- [`docs/validation-protocol-DRAFT.md`](docs/validation-protocol-DRAFT.md) — the
  pre-registered validation study. It has not run.
- [`docs/droid-review-2026-08.md`](docs/droid-review-2026-08.md) — independent code and
  methodology review, August 2026.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
