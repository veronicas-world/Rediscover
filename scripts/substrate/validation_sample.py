#!/usr/bin/env python3
"""
Validation study — frame extraction and sampling (protocol §6–7).

Extracts the eligible claim frame from the live Supabase DB, freezes it with a
timestamp, draws the sample (census of neutral + simple random sample of
entailed with a fixed RNG seed), and writes a CSV ready for human labelling.

Usage:
  python3 scripts/substrate/validation_sample.py [--n-entailed N] [--seed S]

Outputs:
  docs/validation-frame-{timestamp}.json   — frozen frame metadata
  docs/validation-sample-{timestamp}.csv   — items to label

Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in env.
"""
import argparse, csv, json, os, sys, time
from datetime import datetime, timezone

try:
    from supabase import create_client
except ImportError:
    sys.exit("supabase-py not installed: pip install supabase")

# ── Connect ──────────────────────────────────────────────────────────────────
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
if not url or not key:
    sys.exit("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in env.")
sb = create_client(url, key)

# ── Frame extraction (protocol §7) ───────────────────────────────────────────
# Frame: claims behind active signals, LLM-extracted (model_name =
# claude-sonnet-4-6), provenance-verified, carrying an entailment label.
# Template-rendered rows (pathway-render/*) excluded as circular.

# 1. Get claim_ids from all active substrate_signals
sig_res = sb.table("substrate_signals").select("claim_ids").eq("status", "active").execute()
referenced_ids = set()
for s in (sig_res.data or []):
    ids = s.get("claim_ids") or []
    if isinstance(ids, list):
        referenced_ids.update(str(i) for i in ids)
print(f"  Active signals reference {len(referenced_ids)} claim IDs")

# 2. Get all claims that are referenced, provenance-verified, LLM-extracted,
#    and carry an entailment label. We fetch in paginated batches.
all_claims = []
page = 0
while True:
    res = sb.table("claims").select(
        "id, text, exact_quote, direction, entailment_label, model_name, "
        "provenance_verified, document_id, intervention_id, condition_id"
    ).eq("provenance_verified", True).eq("entailment_label", "entailed").execute()
    # Supabase-py returns all rows in one go for small tables; if not, we'd
    # need range-based pagination. For ~300 rows this is fine.
    all_claims = res.data or []
    break

# Also get neutral claims
neutral_res = sb.table("claims").select(
    "id, text, exact_quote, direction, entailment_label, model_name, "
    "provenance_verified, document_id, intervention_id, condition_id"
).eq("provenance_verified", True).eq("entailment_label", "neutral").execute()
all_claims.extend(neutral_res.data or [])

# 3. Filter to the frame: referenced by active signals, LLM-extracted (not
#    pathway-render), provenance-verified, has entailment label
frame = []
for c in all_claims:
    cid = str(c["id"])
    if cid not in referenced_ids:
        continue
    mn = str(c.get("model_name") or "")
    if mn.startswith("pathway-render"):
        continue  # template-rendered, circular
    if not c.get("entailment_label"):
        continue
    frame.append(c)

print(f"  Frame: {len(frame)} eligible claims")

# 4. Get document metadata for each claim (source, title, external_id, url)
doc_ids = set(str(c["document_id"]) for c in frame if c.get("document_id"))
doc_map = {}
if doc_ids:
    # Fetch documents — only the columns anon can SELECT (058 restriction)
    doc_res = sb.table("documents").select("id, source, external_id, url, title").in_("id", list(doc_ids)).execute()
    for d in (doc_res.data or []):
        doc_map[str(d["id"])] = d

# 5. Get entity labels (intervention/condition names)
ent_ids = set()
for c in frame:
    if c.get("intervention_id"): ent_ids.add(str(c["intervention_id"]))
    if c.get("condition_id"): ent_ids.add(str(c["condition_id"]))
ent_map = {}
if ent_ids:
    ent_res = sb.table("entities").select("id, label").in_("id", list(ent_ids)).execute()
    for e in (ent_res.data or []):
        ent_map[str(e["id"])] = str(e.get("label") or "")

