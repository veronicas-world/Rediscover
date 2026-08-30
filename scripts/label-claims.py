#!/usr/bin/env python3
"""
label-claims.py
===============

Hand-label a sample of claims so the automated entailment judge can be
calibrated against a human.

WHY
---
Entailment labels on the corpus are produced by Claude. Claude also extracted
the claims. A judge that shares an architecture and training lineage with the
generator will tend to accept the generator's output, so the resulting rate is
not by itself evidence that the quotes support the claims. This is the
correlated-errors problem, and the standard correction is a set of human labels
to calibrate against.

CORRECTION, August 2026. An earlier version of this note said MiniCheck had been
rejected because GraphCheck (ACL 2025) showed it below frontier models on short
medical claims. That reading does not hold up. GraphCheck targets LONG-form text
and says so; its medical result is an average over COVID-Fact, PubHealth and
SciFact rather than a short-claim finding; and the system it compares is a
fine-tuned 70B model, not a frontier one. The paper in fact reports GPT-4o
underperforming on the SHORT medical datasets, which cuts the other way.

The baseline compared against was also the wrong model. Bespoke-MiniCheck-7B
currently leads the LLM-AggreFact board at 77.4 balanced accuracy, above
Claude-3.5 Sonnet at 77.2; the rejected model was the older Flan-T5 version at
75.0. A specialised second judge remains worth adding, not as a vote but as a
DECORRELATED cross-check whose disagreement rate estimates error.

PubMedBERT-NLI is still a fair thing to skip: it dates from 2020.

ROUND 1 (July 2026) AND WHAT IT FOUND
-------------------------------------
50 claims, 88% raw agreement, kappa 0.63. The six disagreements were not random.
Almost all were one pattern: the claim carries a condition qualifier ("...in
vulvodynia") that the quoted sentence never repeats. The rater called those
neutral. The judge called them entailed, having filled the gap from its own
recall of the literature despite a prompt telling it not to.

Recomputing round 1 under each convention showed the whole spread came from that
one unsettled definition:

    condition must appear in the quote     78% agreement, kappa 0.44
    condition may come from the source     94% agreement, kappa 0.79

Round 1 therefore measured an ambiguity in the task more than it measured the
corpus. Round 2 removes the ambiguity. Both the judge (prompt v2) and the rater
now see a CONTEXT block naming the source and the filed condition, under one
stated rule about what that context licenses. Disagreement that survives is
about judgement rather than about who was shown what.

WHAT IT DOES
------------
Draws a random sample of claims behind active signals, shows the CONTEXT, the
quote and the claim WITHOUT revealing the machine label, records the human
judgment, then reports agreement: raw percentage and Cohen's kappa.

Blinding matters. Seeing the machine's answer first would anchor the human
rating and inflate agreement, which defeats the purpose.

The sample is stratified across entailment labels by default so the rarer
neutral cases are represented; a purely random draw of 50 from a corpus that is
95% entailed would contain about three neutrals and say nothing about where the
judge actually struggles.

That stratification has a consequence that took a verification pass to catch.
Kappa depends on prevalence as well as on rater accuracy, so a kappa computed on
an enriched sample is NOT an estimate of the corpus kappa; it is biased upward,
here by roughly 0.2 to 0.35. The report therefore prints a design-weighted kappa
(Horvitz-Thompson, stratified bootstrap CI) as the figure to quote, and labels
the raw sample kappa as pertaining to the sample only. It also prints the
always-answer-the-majority-class baseline, because on a corpus this skewed that
baseline scores about 95% and any agreement figure has to be read against it.

Rounds never reuse a claim. Re-rating something you have already ruled on tests
your memory of your earlier answer, so each round draws only from claims you
have never been shown.

SAFETY
------
Reads from Supabase, writes only a local JSON file. Nothing in the database is
modified. Progress is saved after every judgment, so the session can be stopped
and resumed at any point.

USAGE
-----
    python3 scripts/label-claims.py                     # label round 2 (default)
    python3 scripts/label-claims.py --report            # round 2 stats
    python3 scripts/label-claims.py --report --round 1  # round 1 stats
"""

