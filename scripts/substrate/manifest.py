"""In-run retrieval manifest (PRISMA-S search reporting record).

The fetchers record ONE event per query/dataset at the moment they run: query
string, database, interface, timestamp, limits and filters applied, records
matched, records fetched, and records inserted. rescore.py writes the
accumulated events to a dated file (audit-output/run-manifest-<run_id>.json)
after the fetch stage and again at the end of the run, so the artifact exists
even if a later stage is interrupted.

This is the record that makes retrieval reproducible: given the manifest plus
the config snapshot, a reviewer can see exactly what search was run, against
which database and interface, with which caps, and what it returned.
"""
import json
from datetime import datetime, timezone

_RUN_ID = None
_EVENTS = []


def start(run_id, retrieval_params, model):
    """Begin a new run manifest. Clears any prior in-memory events."""
    global _RUN_ID
    _RUN_ID = run_id
    _EVENTS.clear()
    _EVENTS.append({
        "event": "run_start",
        "run_id": run_id,
        "timestamp": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model": model,
        "retrieval_params": retrieval_params,  # config.RETRIEVAL snapshot at run time
    })


def record(**fields):
    """Append one retrieval event. Callers pass source/query/limits/returns."""
    fields.setdefault("timestamp", datetime.now(timezone.utc).isoformat(timespec="seconds"))
    fields.setdefault("run_id", _RUN_ID)
    _EVENTS.append(fields)
    return fields


def events():
    """Copy of the accumulated events (safe to iterate/serialize)."""
    return list(_EVENTS)


def write(path):
    """Persist the manifest to `path` (a dated file). Returns the path."""
    payload = {
        "artifact": "whel-retrieval-manifest",
        "standard": "PRISMA-S (reporting literature searches)",
        "run_id": _RUN_ID,
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "events": _EVENTS,
    }
    path.write_text(json.dumps(payload, indent=2) + "\n")
    return path
