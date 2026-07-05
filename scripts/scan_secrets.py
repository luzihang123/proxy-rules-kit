#!/usr/bin/env python3
"""Fail if common private proxy configuration secrets are committed."""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATTERNS = {
    "private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"),
    "AWS access key": re.compile(r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b"),
    "GitHub token": re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b"),
    "OpenAI-style token": re.compile(r"\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b"),
    "Google API key": re.compile(r"\bAIza[0-9A-Za-z_-]{30,}\b"),
    "JWT": re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b"),
    "proxy subscription URI": re.compile(
        r"\b(?:ss|ssr|trojan|vless|vmess|hysteria2?|tuic)://(?!example)",
        re.I,
    ),
    "subscription credential": re.compile(
        r"([?&](?:token|key|auth|secret)=|/(?:rss3|link|subscribe)/[^<\s]{8,})",
        re.I,
    ),
    "credential assignment": re.compile(
        r"\b(?:password|passwd|secret|api[_-]?key|access[_-]?token)"
        r"\s*[:=]\s*[\"']?[A-Za-z0-9_./+=-]{8,}",
        re.I,
    ),
    "personal email": re.compile(
        r"\b[A-Z0-9._%+-]+@(?!example\.(?:com|net|org)\b)[A-Z0-9.-]+\.[A-Z]{2,}\b",
        re.I,
    ),
    "private service address": re.compile(r"(10\.168\.|192\.168\.1\.201|106\.55\.228\.246)"),
    "private brand/domain placeholder leak": re.compile(r"(c1c962|ninjasub|msub|quantum-air|xcyun|yfjc)", re.I),
}
SAFE_MARKERS = (
    "<token>",
    "<your_",
    "example.com",
    "example.net",
    "example.org",
    "password: example",
    "ghp_xxx",
)


def iter_files():
    result = subprocess.run(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    for raw in result.stdout.split(b"\0"):
        if not raw:
            continue
        path = ROOT / raw.decode("utf-8")
        if path.is_file():
            yield path


def main() -> int:
    ok = True
    for path in iter_files():
        rel = path.relative_to(ROOT).as_posix()
        if rel == "scripts/scan_secrets.py":
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for name, pattern in PATTERNS.items():
            for idx, line in enumerate(text.splitlines(), 1):
                lowered = line.lower()
                if any(marker in lowered for marker in SAFE_MARKERS):
                    continue
                if pattern.search(line):
                    print(f"{rel}:{idx}: possible {name}")
                    ok = False
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