from __future__ import annotations

import argparse
import json
import os
import random
import sys
import textwrap
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _entailment_context import build_context  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
DOTENV_PATH = REPO / ".env.local"
LABELS_PATH = REPO / "scripts" / "audit-output" / "human-labels.json"

CURRENT_ROUND = 2
SEEDS = {1: 20260731, 2: 20260801}

VALID = {
    "e": "entailed",
    "n": "neutral",
    "c": "contradicted",
    "s": "skip",
}

PROTOCOL = """\
THE RULE (the machine is held to exactly this rule too)

  CONTEXT settles ONE thing: which condition or population the quote is about.
  If the claim says "in vulvodynia", the quote doesn't say vulvodynia, and CONTEXT
  shows a vulvodynia paper, that qualifier counts as met.

  CONTEXT settles nothing else. The drug, the comparator, the outcome, and the
  direction and size of the effect all have to be in the QUOTE. If the claim says
  "compared with COCP" and the quote never mentions COCP, that's neutral even if
  you're sure the paper compared them. A title saying what was studied is not
  evidence of what was found.

  Don't use your own knowledge of the literature for either part."""


def load_dotenv() -> None:
    if not DOTENV_PATH.exists():
        return
    for line in DOTENV_PATH.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def sb_get(base: str, headers: dict, path: str, params: str):
    req = urllib.request.Request(f"{base}/rest/v1/{path}?{params}", headers=headers)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read())


def load_labels() -> dict:
    if LABELS_PATH.exists():
        try:
            return json.loads(LABELS_PATH.read_text())
        except Exception:
            pass
    return {"schema_version": "1.1",
            "created": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "labels": {}}


