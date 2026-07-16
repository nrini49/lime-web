#!/usr/bin/env python3
"""
Site-wide translation sync checker for limesignalworks.com.

Broader than laugh-lounge/sync_check.py (which only covers the Laugh
Lounge's jokes.json). This checks two real content units:

1. laugh-lounge/jokes.json \u2014 same missing-translation / duplicate-id
   check as the dedicated script, now across en/es/zh/fr.
2. index.html's I18N object \u2014 parses the en:{...}, es:{...}, zh:{...}
   blocks and flags any key present in one language block but missing
   from another. This is the check that would have caught the real
   "stale content in one language" problem flagged earlier in this
   project's history, where updates landed in English but not the
   other two blocks.

French is NOT expected in index.html's I18N object \u2014 it doesn't exist
there yet, only in jokes.json. This script tracks that distinction
rather than assuming every surface has every language.

Detection only. Never auto-translates or auto-fills \u2014 humor and site
copy both need a human review pass, not machine substitution.
"""
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
JOKES_FILE = BASE_DIR / "laugh-lounge" / "jokes.json"
INDEX_FILE = BASE_DIR / "index.html"
LOGS_DIR = BASE_DIR / "logs"
JOKE_LANGUAGES = ["en", "es", "zh", "fr"]
INDEX_LANGUAGES = ["en", "es", "zh"]  # fr not present in index.html today


def check_jokes():
    """Returns (missing_list, duplicate_ids, total_count)."""
    if not JOKES_FILE.exists():
        return ([("__file__", "jokes.json not found")], [], 0)
    with open(JOKES_FILE, encoding="utf-8") as f:
        jokes = json.load(f)
    missing, seen = [], {}
    for entry in jokes:
        jid = entry.get("id")
        seen[jid] = seen.get(jid, 0) + 1
        for lang in JOKE_LANGUAGES:
            val = entry.get(lang, "")
            if not isinstance(val, str) or not val.strip():
                missing.append((jid, lang))
    duplicates = sorted(k for k, v in seen.items() if v > 1)
    return (missing, duplicates, len(jokes))


def extract_i18n_block(text, lang):
    """Pulls the `lang: { ... }` object body out of the I18N const, then
    walks it character-by-character to find real top-level keys \u2014 a
    proper string-aware scan, not a plain regex. This matters because a
    naive `word:` regex false-positives on translated sentence text like
    'Posture: observe' *inside* a quoted value (hn_weather's own string
    contains a literal colon after a word that looks like a key). Only
    identifier:value pairs found OUTSIDE any string literal, at brace
    depth 0 relative to the block, count as real keys.
    """
    m = re.search(rf'\b{lang}\s*:\s*{{', text)
    if not m:
        return None
    start = m.end()
    depth = 1
    i = start
    while i < len(text) and depth > 0:
        if text[i] == '{':
            depth += 1
        elif text[i] == '}':
            depth -= 1
        i += 1
    block = text[start:i - 1]

    keys = set()
    n = len(block)
    pos = 0
    in_string = None  # None, or the quote char currently open
    brace_depth = 0
    expecting_key = True  # true right after `{`, `,`, or at block start
    ident_re = re.compile(r'[A-Za-z_][A-Za-z0-9_]*')

    while pos < n:
        ch = block[pos]
        if in_string:
            if ch == '\\':
                pos += 2
                continue
            if ch == in_string:
                in_string = None
            pos += 1
            continue
        if ch in '"\'':
            in_string = ch
            pos += 1
            continue
        if ch == '{':
            brace_depth += 1
            expecting_key = True
            pos += 1
            continue
        if ch == '}':
            brace_depth -= 1
            pos += 1
            continue
        if ch == ',' and brace_depth == 0:
            expecting_key = True
            pos += 1
            continue
        if ch.isspace():
            pos += 1
            continue
        if expecting_key and brace_depth == 0:
            m2 = ident_re.match(block, pos)
            if m2:
                ident = m2.group(0)
                j = m2.end()
                while j < n and block[j].isspace():
                    j += 1
                if j < n and block[j] == ':':
                    keys.add(ident)
                    pos = j + 1
                    expecting_key = False
                    continue
            pos += 1
            continue
        expecting_key = False
        pos += 1

    return keys


def check_index_i18n():
    """Returns (key_sets, drift) where key_sets is {lang: set(keys)} and
    drift is a list of (key, [langs missing it])."""
    if not INDEX_FILE.exists():
        return ({}, [("__file__", ["index.html not found"])])
    text = INDEX_FILE.read_text(encoding="utf-8")
    key_sets = {}
    for lang in INDEX_LANGUAGES:
        keys = extract_i18n_block(text, lang)
        key_sets[lang] = keys if keys is not None else set()
    all_keys = set()
    for keys in key_sets.values():
        all_keys |= keys
    drift = []
    for key in sorted(all_keys):
        missing_from = [lang for lang in INDEX_LANGUAGES if key not in key_sets.get(lang, set())]
        if missing_from:
            drift.append((key, missing_from))
    return (key_sets, drift)


def write_log(joke_missing, joke_dupes, joke_total, index_drift, index_key_sets):
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    log_path = BASE_DIR / "translation_sync.log"
    now = datetime.now(timezone.utc)
    lines = [f"=== Site translation sync \u2014 {now.strftime('%Y-%m-%d %H:%M UTC')} ==="]

    lines.append(f"\n-- laugh-lounge/jokes.json ({joke_total} jokes, tracking {'/'.join(JOKE_LANGUAGES)}) --")
    if not joke_missing and not joke_dupes:
        lines.append("Clean. No missing translations, no duplicate ids.")
    else:
        for jid in joke_dupes:
            lines.append(f"DUPLICATE id: {jid}")
        by_id = {}
        for jid, lang in joke_missing:
            by_id.setdefault(jid, []).append(lang)
        for jid, langs in sorted(by_id.items(), key=lambda kv: (kv[0] is None, kv[0])):
            lines.append(f"MISSING: joke id {jid} missing [{', '.join(langs)}]")

    lines.append(f"\n-- index.html I18N ({'/'.join(INDEX_LANGUAGES)}, French not tracked here) --")
    if not index_drift:
        total_keys = len(index_key_sets.get('en', set()))
        lines.append(f"Clean. {total_keys} keys present in all {len(INDEX_LANGUAGES)} languages.")
    else:
        for key, missing_from in index_drift:
            lines.append(f"KEY DRIFT: '{key}' missing from [{', '.join(missing_from)}]")

    material = bool(joke_missing) or bool(joke_dupes) or bool(index_drift)
    lines.append(f"\nMaterial changes to review: {'YES' if material else 'no'}")

    with open(log_path, "a", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n\n")

    return log_path, material


def main():
    joke_missing, joke_dupes, joke_total = check_jokes()
    index_key_sets, index_drift = check_index_i18n()
    log_path, material = write_log(joke_missing, joke_dupes, joke_total, index_drift, index_key_sets)

    print(f"Log written to {log_path}")
    print(f"Material changes to review: {'YES' if material else 'no'}")
    if material:
        print(f"Jokes: {len(joke_missing)} missing translation(s), {len(joke_dupes)} duplicate id(s)")
        print(f"Index.html: {len(index_drift)} key(s) with drift across languages")
    sys.exit(1 if material else 0)


if __name__ == "__main__":
    main()
