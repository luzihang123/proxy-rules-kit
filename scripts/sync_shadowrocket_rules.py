#!/usr/bin/env python3
"""Sync Shadowrocket lite rules from full rules.

This keeps AI + basic proxy rules and removes heavier sections.
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FULL = ROOT / "clients" / "shadowrocket" / "routekit.rules"
LITE = ROOT / "clients" / "shadowrocket" / "routekit-lite.rules"

DROP_HEADERS = {
    "Knowledge / Tools / Others",
    "IP",
}


def _is_header(line: str) -> bool:
    return line.startswith("# ")


def _should_drop(header_text: str) -> bool:
    return header_text in DROP_HEADERS


def build_lite(full_lines: list[str]) -> list[str]:
    # Start from the first rule section header to avoid duplicating full header.
    body_start = None
    for i, line in enumerate(full_lines):
        if line.startswith("# =========") and line.strip("# =\n"):
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
        "# 精简版：核心分流规则，去掉 Others 杂项域名\n",
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
