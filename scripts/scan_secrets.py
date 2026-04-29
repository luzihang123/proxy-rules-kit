#!/usr/bin/env python3
"""Fail if common private proxy configuration secrets are committed."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", "__pycache__", ".venv", "venv"}
PATTERNS = {
    "subscription token": re.compile(r"([?&]token=|/rss3/|/link/[A-Za-z0-9]|subscribe\?)", re.I),
    "private service address": re.compile(r"(10\.168\.|192\.168\.1\.201|106\.55\.228\.246)"),
    "private brand/domain placeholder leak": re.compile(r"(c1c962|ninjasub|msub|quantum-air|xcyun|yfjc)", re.I),
}
ALLOW = {
    "scripts/scan_secrets.py",
    "subscriptions/subscriptions.example.yaml",
    "clients/clash-for-windows/parsers.example.yaml",
}


def iter_files():
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_DIRS for part in path.relative_to(ROOT).parts):
            continue
        yield path


def main() -> int:
    ok = True
    for path in iter_files():
        rel = path.relative_to(ROOT).as_posix()
        if rel in ALLOW:
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        for name, pattern in PATTERNS.items():
            for idx, line in enumerate(text.splitlines(), 1):
                if pattern.search(line):
                    print(f"{rel}:{idx}: possible {name}: {line.strip()}")
                    ok = False
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
