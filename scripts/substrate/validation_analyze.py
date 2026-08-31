#!/usr3/env python3
"""
Validation study — analysis (protocol §8–11).

Reads the labelled CSV from validation_sample.py and computes:
  - Primary: false omission rate P(human=neutral | judge=entailed), Wilson CI
  - Co-primary: precision on neutral P(human=neutral | judge=neutral)
  - Secondary: human-vs-human agreement, Cohen's kappa, confusion matrices,
    prevalence/bias indices, ratio of human-machine to human-human agreement
  - Decision rule: ≤5% fit, 5–15% publishable, >15% withdraw

Usage:
  python3 scripts/substrate/validation_analyze.py docs/validation-sample-*.csv

The CSV must have R1_label, R2_label, and consensus_label filled in.
"""
import csv, sys, math, json
from collections import Counter, defaultdict
import numpy as np

LABELS = ["entailed", "neutral", "contradicted"]

def wilson_ci(k, n, z=1.96):
    """Wilson score interval for a binomial proportion."""
    if n == 0: return (0, 0, 0)
    p = k / n
    denom = 1 + z**2 / n
    centre = (p + z**2 / (2 * n)) / denom
    half = z * math.sqrt(p * (1 - p) / n + z**2 / (4 * n**2)) / denom
    return p, max(0, centre - half), min(1, centre + half)

def cohen_kappa(labels_a, labels_b):
    """Cohen's kappa for two raters over the same items."""
    n = len(labels_a)
    if n == 0: return float("nan"), 0
    p_o = sum(a == b for a, b in zip(labels_a, labels_b)) / n
    ca = Counter(labels_a)
    cb = Counter(labels_b)
    p_e = sum((ca.get(l, 0) / n) * (cb.get(l, 0) / n) for l in LABELS)
    if p_e == 1: return 1.0, p_o
    return (p_o - p_e) / (1 - p_e), p_o

def confusion_matrix(labels_a, labels_b, labels=LABELS):
    """Rows = a (reference), cols = b (test)."""
    cm = np.zeros((len(labels), len(labels)), dtype=int)
    idx = {l: i for i, l in enumerate(labels)}
    for a, b in zip(labels_a, labels_b):
        if a in idx and b in idx:
            cm[idx[a], idx[b]] += 1
    return cm

def prevalence_bias_indices(cm):
    """Byrt, Bishop & Carlin (1993) prevalence and bias indices."""
    n = cm.sum()
    if n == 0: return {}
    # Binary collapse: positive = entailed, negative = not-entailed
    tp = cm[0, 0]; fp = cm[1, 0] + cm[2, 0] if len(cm) > 2 else 0
    fn = cm[0, 1] + cm[0, 2] if len(cm) > 2 else 0
    tn = cm[1, 1] + cm[1, 2] + cm[2, 1] + cm[2, 2] if len(cm) > 2 else cm[1, 1]
    # Actually for 3x3, collapse to 2x2: entailed vs not-entailed
    tp = int(cm[0, 0])
    fn_ = int(cm[0, 1:].sum())
    fp_ = int(cm[1:, 0].sum())
    tn_ = int(cm[1:, 1:].sum())
    prev_obs = (tp + fp_) / n if n else 0  # prevalence in test
    prev_ref = (tp + fn_) / n if n else 0    # prevalence in reference
    bias = prev_obs - prev_ref
    prev_index = (tp + fn_) / n if n else 0  # prevalence (reference)
    # p_pos / p_neg (Feinstein & Cicchetti 1990)
    sens = tp / (tp + fn_) if (tp + fn_) else 0
    spec = tn_ / (tn_ + fp_) if (tn_ + fp_) else 0
    p_pos = sens
    p_neg = spec
    return {
        "prevalence_ref": round(prev_ref, 4),
        "prevalence_test": round(prev_obs, 4),
        "bias_index": round(bias, 4),
        "sensitivity": round(sens, 4),
        "specificity": round(spec, 4),
        "p_pos": round(p_pos, 4),
        "p_neg": round(p_neg, 4),
    }

