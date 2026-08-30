#!/usr/bin/env python3
"""
rescore-claim-entailment.py
===========================

Scores entailment for claims against the live Supabase corpus.

WHY A NEW SCRIPT
----------------
The original entailment stage lives at whel-mvp/pipeline/verify_provenance.py,
but that pipeline reads and writes a LOCAL SQLite file (whel-mvp/data/whel.db)
via `conn.execute(... ?)`. Running it now would score an old local copy and
leave the live Supabase corpus untouched. This script keeps the same three
labels and the same output contract, but reads and writes the production
claims table.

A located quote proves the text EXISTS in the source. It does not prove the
quote SUPPORTS the claim. That second question is what this checks.

PROMPT v2 - DECLARED CONTEXT
----------------------------
v1 showed the judge a quote and a claim and nothing else, under the instruction
to judge from the premise alone. Hand-labelling in July 2026 found that it
broke that rule in a predictable place. Claims carry a condition qualifier
("...in vulvodynia") that the quoted sentence frequently does not repeat,
because the sentence sits inside a paper that established the population pages
earlier. Faced with that gap the judge filled it from its own recall of the
literature, which is the one move the prompt forbade, and the one move that
cannot be audited.

v2 hands it the gap-filler explicitly: the source title and the condition the
claim is filed under in our own database. The judge now resolves scope from
declared provenance instead of memory. Two guards keep this from becoming a
rubber stamp:

  1. CONTEXT resolves scope only. Findings, directions, effect sizes,
     significance and comparators must appear in the premise. A title saying
     what was studied is never evidence of what was found.
  2. The judge reports `used_context`, so the corpus can be split into claims
     the quote settles on its own and claims that lean on the filed condition.
     The second group is exactly where a mis-filed condition would do damage,
     and it is now enumerable rather than invisible.

The human labelling tool (scripts/label-claims.py) shows the rater the same
CONTEXT block, so rater and judge are answering the same question. Measuring
agreement between two people looking at different evidence measures nothing.

WHAT IT SCORES
--------------
By default, exactly the claims the original stage would pick up:

    provenance_verified = true AND entailment_label IS NULL

With --all, every genuinely extracted claim (model_name = claude-sonnet-4-6).
Template-rendered rows (pathway-render/*) are never scored: their "quote" is
generated from the same structured record as the claim, so checking one against
the other is circular.

SAFETY
------
Writes entailment_label and entailment_score only, one claim at a time, and
prints the before/after distribution. The run log records each claim's previous
label alongside the new one, so any re-score is reversible. Run with --dry-run
first to see the labels without writing.

USAGE
-----
    python3 scripts/rescore-claim-entailment.py --all --dry-run
    python3 scripts/rescore-claim-entailment.py --all
"""

from __future__ import annotations

import argparse
import json
import os
import socket
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _entailment_context import build_context  # noqa: E402
from _span_checks import names_drug, states_direction  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
DOTENV_PATH = REPO / ".env.local"
RUN_LOG_PATH = REPO / "scripts" / "audit-output" / "entailment-rescore.json"

DEFAULT_MODEL = "claude-sonnet-5"
MAX_ATTEMPTS = 4
PROMPT_VERSION = "verify_provenance/v2-declared-context"
EXTRACTED_MODEL = "claude-sonnet-4-6"

