"""Shared CONTEXT block for entailment scoring.

The automated judge (rescore-claim-entailment.py) and the human rater
(label-claims.py) must see exactly the same evidence, or the agreement number
between them measures the difference in what they were shown rather than the
difference in how they judged it. Both import this function so the two can't
drift apart.

Deliberately narrow: source, title, and the condition the claim is filed under.
That is enough to settle WHO a premise is talking about when the quoted sentence
doesn't repeat it. Anything more (the abstract, sibling quotes from the same
paper) would let a finding be assembled from outside the premise, which is the
failure this whole exercise exists to catch.
"""

from __future__ import annotations

import re


def build_context(claim: dict, conditions: dict) -> str:
    doc = claim.get("documents") or {}
    if isinstance(doc, list):
        doc = doc[0] if doc else {}
    title = " ".join(str(doc.get("title") or "").split()) or "(title unavailable)"
    cond = conditions.get(claim.get("condition_id")) or "(not recorded)"
    src = f"{doc.get('source', '?')} {doc.get('external_id', '')}".strip()
    lines = [f"Source: {src}", f"Title: {title}"]

    # For a journal article the condition is nearly always stated in the title:
    # an audit of 297 claims found it there for 91% and in the abstract for
    # another 5%. The remaining 4% were all Reddit, where a post never restates
    # the condition because the subreddit it was posted in already establishes
    # it. That provenance was sitting unused in the stored URL, so a rater or a
    # judge had no way to check the filing and had to take it on trust. Now they
    # can, and the one place the mapping is wrong becomes visible instead of
    # invisible.
    sub = re.search(r"/r/([A-Za-z0-9_]+)", str(doc.get("url") or ""))
    if sub:
        lines.append(f"Posted in: r/{sub.group(1)}")

    lines.append(f"Condition on record for this claim: {cond}")
    return "\n".join(lines)
