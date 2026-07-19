#!/usr/bin/env python3
"""
Rosie Way / LIME Admin Console — public read-only snapshot generator.

Run this (via `gh`/`git` CLI auth, api_credentials=["github"]) to produce
admin-console/status.json, a public, read-only snapshot of:
  - recent commits for each tracked repo
  - whether today's Harbor Now report has posted
  - live health of the three public-facing sites

This script is the ONLY thing that ever touches the private repos'
credentials. The published Rosie Interactive dashboard just fetches the
resulting static JSON — no secret ever reaches the browser.

Usage: python3 generate_snapshot.py
Writes: status.json (same directory)
"""
import json
import os
import subprocess
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

# Always write next to this script, regardless of the caller's cwd -- a
# previous bug wrote a stray status.json at the repo root when this was
# invoked as `python3 admin-console/generate_snapshot.py` from the repo root.
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_PATH = os.path.join(SCRIPT_DIR, "status.json")

REPOS = ["nrini49/lime-web", "nrini49/limesignalworks", "nrini49/schwab", "nrini49/interactive"]
LIVE_URLS = {
    "Marketing site (limesignalworks.com)": "https://limesignalworks.com/",
    "Rosie Interactive (limesignalworks.pplx.app)": "https://limesignalworks.pplx.app/",
    "SPY Pipeline (spy-pipeline-rosie.pplx.app)": "https://spy-pipeline-rosie.pplx.app/api/health",
}


def gh(args):
    """Run a `gh` CLI command and return parsed JSON, or None on failure."""
    try:
        out = subprocess.run(["gh"] + args, capture_output=True, text=True, timeout=30)
        if out.returncode != 0:
            return None
        return json.loads(out.stdout) if out.stdout.strip() else None
    except Exception:
        return None


def recent_commits(repo, count=5):
    data = gh(["api", f"repos/{repo}/commits?per_page={count}"])
    if not data:
        return {"repo": repo, "ok": False, "commits": []}
    commits = []
    for c in data:
        commits.append({
            "sha": c.get("sha", "")[:7],
            "message": (c.get("commit", {}).get("message", "") or "").split("\n")[0][:140],
            "author": c.get("commit", {}).get("author", {}).get("name", "unknown"),
            "date": c.get("commit", {}).get("author", {}).get("date", ""),
        })
    return {"repo": repo, "ok": True, "commits": commits}


def harbor_now_status():
    today = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d")
    data = gh(["api", "repos/nrini49/lime-web/contents/harbor-now/archive"])
    if not data:
        return {"ok": False, "posted_today": False, "latest": None, "checked_date": today}
    names = sorted(f["name"] for f in data if f["name"].endswith(".html"))
    latest = names[-1].replace(".html", "") if names else None
    return {
        "ok": True,
        "posted_today": f"{today}.html" in names,
        "latest": latest,
        "checked_date": today,
    }


def site_health():
    results = []
    for label, url in LIVE_URLS.items():
        try:
            req = urllib.request.Request(url, method="GET", headers={"User-Agent": "lime-admin-console/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                results.append({"label": label, "url": url, "status": resp.status, "ok": resp.status < 400})
        except urllib.error.HTTPError as e:
            results.append({"label": label, "url": url, "status": e.code, "ok": e.code < 400})
        except Exception as e:
            results.append({"label": label, "url": url, "status": None, "ok": False, "error": str(e)})
    return results


def main():
    snapshot = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "harbor_now": harbor_now_status(),
        "site_health": site_health(),
        "repos": [recent_commits(r) for r in REPOS],
    }
    with open(OUTPUT_PATH, "w") as f:
        json.dump(snapshot, f, indent=2)
    print(f"Wrote status.json — {len(snapshot['repos'])} repos, "
          f"Harbor Now posted today: {snapshot['harbor_now']['posted_today']}")


if __name__ == "__main__":
    sys.exit(main())