SYSTEM = """You are a natural-language-inference (NLI) verifier for biomedical claims.

You are given three things:
- CONTEXT: the source paper's title, and the condition that claim is filed under in our
  database. This is declared provenance from our own records.
- PREMISE: a verbatim quote from that paper.
- HYPOTHESIS: a claim drawn from that quote.

Decide whether the premise supports the hypothesis.

HOW TO USE CONTEXT. It resolves exactly ONE thing: which patient population or condition
the premise is talking about, when the premise itself does not name it. If the hypothesis
says "in vulvodynia", the premise does not say vulvodynia, and CONTEXT shows the source is
a vulvodynia paper, treat that qualifier as satisfied.

WHAT CONTEXT CANNOT DO. Nothing else at all. Every other element of the hypothesis must be
identifiable in the PREMISE itself:
- the intervention being claimed about,
- the comparator it is measured against,
- the outcome,
- the direction, magnitude and statistical significance of the effect.

If the hypothesis names a drug and the premise never names it, that is neutral even when
CONTEXT makes the drug obvious. If the hypothesis says "compared with X" and the premise
never mentions X, that is neutral. A title stating what was studied is never evidence of
what was found. Do not fall back on your own knowledge of the literature for any part of
this judgement.

Labels:
- "entailed": the premise, with CONTEXT resolving scope, clearly supports the hypothesis.
- "neutral": the premise neither clearly supports nor contradicts it (the claim overreaches).
- "contradicted": the premise asserts the opposite.

Also report used_context: true if the premise alone would not have settled which population
the hypothesis is about and you relied on CONTEXT to do it, false if the premise was
sufficient by itself.

Return ONLY JSON:
{"label": "entailed"|"neutral"|"contradicted", "score": 0.0-1.0, "used_context": true|false, "reason": str}
score = your confidence in the label."""

VALID = {"entailed", "neutral", "contradicted"}

# Second-stage adjudicator for spans the lexical prefilter flags.
#
# The prefilter (scripts/_span_checks.py) asks two questions with a word list:
# does the span name the drug, and does it state a direction. Tested against 50
# hand-labelled claims it flagged 10, and 5 of those flags were wrong. It cannot
# know that Wellbutrin is bupropion, that "does not support the use of" states a
# direction, or that "more likely to" is a comparison. A word list will never
# close that gap; language has too many ways to say these things.
#
# So the prefilter no longer vetoes anything. It selects which spans get asked
# these two narrow questions, which are far easier to answer reliably than a
# general entailment judgement. Only a "no" here overturns the verdict.
SUFFICIENCY = """You are checking whether a quoted PREMISE is self-sufficient evidence.

Answer two questions about the PREMISE alone. Do not use outside knowledge of the paper.

1. names_intervention: does the PREMISE refer to the INTERVENTION? A brand name, an
   abbreviation, a chemical synonym, or an unambiguous noun phrase ("both treatments",
   "the LNG-IUS group") all count as yes. Only answer no if a reader could not tell which
   intervention the sentence concerns.

2. states_direction: does the PREMISE say which way the effect went, or that there was no
   effect? Any of improved, reduced, increased, harmful, beneficial, no difference, did not
   support, more likely, comparable, well tolerated, and their paraphrases count as yes.
   Evaluative and informal wording counts too. Patient reports and narrative prose carry
   direction in ordinary language: "a miracle drug", "life-changing", "is vital in managing",
   "made everything worse", "did nothing for me". These are directions, stated plainly.
   Answer no only if the PREMISE is a bare list of endpoints, a bare statistic, or a
   statement of what was studied rather than what was found.

   IMPORTANT EXCEPTION. Some claims do not assert a direction at all. They assert what
   level of evidence exists, that a trial is underway, that a treatment is available or
   approved or commonly used, or that side effects exist. For any claim of that kind
   there is no direction to look for, so answer states_direction = true. Only apply this
   test when the CLAIM itself says something got better, worse, or stayed the same.

Return ONLY JSON: {"names_intervention": true|false, "states_direction": true|false}"""


def load_dotenv() -> None:
    if not DOTENV_PATH.exists():
        return
    for line in DOTENV_PATH.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def sb_request(method: str, url: str, headers: dict, payload=None):
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = resp.read()
        return json.loads(body) if body else None