# 6. Assemble the frame records
frame_records = []
for c in frame:
    doc = doc_map.get(str(c.get("document_id") or ""), {})
    frame_records.append({
        "claim_id": str(c["id"]),
        "claim_text": str(c.get("text") or ""),
        "exact_quote": str(c.get("exact_quote") or ""),
        "direction": str(c.get("direction") or ""),
        "judge_label": str(c.get("entailment_label") or ""),
        "model_name": str(c.get("model_name") or ""),
        "document_id": str(c.get("document_id") or ""),
        "doc_source": str(doc.get("source") or ""),
        "doc_title": str(doc.get("title") or ""),
        "doc_external_id": str(doc.get("external_id") or ""),
        "doc_url": str(doc.get("url") or ""),
        "intervention": ent_map.get(str(c.get("intervention_id") or ""), ""),
        "condition": ent_map.get(str(c.get("condition_id") or ""), ""),
    })

# 7. Stratify
entailed = [r for r in frame_records if r["judge_label"] == "entailed"]
neutral = [r for r in frame_records if r["judge_label"] == "neutral"]
contradicted = [r for r in frame_records if r["judge_label"] == "contradicted"]
print(f"  Strata: {len(entailed)} entailed, {len(neutral)} neutral, {len(contradicted)} contradicted")

# ── Sampling (protocol §7) ────────────────────────────────────────────────────
parser = argparse.ArgumentParser()
parser.add_argument("--n-entailed", type=int, default=128,
                    help="Sample size from the entailed stratum (default 128)")
parser.add_argument("--seed", type=int, default=20260802,
                    help="RNG seed for reproducibility (default 20260802)")
args = parser.parse_args()

import random
random.seed(args.seed)

# Neutral stratum: census (take all)
sample_neutral = neutral[:]

# Entailed stratum: simple random sample
if len(entailed) <= args.n_entailed:
    sample_entailed = entailed[:]
    print(f"  Entailed stratum: census ({len(entailed)} ≤ N={args.n_entailed})")
else:
    sample_entailed = random.sample(entailed, args.n_entailed)
    print(f"  Entailed stratum: sample {args.n_entailed} of {len(entailed)}")

sample = sample_neutral + sample_entailed
# Randomise order (protocol §7: "independently randomised order")
random.shuffle(sample)

# ── Output ───────────────────────────────────────────────────────────────────
ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
os.makedirs("docs", exist_ok=True)

# Frame metadata (frozen)
frame_meta = {
    "frozen_at": ts,
    "frame_size": len(frame_records),
    "strata": {
        "entailed": len(entailed),
        "neutral": len(neutral),
        "contradicted": len(contradicted),
    },
    "n_documents": len(doc_ids),
    "sample": {
        "n_entailed": len(sample_entailed),
        "n_neutral": len(sample_neutral),
        "n_total": len(sample),
        "seed": args.seed,
        "n_entailed_requested": args.n_entailed,
    },
    "claim_ids": [r["claim_id"] for r in frame_records],
}
frame_path = f"docs/validation-frame-{ts}.json"
with open(frame_path, "w") as f:
    json.dump(frame_meta, f, indent=2)
print(f"  Wrote frame metadata: {frame_path}")

# Sample CSV (for labelling)
csv_path = f"docs/validation-sample-{ts}.csv"
fields = [
    "item_id", "stratum", "claim_id",
    # What the rater sees (protocol §4):
    "doc_source", "doc_title", "doc_url", "condition",
    "claim_text", "exact_quote",
    # Judge's label (hidden from raters, used for analysis):
    "judge_label",
    # Rater labels (to be filled):
    "R1_label", "R2_label", "consensus_label",
    "R1_rationale", "R2_rationale", "consensus_rationale",
    # Clustering key (for analysis):
    "document_id",
]
with open(csv_path, "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    for i, r in enumerate(sample, 1):
        w.writerow({
            "item_id": f"V{i:03d}",
            "stratum": r["judge_label"],
            "claim_id": r["claim_id"],
            "doc_source": r["doc_source"],
            "doc_title": r["doc_title"],
            "doc_url": r["doc_url"],
            "condition": r["condition"],
            "claim_text": r["claim_text"],
            "exact_quote": r["exact_quote"],
            "judge_label": r["judge_label"],
            "R1_label": "", "R2_label": "", "consensus_label": "",
            "R1_rationale": "", "R2_rationale": "", "consensus_rationale": "",
            "document_id": r["document_id"],
        })
print(f"  Wrote sample CSV: {csv_path} ({len(sample)} items)")
print(f"\n  Next steps:")
print(f"    1. Both raters label the CSV independently (protocol §5 codebook)")
print(f"    2. Adjudicate disagreements (protocol §10)")
print(f"    3. Run: python3 scripts/substrate/validation_analyze.py {csv_path}")
