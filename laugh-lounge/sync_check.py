#!/usr/bin/env python3
"""
Laugh Lounge translation sync checker.

Reads jokes.json (the single source of truth \u2014 each entry carries en/es/zh
side by side, not separate per-language directories) and flags any entry
missing a translation, any language field that's empty/whitespace, and any
duplicate id. Writes a dated report into logs/ so gaps are visible without
anyone having to manually diff files.

This script only DETECTS gaps. It does not auto-translate or auto-fill
anything \u2014 humor needs a human review pass, not machine substitution.
Run manually after adding new jokes, or on whatever cadence Noal wants
(see README note at the bottom of this file for the cadence discussion).
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
JOKES_FILE = BASE_DIR / "jokes.json"
LOGS_DIR = BASE_DIR.parent / "logs"
LANGUAGES = ["en", "es", "zh"]


def load_jokes():
    if not JOKES_FILE.exists():
        print(f"ERROR: {JOKES_FILE} not found.", file=sys.stderr)
        sys.exit(1)
    with open(JOKES_FILE, encoding="utf-8") as f:
        return json.load(f)


def check(jokes):
    missing = []       # (id, lang) pairs with an empty/missing translation
    seen_ids = {}
    duplicate_ids = []

    for entry in jokes:
        jid = entry.get("id")
        if jid in seen_ids:
            duplicate_ids.append(jid)
        seen_ids[jid] = seen_ids.get(jid, 0) + 1

        for lang in LANGUAGES:
            val = entry.get(lang, "")
            if not isinstance(val, str) or not val.strip():
                missing.append((jid, lang))

    return missing, sorted(set(duplicate_ids))


def write_report(jokes, missing, duplicate_ids):
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    report_path = LOGS_DIR / f"laugh_lounge_sync_{today}.md"

    total = len(jokes)
    lines = [
        f"# Laugh Lounge Sync Report \u2014 {today}",
        "",
        f"Total jokes: {total}",
        f"Languages tracked: {', '.join(LANGUAGES)}",
        "",
    ]

    if not missing and not duplicate_ids:
        lines.append("Status: all clear. Every joke has en/es/zh, no duplicate ids.")
    else:
        lines.append("Status: gaps found \u2014 review needed.")
        lines.append("")
        if duplicate_ids:
            lines.append(f"## Duplicate ids ({len(duplicate_ids)})")
            for jid in duplicate_ids:
                lines.append(f"- id {jid} appears more than once")
            lines.append("")
        if missing:
            lines.append(f"## Missing translations ({len(missing)})")
            by_id = {}
            for jid, lang in missing:
                by_id.setdefault(jid, []).append(lang)
            for jid, langs in sorted(by_id.items(), key=lambda kv: (kv[0] is None, kv[0])):
                entry = next((j for j in jokes if j.get("id") == jid), {})
                en_preview = (entry.get("en") or "(no English text either)")[:70]
                lines.append(f"- id {jid} missing [{', '.join(langs)}] \u2014 EN: \"{en_preview}\"")

    lines.append("")
    lines.append(f"Generated {datetime.now(timezone.utc).isoformat()}Z")

    report_path.write_text("\n".join(lines), encoding="utf-8")
    return report_path


def main():
    jokes = load_jokes()
    missing, duplicate_ids = check(jokes)
    report_path = write_report(jokes, missing, duplicate_ids)

    print(f"Checked {len(jokes)} jokes across {', '.join(LANGUAGES)}.")
    if missing or duplicate_ids:
        print(f"Found {len(missing)} missing translation(s), {len(duplicate_ids)} duplicate id(s).")
        print(f"Report: {report_path}")
        sys.exit(1)  # non-zero exit if run from a script/cron that wants to alert on gaps
    print("All clear \u2014 no gaps.")
    print(f"Report: {report_path}")
    sys.exit(0)


if __name__ == "__main__":
    main()

# ---------------------------------------------------------------------------
# Cadence note: this is a content-gap checker, not a live data feed \u2014 jokes
# don't change unless someone edits jokes.json. A daily cron re-checking
# unchanged content every single day burns credits for no new information
# on most days. Better fit: run this on-demand whenever new jokes are added
# (manually, or wired into whatever commit/deploy step touches jokes.json),
# rather than a recurring daily schedule. Flagged to Noal for a decision
# rather than assumed.
# ---------------------------------------------------------------------------