def save_labels(store: dict) -> None:
    LABELS_PATH.parent.mkdir(parents=True, exist_ok=True)
    store["updated"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    LABELS_PATH.write_text(json.dumps(store, indent=2) + "\n")


def wrap(text: str, width: int = 76, indent: str = "  ") -> str:
    return textwrap.fill(" ".join(str(text).split()), width=width,
                         initial_indent=indent, subsequent_indent=indent)


def cohens_kappa(pairs: list[tuple[str, str]]) -> float | None:
    """Cohen's kappa: agreement corrected for what chance alone would produce.
    Raw agreement flatters a corpus dominated by one label."""
    if not pairs:
        return None
    cats = sorted({c for p in pairs for c in p})
    n = len(pairs)
    observed = sum(1 for a, b in pairs if a == b) / n
    expected = 0.0
    for c in cats:
        pa = sum(1 for a, _ in pairs if a == c) / n
        pb = sum(1 for _, b in pairs if b == c) / n
        expected += pa * pb
    if expected >= 1.0:
        return None
    return (observed - expected) / (1 - expected)


def interpret(k: float) -> str:
    if k < 0.0:   return "worse than chance"
    if k < 0.20:  return "slight"
    if k < 0.40:  return "fair"
    if k < 0.60:  return "moderate"
    if k < 0.80:  return "substantial"
    return "almost perfect"


def kappa_ci(pairs: list[tuple[str, str]]) -> tuple[float, float] | None:
    """Approximate 95% confidence interval for kappa.

    Worth printing because kappa from 50 items is a noisy estimate, and a bare
    point estimate invites more confidence than the sample supports.
    """
    if not pairs:
        return None
    n = len(pairs)
    cats = sorted({c for p in pairs for c in p})
    po = sum(1 for a, b in pairs if a == b) / n
    pe = sum((sum(1 for a, _ in pairs if a == c) / n) * (sum(1 for _, b in pairs if b == c) / n)
             for c in cats)
    if pe >= 1.0 or po >= 1.0:
        return None
    k = (po - pe) / (1 - pe)
    se = (po * (1 - po) / (n * (1 - pe) ** 2)) ** 0.5
    return max(-1.0, k - 1.96 * se), min(1.0, k + 1.96 * se)


def wilson(k: int, n: int) -> tuple[float, float]:
    """Wilson score interval. Behaves sanely at small n and near 0 or 1, where
    the normal approximation produces intervals running past the ends of the
    scale."""
    if n == 0:
        return (0.0, 1.0)
    p, z = k / n, 1.96
    d = 1 + z * z / n
    c = p + z * z / (2 * n)
    half = z * ((p * (1 - p) / n + z * z / (4 * n * n)) ** 0.5)
    return max(0.0, (c - half) / d), min(1.0, (c + half) / d)


def kappa_from_table(tab: dict) -> tuple[float, float] | None:
    """(observed agreement, kappa) from a {(human, machine): weight} table."""
    n = sum(tab.values())
    if not n:
        return None
    cats = sorted({c for pair in tab for c in pair})
    po = sum(v for pair, v in tab.items() if pair[0] == pair[1]) / n
    pe = sum((sum(v for pair, v in tab.items() if pair[0] == c) / n) *
             (sum(v for pair, v in tab.items() if pair[1] == c) / n) for c in cats)
    if pe >= 1.0:
        return None
    return po, (po - pe) / (1 - pe)


def weighted_kappa(pairs, corpus_counts: dict, boot: int = 3000, seed: int = 11):
    """Kappa reweighted from the enriched validation sample back to the corpus.

    THIS IS THE NUMBER THAT ESTIMATES CORPUS RELIABILITY. The raw sample kappa
    does not, and the difference is large.

    The sample deliberately oversamples the rare `neutral` class, roughly 4x, so
    that the class the judge struggles with is actually represented. That is good
    design: a random draw of 50 from a corpus that is 95% entailed would contain
    about three neutrals and estimate nothing. But kappa is a function of
    sensitivity, specificity AND prevalence (Thompson & Walter 1988; Kraemer
    1979), so enriching the rare class pushes prevalence toward 0.5, which is
    exactly where kappa is largest for fixed accuracy. Measured on this corpus
    the inflation is about 0.2 to 0.35 kappa points, enough to move the result
    two bands on the Landis-Koch scale.

    Horvitz-Thompson fixes it: weight each sampled item by N_stratum / n_stratum,
    strata being the machine's own label, then compute kappa on the reweighted
    table. The interval comes from a stratified bootstrap rather than the Wald
    formula, which is unreliable below n≈200 and with an empty cell.
    """
    strata: dict[str, list[str]] = {}
    for h, m in pairs:
        strata.setdefault(m, []).append(h)
    if not all(s in corpus_counts and strata[s] for s in strata):
        return None

    def build(sample: dict) -> dict:
        tab: dict[tuple[str, str], float] = {}
        for m, humans in sample.items():
            w = corpus_counts[m] / len(humans)
            for h in humans:
                tab[(h, m)] = tab.get((h, m), 0.0) + w
        return tab

    point = kappa_from_table(build(strata))
    if not point:
        return None
    rng = random.Random(seed)
    draws = []
    for _ in range(boot):
        res = {m: [rng.choice(hs) for _ in hs] for m, hs in strata.items()}
        got = kappa_from_table(build(res))
        if got:
            draws.append(got[1])
    draws.sort()
    lo = draws[int(0.025 * len(draws))] if draws else None
    hi = draws[int(0.975 * len(draws))] if draws else None
    return {"po": point[0], "kappa": point[1], "lo": lo, "hi": hi}


def fetch_corpus_counts() -> dict | None:
    """Label distribution over the whole corpus, for the reweighting above."""
    load_dotenv()
    base = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    if not (base and key):
        return None
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Accept": "application/json"}
    try:
        sigs = sb_get(base, headers, "substrate_signals", "select=claim_ids&status=eq.active")
        ref = {str(c) for s in sigs for c in (s.get("claim_ids") or [])}
        rows = sb_get(base, headers, "claims",
                      "select=id,entailment_label&model_name=eq.claude-sonnet-4-6"
                      "&provenance_verified=is.true")
    except Exception:
        return None
    counts: dict[str, int] = {}
    for r in rows:
        if str(r["id"]) in ref and r.get("entailment_label"):
            counts[r["entailment_label"]] = counts.get(r["entailment_label"], 0) + 1
    return counts or None


def round_stats(store: dict, rnd: int, revised: bool = False):
    """Agreement for one round.

    `revised` uses the rater's corrected label where one was recorded. Both
    figures get reported. Corrections were made after seeing the machine's
    answer, so the revised number is no longer blind and reads high; the
    as-labelled number is blind but carries known clerical errors. Neither alone
    is the honest summary.
    """
    labeled = [v for v in store["labels"].values()
               if v.get("human") and v["human"] != "skip" and v.get("round", 1) == rnd]
    def call(v):
        return (v.get("human_revised") or v["human"]) if revised else v["human"]
    pairs = [(call(v), v["machine"]) for v in labeled if v.get("machine")]
    if not pairs:
        return None
    return {
        "labeled": labeled,
        "pairs": pairs,
        "agree": sum(1 for a, b in pairs if a == b),
        "kappa": cohens_kappa(pairs),
        "ci": kappa_ci(pairs),
        "call": call,
    }


def report(store: dict, rnd: int) -> None:
    """Report in the order a reviewer will read it.

    Kappa is deliberately NOT the headline. On a corpus that is 95% one class,
    kappa is dominated by prevalence rather than by how good the judge is
    (Feinstein & Cicchetti 1990; Byrt, Bishop & Carlin 1993), and this sample is
    enriched on top of that. The quantities that survive both problems are the
    confusion table, and recall and precision on the rare class. Those go first.
    """
    st = round_stats(store, rnd)
    if not st:
        print(f"No labels recorded yet for round {rnd}.")
        return
    rev = round_stats(store, rnd, revised=True)
    n_rev = sum(1 for v in st["labeled"] if v.get("human_revised"))
    corpus = fetch_corpus_counts()
    cats = ["entailed", "neutral", "contradicted"]

    print()
    print("=" * 68)
    print(f"Judge validation - round {rnd}")
    print("=" * 68)

    for tag, s in (("BLIND (the reliability figure)", st),
                   ("AFTER RATER CORRECTIONS (not blind)", rev if n_rev else None)):
        if not s:
            continue
        pairs = s["pairs"]
        n = len(pairs)
        print(f"\n  {tag}")
        print(f"    n = {n}")
        print("    confusion (rows = human, cols = machine):")
        print("               " + "".join(f"{c[:7]:>10}" for c in cats))
        for h in cats:
            row = "".join(f"{sum(1 for a, b in pairs if a == h and b == c):>10}" for c in cats)
            print(f"      {h:<10}{row}")

        # Recall and precision on `neutral`, treating the human as reference.
        # Unlike kappa these do not shift when the sample is enriched, because
        # they condition on one rater's label rather than on the joint margins.
        hn = sum(1 for a, _ in pairs if a == "neutral")
        mn = sum(1 for _, b in pairs if b == "neutral")
        tp = sum(1 for a, b in pairs if a == "neutral" and b == "neutral")
        if hn:
            lo, hi = wilson(tp, hn)
            print(f"    neutral recall    : {tp}/{hn} = {100*tp/hn:.0f}%   95% CI [{100*lo:.0f}%, {100*hi:.0f}%]")
        if mn:
            lo, hi = wilson(tp, mn)
            print(f"    neutral precision : {tp}/{mn} = {100*tp/mn:.0f}%   95% CI [{100*lo:.0f}%, {100*hi:.0f}%]")

        agree = s["agree"]
        print(f"    raw agreement     : {agree}/{n} = {100*agree/n:.1f}%")
        # A judge that answers "entailed" every time. If the real judge is not
        # clearly above this, the agreement figure means nothing.
        triv = sum(1 for a, _ in pairs if a == "entailed")
        print(f"      vs always-'entailed' baseline on this sample: {triv}/{n} = {100*triv/n:.0f}%")

        k = s["kappa"]
        if k is not None:
            ci = s.get("ci")
            band = f"   95% CI [{ci[0]:.2f}, {ci[1]:.2f}]" if ci else ""
            print(f"    kappa (SAMPLE)    : {k:.2f}{band}")
            print("      ^ pertains to the prevalence-enriched sample. NOT a corpus estimate.")
        if corpus:
            w = weighted_kappa(pairs, corpus)
            if w:
                band = (f"   95% CI [{w['lo']:.2f}, {w['hi']:.2f}]"
                        if w["lo"] is not None else "")
                print(f"    kappa (CORPUS)    : {w['kappa']:.2f}  ({interpret(w['kappa'])}){band}")
                print("      ^ design-weighted to corpus prevalence, stratified bootstrap CI.")
                print("        This is the one to quote.")

        # Byrt, Bishop & Carlin 1993: report these next to kappa so a reader can
        # see how much of it is prevalence rather than agreement.
        if len(set(b for _, b in pairs)) > 1:
            a_ = sum(1 for x, y in pairs if x == "entailed" and y == "entailed")
            d_ = sum(1 for x, y in pairs if x == "neutral" and y == "neutral")
            b_ = sum(1 for x, y in pairs if x == "entailed" and y == "neutral")
            c_ = sum(1 for x, y in pairs if x == "neutral" and y == "entailed")
            print(f"    prevalence index  : {abs(a_-d_)/n:.2f}      bias index: {abs(b_-c_)/n:.2f}")

    if n_rev:
        print(f"\n  {n_rev} label(s) were revised by the rater AFTER seeing the machine's answer.")
        print("  That breaks blinding, so the revised figures are an error analysis, not a")
        print("  reliability estimate. Quote the blind ones.")

    if corpus:
        tot = sum(corpus.values())
        print(f"\n  corpus: " + ", ".join(f"{k_} {v} ({100*v/tot:.0f}%)" for k_, v in sorted(corpus.items())))
        big = max(corpus, key=corpus.get)
        print(f"  a judge that answers '{big}' every time scores {100*corpus[big]/tot:.1f}% on the corpus.")
        if corpus.get("contradicted", 0) == 0:
            print("  NOTE: 'contradicted' has never been emitted. That class is unvalidated;")
            print("  the human never saw one either, so this study cannot detect its absence.")
        samp = {}
        for _, b in st["pairs"]:
            samp[b] = samp.get(b, 0) + 1
        rare = min(corpus, key=lambda c: corpus[c] if corpus[c] else 10**9)
        if corpus.get(rare) and samp.get(rare):
            enrich = (samp[rare] / len(st["pairs"])) / (corpus[rare] / tot)
            print(f"  sample is enriched {enrich:.1f}x for '{rare}' relative to the corpus.")

    call = (rev or st)["call"]
    disagreements = [v for v in st["labeled"] if v.get("machine") and call(v) != v["machine"]]
    if disagreements:
        print(f"\n  disagreements ({len(disagreements)}) - these are the interesting ones:")
        for d in disagreements[:8]:
            print(f"    human {call(d):<11} machine {d['machine']:<11} {d['claim'][:50]}")
        if len(disagreements) > 8:
            print(f"    ... and {len(disagreements) - 8} more (see {LABELS_PATH.name})")
    print(f"\n  full record: {LABELS_PATH.relative_to(REPO)}")


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--n", type=int, default=50, help="Sample size to draw. Default 50.")
    p.add_argument("--round", type=int, default=CURRENT_ROUND, help="Labeling round.")
    p.add_argument("--report", action="store_true", help="Print agreement stats and exit.")
    p.add_argument("--seed", type=int, default=None, help="Sampling seed, for a reproducible sample.")
    p.add_argument("--no-stratify", action="store_true",
                   help="Draw a purely random sample instead of balancing across labels.")
    args = p.parse_args()

    store = load_labels()
    if args.report:
        report(store, args.round)
        return 0

    load_dotenv()
    base = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    if not (base and key):
        print("Missing Supabase credentials in .env.local", file=sys.stderr)
        return 1
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Accept": "application/json"}

    signals = sb_get(base, headers, "substrate_signals", "select=claim_ids&status=eq.active")
    referenced = {str(c) for s in signals for c in (s.get("claim_ids") or [])}

    claims = sb_get(base, headers, "claims",
                    "select=id,text,exact_quote,entailment_label,model_name,condition_id,"
                    "documents(title,source,external_id,url)")
    conds = sb_get(base, headers, "entities", "select=id,label&type=eq.condition")
    conditions = {c["id"]: c["label"] for c in conds}

    # Claims seen in an earlier round are off the table. A second opinion on
    # something you already ruled on is a memory test, not an independent rating.
    seen = {cid for cid, v in store["labels"].items() if v.get("round", 1) != args.round}

    pool = [c for c in claims
            if str(c["id"]) in referenced
            and str(c["id"]) not in seen
            and c.get("model_name") == "claude-sonnet-4-6"     # extracted, not template-rendered
            and c.get("entailment_label")
            and (c.get("exact_quote") or "").strip()]

    seed = args.seed if args.seed is not None else SEEDS.get(args.round, 20260731 + args.round)
    rng = random.Random(seed)
    if args.no_stratify:
        sample = rng.sample(pool, min(args.n, len(pool)))
    else:
        # Balance across labels so rare classes are actually represented.
        by_label: dict[str, list] = {}
        for c in pool:
            by_label.setdefault(c["entailment_label"], []).append(c)
        for v in by_label.values():
            rng.shuffle(v)
        sample, i = [], 0
        while len(sample) < min(args.n, len(pool)):
            added = False
            for lab in sorted(by_label):
                if i < len(by_label[lab]) and len(sample) < args.n:
                    sample.append(by_label[lab][i])
                    added = True
            if not added:
                break
            i += 1

    todo = [c for c in sample if str(c["id"]) not in store["labels"]]
    done = len(sample) - len(todo)

    print()
    print(f"Round {args.round}. Sample of {len(sample)} claims "
          f"({len(pool)} eligible, {len(seen)} excluded as already seen).")
    if done:
        print(f"{done} already labeled; {len(todo)} to go.")
    print()
    print("Each screen shows CONTEXT (where the quote came from), the QUOTE, and the")
    print("CLAIM drawn from it. The machine's label stays hidden until afterwards, so it")
    print("can't anchor your answer.")
    print()
    print(PROTOCOL)
    print()
    print("  [e] entailed      the quote supports the claim")
    print("  [n] neutral       the quote neither supports nor contradicts it")
    print("  [c] contradicted  the quote says the opposite")
    print("  [s] skip          unsure, or you want to come back to it")
    print("  [q] quit          progress is saved after every answer")
    print()

    for idx, c in enumerate(todo, start=1):
        context = build_context(c, conditions)
        print("-" * 78)
        print(f"  {idx} of {len(todo)}")
        print()
        print("  CONTEXT")
        for line in context.splitlines():
            print(wrap(line, indent="    "))
        print()
        print("  QUOTE")
        print(wrap(c["exact_quote"], indent="    "))
        print()
        print("  CLAIM")
        print(wrap(c["text"], indent="    "))
        print()
        while True:
            try:
                ans = input("  your call [e/n/c/s/q]: ").strip().lower()
            except (EOFError, KeyboardInterrupt):
                print("\n\nStopped. Progress saved.")
                save_labels(store)
                report(store, args.round)
                return 0
            if ans == "q":
                print("\nStopped. Progress saved.")
                save_labels(store)
                report(store, args.round)
                return 0
            if ans in VALID:
                break
            print("  please enter e, n, c, s, or q")

        d = c.get("documents") or {}
        if isinstance(d, list):
            d = d[0] if d else {}
        store["labels"][str(c["id"])] = {
            "round": args.round,
            "human": VALID[ans],
            "machine": c["entailment_label"],
            "claim": " ".join(str(c["text"]).split()),
            "quote": " ".join(str(c["exact_quote"]).split()),
            "context": context,
            "source": f"{d.get('source','?')} {d.get('external_id','')}".strip(),
            "labeled_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        }
        save_labels(store)

        if VALID[ans] != "skip":
            m = c["entailment_label"]
            print(f"  machine said: {m}" + ("   (agreed)" if m == VALID[ans] else "   (DISAGREED)"))
        print()

    print("Sample complete.")
    report(store, args.round)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
