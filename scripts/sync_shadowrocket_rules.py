#!/usr/bin/env python3
"""Sync Shadowrocket lite rules from full rules.

This keeps AI + basic proxy rules and removes heavier sections.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FULL = ROOT / "clients" / "shadowrocket" / "routekit.rules"
LITE = ROOT / "clients" / "shadowrocket" / "routekit-lite.rules"

DROP_KEYWORDS = {
    "CDN / Cloud",
    "Crypto / Web3",
    "Knowledge / Tools / Others",
    "IP",
}


def _is_header(line: str) -> bool:
    return line.startswith("# ")


def _should_drop(header_text: str) -> bool:
    return any(key in header_text for key in DROP_KEYWORDS)


def build_lite(full_lines: list[str]) -> list[str]:
    # Start from the first rule section header to avoid duplicating full header.
    body_start = None
    for i, line in enumerate(full_lines):
        if line.startswith("# ========="):
            body_start = i
            break
    if body_start is None:
        body_start = 0

    lines = full_lines[body_start:]
    out: list[str] = []
    skip = False

    for line in lines:
        if _is_header(line):
            header_text = line[2:].strip()
            if _should_drop(header_text):
                skip = True
                continue
            if skip:
                skip = False
            out.append(line)
            continue
        if skip:
            continue
        out.append(line)

    header = [
        "# =====================================================\n",
        "# RouteKit · Shadowrocket Rule Set (Lite)\n",
        "# 精简版：保留 AI + 基础代理规则（由脚本生成）\n",
        "# =====================================================\n",
        "\n",
    ]
    return header + out


def main() -> int:
    full_lines = FULL.read_text(encoding="utf-8").splitlines(keepends=True)
    lite_lines = build_lite(full_lines)

    current = LITE.read_text(encoding="utf-8").splitlines(keepends=True) if LITE.exists() else []
    if lite_lines != current:
        LITE.write_text("".join(lite_lines), encoding="utf-8")
        print("Updated", LITE)
    else:
        print("No changes", LITE)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
