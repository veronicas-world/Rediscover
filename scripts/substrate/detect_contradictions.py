"""Stage 5 - contradiction surfacing (the wedge). Within each (intervention,
condition) group we compare EFFICACY claims only (safety claims are a different
aspect and not contradictions of efficacy), look for conflicting directions, and
confirm each candidate with an NLI check before recording it. Both sides keep
their provenance.

Every evaluated pair — accepted or rejected — is logged to a JSONL file so the
detection gate's rejection rate is auditable. Gates 2-4 can only reject, so a
detector that produces zero contradictions needs its rejections to be
inspectable.
"""
import json
from itertools import combinations
from datetime import datetime, timezone
from pathlib import Path

from llm import complete_json, prompt_hash, map_parallel
from config import MODEL
import db

SYSTEM = """You judge whether two biomedical claims about the same drug and condition
genuinely CONTRADICT each other. Work through the gates in order. If any gate
fails, the pair is NOT a contradiction — the claims are about different things.

Gate 1 — SAME INTERVENTION: both claims name the same drug or compound
  (a brand name, abbreviation, or unambiguous referent counts).

Gate 2 — SAME COMPARATOR: if either claim asserts a comparator (e.g.,
  "versus placebo", "compared to metformin"), both claims must name the
  same comparator. If one claim compares to X and the other compares to
  Y, they are about different comparisons, not a contradiction. If
  neither claim asserts a comparator, this gate passes.

Gate 3 — SAME OUTCOME: both claims report on the same clinical or
  biochemical outcome. "Hirsutism" and "free androgen index" are distinct
  outcomes even if mechanistically related. "All-cause mortality" and
  "cardiovascular events" are distinct outcomes.

Gate 4 — SAME POPULATION: both claims describe the same patient population,
  including timing qualifiers. "Early initiation" and general
  "postmenopausal women" are different populations. If one claim is scoped
  to a subgroup and the other is a general-population statement, they are
  not contradicting — they are about different groups.

If all four gates pass, check whether the claims assert opposing directions
of effect (one says the treatment helps, the other says it does not, or
one says it helps and the other says it harms).

Record whether the two claims come from the same source document. Two
findings from one paper are a within-source tension, not a between-source
contradiction. Record same_document=true for these pairs — the information
is worth keeping, but it is not a consistency signal.

Return ONLY JSON:
{"contradiction": true|false, "score": 0.0-1.0, "same_document": true|false,
 "gate": "<which gate failed, or 'direction_opposed'>", "rationale": "one line"}
Set contradiction=true only if all gates pass, directions are opposed, and
the claims come from different source documents."""

PROMPT_VERSION = "detect_contradictions/v2"

_CONFLICT = {
    tuple(sorted(("positive", "negative"))),
    tuple(sorted(("positive", "null"))),
    tuple(sorted(("negative", "null"))),
}

# Rejection log: every evaluated pair is recorded so the gate's rejection
# rate is auditable. A detector that can only output zeros needs its
# rejections to be inspectable.
LOG_PATH = Path(__file__).resolve().parent.parent / "audit-output" / "contradiction-detection-log.jsonl"


def _pair_key(a, b):
    return tuple(sorted((a, b)))


def run():
    conn = db.connect()
    # Only ENTAILED efficacy claims are eligible. A contradiction is only
    # trustworthy if BOTH sides faithfully represent their sources; a claim that
    # overreaches its own quote (entailment = neutral/contradicted) is exactly
    # what the substrate refuses to build on.
    groups = {}
    for r in conn.execute(
        "SELECT id, text, intervention_id, condition_id, direction, exact_quote, "
        "document_id, outcome "
        "FROM claims WHERE provenance_verified = 1 AND aspect = 'efficacy' "
        "AND entailment_label = 'entailed'").fetchall():
        groups.setdefault((r["intervention_id"], r["condition_id"]), []).append(r)

    candidates = []
    for (iid, cid), claims in groups.items():
        for a, b in combinations(claims, 2):
            if _pair_key(a["direction"], b["direction"]) not in _CONFLICT:
                continue
            if conn.execute(
                "SELECT 1 FROM contradictions WHERE (claim_a_id=? AND claim_b_id=?) "
                "OR (claim_a_id=? AND claim_b_id=?)",
                (a["id"], b["id"], b["id"], a["id"])).fetchone():
                continue
            candidates.append((iid, cid, a, b))

    def _check(cand):
        _, _, a, b = cand
        same_doc = a["document_id"] == b["document_id"]
        user = (
            f'CLAIM A:\n"""{a["text"]}"""\n'
            f'(quote: "{a["exact_quote"]}")\n'
            f'(outcome: {a["outcome"] or "unspecified"})\n\n'
            f'CLAIM B:\n"""{b["text"]}"""\n'
            f'(quote: "{b["exact_quote"]}")\n'
            f'(outcome: {b["outcome"] or "unspecified"})\n\n'
            f'Same source document: {"yes" if same_doc else "no"}'
        )
        return complete_json(SYSTEM, user, max_tokens=400)

    # Ensure log directory exists
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)

    found = 0
    with open(LOG_PATH, "a") as logf:
        for (iid, cid, a, b), r in map_parallel(_check, candidates, workers=4):
            if not r:
                continue

            same_doc = a["document_id"] == b["document_id"]

            # Log every evaluated pair — accepted or rejected
            logf.write(json.dumps({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "prompt_version": PROMPT_VERSION,
                "claim_a_id": a["id"],
                "claim_b_id": b["id"],
                "claim_a_text": a["text"],
                "claim_b_text": b["text"],
                "claim_a_outcome": a["outcome"],
                "claim_b_outcome": b["outcome"],
                "same_document": same_doc,
                "contradiction": r.get("contradiction", False),
                "score": r.get("score", 0),
                "gate": r.get("gate", ""),
                "rationale": r.get("rationale", ""),
            }) + "\n")
            logf.flush()

            if r.get("contradiction") is True and float(r.get("score", 0)) >= 0.6:
                conn.execute(
                    "INSERT OR IGNORE INTO contradictions (id, claim_a_id, claim_b_id,"
                    " intervention_id, condition_id, nli_label, nli_score, rationale,"
                    " model_name, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
                    (db.new_id(), a["id"], b["id"], iid, cid, "contradiction",
                     float(r.get("score", 0)), r.get("rationale", ""), MODEL,
                     datetime.now(timezone.utc).isoformat()))
                found += 1
                conn.commit()
                print(f"  ! contradiction surfaced (score {r.get('score')}, "
                      f"same_document={same_doc})")
    conn.commit()
    print(f"  surfaced {found} contradictions ({len(candidates)} candidate pairs checked)")
    print(f"  rejection log: {LOG_PATH}")
    return found


if __name__ == "__main__":
    run()
