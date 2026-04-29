#!/usr/bin/env python3
"""Lint Shadowrocket rules for basic issues."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RULES_DIR = ROOT / "clients" / "shadowrocket"
RULE_FILES = [RULES_DIR / "routekit.rules", RULES_DIR / "routekit-lite.rules"]

RULE_PREFIXES = (
    "DOMAIN,",
    "DOMAIN-SUFFIX,",
    "DOMAIN-KEYWORD,",
    "IP-CIDR,",
    "IP-CIDR6,",
    "GEOIP,",
    "FINAL,",
)


def main() -> int:
    ok = True
    for path in RULE_FILES:
        if not path.exists():
            print(f"Missing: {path}")
            ok = False
            continue
        lines = path.read_text(encoding="utf-8").splitlines()
        seen = set()
        has_final = False
        for idx, raw in enumerate(lines, 1):
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            if not line.startswith(RULE_PREFIXES):
                print(f"{path}:{idx}: Unknown rule prefix -> {line}")
                ok = False
                continue
            if line.startswith("FINAL,"):
                has_final = True
            # Normalize for duplicates: ignore policy name
            parts = line.split(",")
            key = ",".join(parts[:2]) if parts[0] in {"DOMAIN", "DOMAIN-SUFFIX", "DOMAIN-KEYWORD", "IP-CIDR"} else line
            if key in seen:
                print(f"{path}:{idx}: Duplicate rule -> {line}")
                ok = False
            else:
                seen.add(key)
        if not has_final:
            print(f"{path}: Missing FINAL rule")
            ok = False
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