def bootstrap_clustered(items, stat_fn, cluster_key, n_boot=2000, seed=42):
    """Wild cluster bootstrap: resample clusters (documents), not items."""
    rng = np.random.default_rng(seed)
    clusters = defaultdict(list)
    for i, item in enumerate(items):
        clusters[item.get(cluster_key, f"_no_cluster_{i}")].append(i)
    cluster_ids = list(clusters.keys())
    boot_stats = []
    for _ in range(n_boot):
        sampled = rng.choice(cluster_ids, size=len(cluster_ids), replace=True)
        boot_items = []
        for cid in sampled:
            boot_items.extend(clusters[cid])
        boot_items = [items[i] for i in boot_items]
        s = stat_fn(boot_items)
        if s is not None and not math.isnan(s):
            boot_stats.append(s)
    if not boot_stats:
        return float("nan"), float("nan"), float("nan")
    arr = np.array(boot_stats)
    point = stat_fn(items)
    lo, hi = np.percentile(arr, [2.5, 97.5])
    return point, float(lo), float(hi)

# ── Load data ────────────────────────────────────────────────────────────────
if len(sys.argv) < 2:
    sys.exit("Usage: python3 validation_analyze.py <labelled-csv>")

rows = []
with open(sys.argv[1]) as f:
    for r in csv.DictReader(f):
        rows.append(r)

# Filter to items with consensus label filled in
labelled = [r for r in rows if r.get("consensus_label", "").strip()]
if not labelled:
    # Fall back to R2 as reference (protocol §3: R2 is primary)
    labelled = [r for r in rows if r.get("R2_label", "").strip()]
    ref_key = "R2_label"
    print("  No consensus labels found; using R2 as reference (protocol §3).")
else:
    ref_key = "consensus_label"

print(f"  Loaded {len(labelled)} labelled items (reference = {ref_key})\n")

# ── Primary endpoint: false omission rate (protocol §8) ─────────────────────
# P(human = neutral | judge = entailed) — within the entailed stratum
entailed_items = [r for r in labelled if r["judge_label"] == "entailed"]
n_ent = len(entailed_items)
n_false_omission = sum(1 for r in entailed_items if r[ref_key].strip() == "neutral")
for_p, for_lo, for_hi = wilson_ci(n_false_omission, n_ent)

print("=" * 70)
print("PRIMARY: False omission rate  P(human=neutral | judge=entailed)")
print("=" * 70)
print(f"  {n_false_omission} / {n_ent} = {for_p:.1%}  (Wilson 95% CI: {for_lo:.1%}–{for_hi:.1%})")
print(f"  Document-clustered bootstrap CI:")
for_p_boot, for_lo_boot, for_hi_boot = bootstrap_clustered(
    entailed_items,
    lambda items: (sum(1 for r in items if r[ref_key].strip() == "neutral") / len(items)) if items else float("nan"),
    "document_id",
)
print(f"  {for_p_boot:.1%}  (bootstrap 95% CI: {for_lo_boot:.1%}–{for_hi_boot:.1%})")

# ── Co-primary: precision on neutral (protocol §8) ──────────────────────────
neutral_items = [r for r in labelled if r["judge_label"] == "neutral"]
n_neu = len(neutral_items)
n_prec_neutral = sum(1 for r in neutral_items if r[ref_key].strip() == "neutral")
prec_p, prec_lo, prec_hi = wilson_ci(n_prec_neutral, n_neu)

print(f"\n{'=' * 70}")
print("CO-PRIMARY: Precision on neutral  P(human=neutral | judge=neutral)")
print("=" * 70)
print(f"  {n_prec_neutral} / {n_neu} = {prec_p:.1%}  (Wilson 95% CI: {prec_lo:.1%}–{prec_hi:.1%})")

# ── Secondary 1: human-vs-human agreement (protocol §8.1) ───────────────────
r1_labels = [r.get("R1_label", "").strip() for r in labelled if r.get("R1_label", "").strip()]
r2_labels = [r.get("R2_label", "").strip() for r in labelled if r.get("R2_label", "").strip()]
# Match on items where both labelled
both = [r for r in labelled if r.get("R1_label", "").strip() and r.get("R2_label", "").strip()]
if both:
    a = [r["R1_label"].strip() for r in both]
    b = [r["R2_label"].strip() for r in both]
    kappa_hh, raw_hh = cohen_kappa(a, b)
    print(f"\n{'=' * 70}")
    print("SECONDARY 1: Human-vs-human reliability ceiling")
    print("=" * 70)
    print(f"  Raw agreement: {raw_hh:.1%}  ({sum(x==y for x,y in zip(a,b))} / {len(a)})")
    print(f"  Cohen's kappa: {kappa_hh:.3f}")
