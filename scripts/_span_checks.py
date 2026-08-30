"""Deterministic tests on a quoted span.

Two questions a quote must answer before it can support a claim: which drug is
this about, and which way did the effect go. Both are checked here rather than
left to the judge's discretion, because hand-labelling in August 2026 found the
judge answering both from context it was told not to use. Every confirmed judge
error in that round was one of these two cases:

    claim : "MHT increases the risk of venous thrombosis in postmenopausal women"
    quote : "increases the risk of stroke and venous thrombosis in postmenopausal women"
            (no MHT anywhere in the span)

    claim : "EPT was harmful for lung cancer mortality"
    quote : "as well as cardiovascular disease incidence and recurrence, ... and
            lung cancer mortality (EPT)"
            (a list of endpoints; the word "harmful" is in an earlier clause)

A prompt instruction asking the model not to do this was already in place and did
not hold. These functions are the enforcement: cheap, deterministic, and the same
answer every run.

Both are deliberately permissive. They are used to veto an "entailed" verdict, so
a false positive here silently downgrades good evidence. Where they are unsure
they return True.
"""

from __future__ import annotations

import re

DIRECTION_WORDS = re.compile(
    r"\b("
    r"improv\w*|reduc\w*|decreas\w*|increas\w*|lower\w*|higher|rais\w*|"
    r"benefi\w*|harmful|harm|effective|efficacious|ineffective|inferior|superior|"
    r"worse|worsen\w*|better|safe|unsafe|prevent\w*|elevat\w*|declin\w*|"
    r"no difference|no differences|not significant|comparable|equivalent|similar|"
    r"associated with|risks?|significant\w*|resolv\w*|relie\w*|tolerat\w*|"
    r"efficacy|response|remission|success|fail\w*|adverse"
    r")\b", re.I)


def names_drug(label: str, quote: str) -> bool:
    """Does `quote` name the intervention `label`?

    Papers rarely repeat a drug's full name. They introduce it once and then use
    an abbreviation: "essential fatty acids" becomes EFAs, "Vitex agnus-castus"
    becomes VAC, "aromatase inhibitors" becomes AIs. A plain substring test
    counts all of those as missing, which is how a first pass at this reported
    27% of quotes headless when the real figure was closer to 13%.

    The stem test must respect word boundaries. Without that, "menopausal hormone
    therapy" counts as present in a quote saying only "postmenopausal women",
    since "menopa" appears inside "postmenopausal". Two confirmed judge errors
    came through that exact gap.
    """
    if not label:
        return True
    for w in re.findall(r"[a-z]{4,}", label.lower()):
        if re.search(rf"\b{re.escape(w[:6])}", quote, re.I):
            return True
    parts = [p for p in re.split(r"[\s\-+]+", label.strip()) if p]
    acronym = "".join(p[0] for p in parts)
    if len(acronym) >= 2 and re.search(rf"\b{re.escape(acronym)}s?\b", quote, re.I):
        return True
    # Short labels that are already acronyms ("EPT", "COC", "MHT", "G-CSF").
    bare = re.sub(r"[^A-Za-z]", "", label)
    return len(label) <= 8 and bool(re.search(rf"\b{re.escape(bare)}s?\b", quote, re.I))


def states_direction(quote: str) -> bool:
    """Does `quote` say which way the effect went?

    A span can name the drug and the outcome and still be useless as evidence.
    A bare list of endpoints carries no finding; the word that made them harmful
    or helpful sits in a clause the span never reaches.
    """
    return bool(DIRECTION_WORDS.search(quote))