def call_nli(api_key: str, model: str, context: str, premise: str, hypothesis: str):
    user = (f'CONTEXT:\n"""{context}"""\n\n'
            f'PREMISE:\n"""{premise}"""\n\n'
            f'HYPOTHESIS:\n"""{hypothesis}"""')
    # 400 was too tight: the judge writes a free-text `reason`, and on the longer
    # spans produced by the span-repair pass it ran out of budget mid-string,
    # yielding truncated JSON. That surfaced as 7 unrecoverable failures.
    body = json.dumps({
        "model": model,
        "max_tokens": 900,
        "system": SYSTEM,
        "messages": [{"role": "user", "content": user}],
    }).encode("utf-8")
    last_err = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        req = urllib.request.Request(
            "https://api.anthropic.com/v1/messages",
            data=body,
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = json.loads(resp.read())
            content = data.get("content") or []
            text = next((c.get("text") for c in content if c.get("type") == "text"), "")
            text = text.strip()
            if text.startswith("```"):
                text = text.split("```")[1].lstrip("json").strip()
            parsed = json.loads(text)
            label = str(parsed.get("label", "")).lower().strip()
            if label not in VALID:
                return None, f"invalid label: {label!r}"
            score = parsed.get("score")
            score = float(score) if isinstance(score, (int, float)) else None
            return {
                "label": label,
                "score": score,
                "used_context": bool(parsed.get("used_context")),
                "reason": parsed.get("reason", ""),
            }, None
        except urllib.error.HTTPError as e:
            detail = ""
            try:
                detail = e.read().decode("utf-8", errors="replace")[:200]
            except Exception:
                pass
            last_err = f"HTTP {e.code}: {detail}"
            if e.code != 429 and e.code < 500:
                return None, last_err
        except (socket.timeout, TimeoutError) as e:
            last_err = f"read timeout: {e}"
        except (urllib.error.URLError, OSError) as e:
            last_err = f"connection error: {e}"
        except json.JSONDecodeError as e:
            # Retryable. A truncated or malformed response is usually a one-off,
            # and silently dropping the claim leaves a hole in the corpus that
            # nothing downstream flags.
            last_err = f"unparseable JSON response: {e}"
        if attempt < MAX_ATTEMPTS:
            time.sleep(2 ** attempt)
    return None, last_err or "request failed"


def call_sufficiency(api_key: str, model: str, intervention: str, premise: str):
    """Ask the two narrow questions. Returns (names_it, states_dir) or (None, None)."""
    user = (f'INTERVENTION:\n"""{intervention}"""\n\nPREMISE:\n"""{premise}"""')
    body = json.dumps({
        "model": model, "max_tokens": 200, "system": SUFFICIENCY,
        "messages": [{"role": "user", "content": user}],
    }).encode("utf-8")
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            req = urllib.request.Request(
                "https://api.anthropic.com/v1/messages", data=body,
                headers={"x-api-key": api_key, "anthropic-version": "2023-06-01",
                         "content-type": "application/json"})
            with urllib.request.urlopen(req, timeout=90) as resp:
                data = json.loads(resp.read())
            text = next((c.get("text") for c in data.get("content") or []
                         if c.get("type") == "text"), "").strip()
            if text.startswith("```"):
                text = text.split("```")[1].lstrip("json").strip()
            p = json.loads(text)
            return bool(p.get("names_intervention")), bool(p.get("states_direction"))
        except Exception:
            if attempt < MAX_ATTEMPTS:
                time.sleep(2 ** attempt)
    # Could not adjudicate. Leave the verdict alone rather than downgrade on a
    # network failure.
    return None, None


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--limit", type=int, default=None)
    p.add_argument("--all", action="store_true",
                   help="Re-score every extracted claim, not just unscored ones.")
    p.add_argument("--relabel", default=None, metavar="LABEL",
                   help="Score only the claims currently carrying this entailment label "
                        "(e.g. --relabel neutral). Targets the database rather than the run "
                        "log, so it still works after a log has been overwritten. Use after "
                        "loosening the guard: a loosened guard can only move claims OUT of "
                        "neutral, so neutral is the complete set of claims that can change.")
    p.add_argument("--retry-failures", action="store_true",
                   help="Score only the claims that errored in the previous run, reading their "
                        "ids from the run log, and merge the results back in. Use after a run "
                        "dies partway (rate limit, credit exhaustion, dropped connection) so the "
                        "claims that already succeeded are not paid for twice.")
    p.add_argument("--workers", type=int, default=8, help="Parallel API calls. Default 8.")
    p.add_argument("--votes", type=int, default=3,
                   help="Score each claim this many times and take the majority label. "
                        "Default 3. Use 1 for a single pass.")
    p.add_argument("--dry-run", action="store_true", help="Score but do not write to the database.")
    args = p.parse_args()

    load_dotenv()
    base = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not (base and key and api_key):
        print("Missing NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY / ANTHROPIC_API_KEY", file=sys.stderr)
        return 1
    headers = {
        "apikey": key, "Authorization": f"Bearer {key}",
        "Accept": "application/json", "Content-Type": "application/json",
    }

    print("distribution BEFORE:")
    allrows = sb_request("GET", f"{base}/rest/v1/claims?select=entailment_label", headers)
    before = {}
    for r in allrows:
        k = r["entailment_label"] or "(unscored)"
        before[k] = before.get(k, 0) + 1
    for k in sorted(before):
        print(f"  {k:<14} {before[k]}")

    select = ("select=id,text,exact_quote,entailment_label,condition_id,intervention_id,"
              "documents(title,source,external_id,url)")
    carried: list[dict] = []
    if args.relabel:
        rows = sb_request("GET", f"{base}/rest/v1/claims?{select}"
                          f"&model_name=eq.{EXTRACTED_MODEL}&provenance_verified=is.true"
                          f"&entailment_label=eq.{args.relabel}", headers)
        print(f"\nre-scoring {len(rows)} claim(s) currently labelled '{args.relabel}'")
    elif args.retry_failures:
        if not RUN_LOG_PATH.exists():
            print(f"No previous run log at {RUN_LOG_PATH}", file=sys.stderr)
            return 1
        prior = json.loads(RUN_LOG_PATH.read_text())
        carried = prior.get("results", [])
        failed_ids = [f["id"] for f in prior.get("failures", [])]
        if not failed_ids:
            print("Previous run had no failures. Nothing to retry.")
            return 0
        print(f"\nretrying {len(failed_ids)} failed claim(s); "
              f"keeping {len(carried)} that already succeeded")
        rows = []
        for i in range(0, len(failed_ids), 40):
            in_list = ",".join(f'"{x}"' for x in failed_ids[i:i + 40])
            rows += sb_request("GET", f"{base}/rest/v1/claims?{select}&id=in.({in_list})", headers)
    else:
        if args.all:
            # Only genuine extractions. pathway-render/* rows render their "quote"
            # from the same record as the claim, so scoring them proves nothing.
            query = f"{select}&model_name=eq.{EXTRACTED_MODEL}&provenance_verified=is.true"
        else:
            query = f"{select}&provenance_verified=is.true&entailment_label=is.null"
        rows = sb_request("GET", f"{base}/rest/v1/claims?{query}", headers)
    rows = [r for r in rows if (r.get("exact_quote") or "").strip() and (r.get("text") or "").strip()]

    conds = sb_request("GET", f"{base}/rest/v1/entities?select=id,label&type=eq.condition", headers)
    conditions = {c["id"]: c["label"] for c in conds}
    ivs = sb_request("GET", f"{base}/rest/v1/entities?select=id,label&type=eq.intervention", headers)
    interventions = {c["id"]: c["label"] for c in ivs}

    targets = rows[: args.limit] if args.limit else rows
    print(f"\nscoring {len(targets)} claim(s) using {args.model}, prompt {PROMPT_VERSION}"
          f"{' (DRY RUN, no writes)' if args.dry_run else ''}…")

    def score_one(c):
        """Score a claim `--votes` times and return the majority verdict.

        A single pass is not reproducible. Measured over the neutrals, the judge
        returns the same label three times out of three on clear-cut claims but
        flips on roughly one borderline claim in seven, which moves the headline
        entailment rate by about a point between otherwise identical runs. That
        is a bad property for a number published on the site.

        Majority-of-three collapses most of that. It also produces the stability
        figure for free: any claim where the votes disagree is, by definition,
        one the judge finds genuinely borderline, and those are worth surfacing
        rather than hiding behind a rounded percentage.
        """
        context = build_context(c, conditions)
        verdicts, err = [], None
        for _ in range(max(1, args.votes)):
            v, e = call_nli(api_key, args.model, context, c["exact_quote"], c["text"])
            if e:
                err = e
                continue
            verdicts.append(v)
        if not verdicts:
            return c, (None, err or "all votes failed")

        labels = [v["label"] for v in verdicts]
        tally = {lab: labels.count(lab) for lab in set(labels)}
        top = max(tally.values())
        tied = sorted(lab for lab, n in tally.items() if n == top)
        # On a dead tie, take the weaker reading. Declining to call something
        # entailed costs a true positive; asserting it wrongly costs a citation.
        for fallback in ("contradicted", "neutral", "entailed"):
            if fallback in tied:
                winner = fallback
                break
        else:
            winner = tied[0]

        # Deterministic guard. The prompt already forbids reading the drug or the
        # direction of effect in from outside the span, and hand-labelling showed
        # the model doing it anyway: every confirmed judge error in the August
        # round was an "entailed" verdict on a quote that named no drug, or that
        # listed endpoints with the word "harmful" sitting in an earlier clause.
        # An instruction that does not hold is not a control. This is.
        guard, flagged = None, None
        if winner == "entailed":
            quote = c["exact_quote"]
            label_ = interventions.get(c.get("intervention_id"), "")
            if not names_drug(label_, quote):
                flagged = "drug not named in quote"
            # Only demand a direction from the quote when the CLAIM asserts one.
            # A first version of this check did not, and vetoed a whole family of
            # legitimate claims: "Acupuncture had the highest level of evidence",
            # "G-CSF is being assessed for efficacy", "Bioidentical estrogens are
            # available to treat vasomotor symptoms". None of those assert that
            # anything got better or worse. They assert evidence level, study
            # status, availability. Requiring a direction word from their quotes
            # is a category error, and it wrongly downgraded 15 of 29 flagged
            # claims. The check was tuned on a 50-item sample containing no
            # claims of this shape, which is exactly the failure mode that
            # tuning against a small hand-labelled set invites.
            elif states_direction(c["text"]) and not states_direction(quote):
                flagged = "quote states no direction of effect"
            if flagged:
                named, directed = call_sufficiency(api_key, args.model, label_ or c["text"], quote)
                if named is False:
                    guard = "drug not named in quote"
                elif directed is False:
                    guard = "quote states no direction of effect"
                if guard:
                    winner = "neutral"

        matching = [v for v in verdicts if v["label"] == winner] or verdicts
        scores = [v["score"] for v in matching if isinstance(v["score"], (int, float))]
        return c, ({
            "label": winner,
            "guard": guard,
            "prefilter_flagged": flagged,
            "score": round(sum(scores) / len(scores), 3) if scores else None,
            "used_context": any(v.get("used_context") for v in matching),
            "reason": matching[0].get("reason", ""),
            "votes": labels,
            "unanimous": len(set(labels)) == 1,
        }, None)

    results, failures = [], []
    done_n = 0
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for c, (verdict, err) in pool.map(score_one, targets):
            done_n += 1
            if done_n % 25 == 1 or done_n == len(targets):
                print(f"  · {done_n} / {len(targets)} …", flush=True)
            if err:
                failures.append({"id": c["id"], "error": err})
                continue
            results.append({
                "id": c["id"],
                "previous_label": c.get("entailment_label"),
                "claim": " ".join(str(c["text"]).split()),
                **verdict,
            })
            if not args.dry_run:
                sb_request(
                    "PATCH", f"{base}/rest/v1/claims?id=eq.{c['id']}", headers,
                    {"entailment_label": verdict["label"], "entailment_score": verdict["score"]},
                )

    if carried:
        # Fold the earlier run's successes back in so the summary describes the
        # whole corpus rather than just this retry slice.
        fresh = {r["id"] for r in results}
        results = [r for r in carried if r["id"] not in fresh] + results

    counts, changed, ctx_used, split, guarded = {}, [], 0, [], []
    for r in results:
        counts[r["label"]] = counts.get(r["label"], 0) + 1
        if r.get("used_context"):
            ctx_used += 1
        if r.get("previous_label") and r["previous_label"] != r["label"]:
            changed.append(r)
        if r.get("unanimous") is False:
            split.append(r)
        if r.get("guard"):
            guarded.append(r)

    # A dry run must never overwrite the real log. An earlier version did, and a
    # --dry-run --limit 4 destroyed the record of which claims a full run had
    # flagged, because the log is also the input to the targeted re-score modes.
    log_path = (RUN_LOG_PATH if not args.dry_run
                else RUN_LOG_PATH.with_name(RUN_LOG_PATH.stem + "-dryrun.json"))
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.write_text(json.dumps({
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model": args.model,
        "prompt_version": PROMPT_VERSION,
        "dry_run": args.dry_run,
        "scope": "all extracted claims" if args.all else "unscored only",
        "summary": {
            "scored": len(results), "failed": len(failures), "by_label": counts,
            "changed_from_previous": len(changed), "used_context": ctx_used,
        },
        "results": results,
        "failures": failures,
    }, indent=2) + "\n")

    print()
    print("=" * 60)
    print("Whel · entailment score")
    print("=" * 60)
    print(f"scored: {len(results)}   failed: {len(failures)}")
    for k in sorted(counts):
        print(f"  {k:<14} {counts[k]}")
    if results:
        pct = 100 * counts.get("entailed", 0) / len(results)
        print(f"\n  entailed rate  : {pct:.1f}%")
        print(f"  leaned on CONTEXT for scope : {ctx_used} of {len(results)} "
              f"({100 * ctx_used / len(results):.0f}%)")
        print("    (these are the claims whose condition qualifier is not in the quote;")
        print("     a mis-filed condition would show up here and nowhere else)")
    if args.votes > 1 and results:
        agreed = len(results) - len(split)
        print(f"\n  judge agreed with itself all {args.votes} times : {agreed} of {len(results)} "
              f"({100 * agreed / len(results):.1f}%)")
        if split:
            print(f"  genuinely borderline (votes split)         : {len(split)}")
            for d in split[:8]:
                print(f"    {'/'.join(d['votes']):<28} -> {d['label']:<9} {d['claim'][:38]}")
            if len(split) > 8:
                print(f"    ... and {len(split) - 8} more")
    if guarded:
        print(f"\n  judge said entailed, guard overruled it : {len(guarded)}")
        reasons: dict[str, int] = {}
        for g in guarded:
            reasons[g["guard"]] = reasons.get(g["guard"], 0) + 1
        for why in sorted(reasons):
            print(f"    {reasons[why]:>3}  {why}")
        for g in guarded[:6]:
            print(f"      {g['claim'][:60]}")
        if len(guarded) > 6:
            print(f"      ... and {len(guarded) - 6} more (see {RUN_LOG_PATH.name})")
    if changed:
        print(f"\n  changed from previous label: {len(changed)}")
        for d in changed[:10]:
            print(f"    {d['previous_label']:>13} → {d['label']:<13} {d['claim'][:46]}")
        if len(changed) > 10:
            print(f"    ... and {len(changed) - 10} more (see {RUN_LOG_PATH.name})")
    if failures:
        print(f"\n  first failure: {failures[0]['error'][:120]}")
    print(f"\nwrote {log_path.relative_to(REPO)}")
    if args.dry_run:
        print("\nDRY RUN — nothing was written. Re-run without --dry-run to apply.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
