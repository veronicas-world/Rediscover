# Institutional pitch — draft

Not for sending until the validation study has a result. Drafted now so the
pitch is ready and the framing is clear. The landscape analysis
(`docs/landscape-and-positioning.md`) is the credibility basis; the
pre-registered protocol is the evidence of rigour.

## Subject line options

- "Pre-registered validation of an AI-graded drug repurposing evidence base for women's health"
- "Systematic evidence assembly for drug repurposing in women's health — seeking a co-author"

## The email

Dear [PI],

I'm a Columbia undergraduate building a drug repurposing evidence database for
women's health conditions. I'm writing because I've mapped where the field
sits and I think what I'm building fills a gap that your lab would recognise.

**The gap.** Across every drug-repurposing platform I could find — Open Targets,
ChEMBL, Every Cure, ReDO_DB — none applies a certainty-of-evidence grade to
drug-disease pairs. Open Targets explicitly disclaims that its score is a
confidence score. The field's own reviewers call the dominant practice
(selective literature corroboration) "neither systematic nor hypothesis driven"
(Schuler et al.), and the rigorous version — a systematic literature survey
with quality assessment — appeared in 2 of 732 papers reviewed (Pillai & Wu).

**What I've built.** Whel (whel.bio) is a free, open, graded evidence database
that assembles the scattered repurposing evidence for six women's health
conditions. Every claim is pinned to a verbatim sentence with character
offsets and machine-checked for entailment. The evidence is graded on five
dimensions into four tiers, with a female-applicability multiplier. 226 drug-
condition pairs, 295 claims, 48 source documents.

**What I'm doing about credibility.** The validation study is pre-registered
(protocol attached), structured against GRRAS and STARD 2015 / STARD-AI. Two
raters (myself and a licensed psychiatrist) label a stratified sample; the
primary endpoint is false omission rate with document-clustered bootstrap. A
scoring test-retest has already run and is reported in the methods draft.

**What I'm asking.** I'm looking for a lab that would:

1. Co-author the validation paper (the methods are written; the study is
   running; the analysis code is open).
2. Host or advise on coverage expansion — the architecture scales, the
   constraint is retrieval volume and expert curation.
3. Lend credibility through affiliation — a one-person project is not a
   reference source regardless of validation.

I've attached the landscape analysis (where Whel sits in the field), the
pre-registered protocol, and the methods draft. I'd be glad to walk through
any of it.

Best,
Veronica Agudelo
Columbia University
vla2117@columbia.edu | whel.bio

## What to attach

- `docs/landscape-and-positioning.md` — the field mapping
- `docs/validation-protocol-DRAFT.md` — the pre-registered protocol
- `docs/validation-methods-draft.md` — the methods in paper form
- `docs/droid-review-2026-08.md` — the independent code review

## Timing

Send after the entailment study reports. The email should be updated to
include the false omission rate and kappa in the "What I'm doing about
credibility" paragraph. A result is the difference between a credible pitch
and a cold email.