else:
    kappa_hh = float("nan")
    print("\n  [Secondary 1] Not computable: need both R1 and R2 labels.")

# ── Secondary 2: human-machine agreement (protocol §8.2–3) ───────────────────
judge_labels = [r["judge_label"].strip() for r in labelled]
human_labels = [r[ref_key].strip() for r in labelled]
kappa_hm, raw_hm = cohen_kappa(human_labels, judge_labels)

print(f"\n{'=' * 70}")
print("SECONDARY 2–3: Human-machine agreement")
print("=" * 70)
print(f"  Raw agreement: {raw_hm:.1%}  ({sum(x==y for x,y in zip(human_labels, judge_labels))} / {len(labelled)})")
print(f"  Cohen's kappa: {kappa_hm:.3f}")
if not math.isnan(kappa_hh):
    print(f"  Ratio (HM / HH): {kappa_hm / kappa_hh:.2f}  (how close to the human ceiling)")

# ── Secondary 4: confusion matrices (protocol §8.4) ─────────────────────────
cm_hm = confusion_matrix(human_labels, judge_labels)
print(f"\n{'=' * 70}")
print("SECONDARY 4: Confusion matrix (rows=human, cols=judge)")
print("=" * 70)
print(f"  {'':>14}  " + "  ".join(f"{l:>13}" for l in LABELS))
for i, l in enumerate(LABELS):
    print(f"  {l:>14}  " + "  ".join(f"{int(cm_hm[i,j]):>13}" for j in range(len(LABELS))))

# ── Secondary 5: prevalence and bias indices (protocol §8.5) ────────────────
pbi = prevalence_bias_indices(cm_hm)
print(f"\n{'=' * 70}")
print("SECONDARY 5: Prevalence and bias indices (Byrt et al. 1993)")
print("=" * 70)
for k, v in pbi.items():
    print(f"  {k:>20}: {v}")

# ── Secondary 6: do-nothing baseline (protocol §8 note) ─────────────────────
baseline = sum(1 for l in human_labels if l == "entailed") / len(human_labels) if human_labels else 0
print(f"\n  Do-nothing baseline (judge says 'entailed' to everything): {baseline:.1%}")

# ── Decision rule (protocol §11) ─────────────────────────────────────────────
print(f"\n{'=' * 70}")
print("DECISION RULE (pre-registered)")
print("=" * 70)
if for_p <= 0.05:
    verdict = "FIT — the judge is fit for the site as it stands."
elif for_p <= 0.15:
    verdict = f"PUBLISHABLE — publish with the rate ({for_p:.1%}) stated prominently beside the entailment figure."
else:
    verdict = f"WITHDRAW — the entailment figure ({for_p:.1%}) must be withdrawn from the site until fixed."
print(f"  False omission rate: {for_p:.1%}")
print(f"  Verdict: {verdict}")

# ── Save results ─────────────────────────────────────────────────────────────
results = {
    "primary": {
        "false_omission_rate": for_p,
        "wilson_ci": [for_lo, for_hi],
        "bootstrap_ci": [for_lo_boot, for_hi_boot],
        "n": n_ent,
        "n_false_omission": n_false_omission,
    },
    "co_primary": {
        "precision_neutral": prec_p,
        "wilson_ci": [prec_lo, prec_hi],
        "n": n_neu,
    },
    "secondary": {
        "human_human_raw": raw_hh if both else None,
        "human_human_kappa": kappa_hh if both else None,
        "human_machine_raw": raw_hm,
        "human_machine_kappa": kappa_hm,
        "ratio": (kappa_hm / kappa_hh) if both and not math.isnan(kappa_hh) else None,
        "confusion_matrix": cm_hm.tolist(),
        "prevalence_bias": pbi,
        "do_nothing_baseline": baseline,
    },
    "decision": verdict,
    "n_labelled": len(labelled),
    "reference": ref_key,
}
out_path = sys.argv[1].replace(".csv", "-results.json")
with open(out_path, "w") as f:
    json.dump(results, f, indent=2)
print(f"\n  Results saved: {out_path}")
