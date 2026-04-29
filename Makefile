.PHONY: sync-lite lint check scan-secrets

sync-lite:
	python3 scripts/sync_shadowrocket_rules.py

lint:
	python3 scripts/lint_rules.py

check: sync-lite lint scan-secrets

scan-secrets:
	python3 scripts/scan_secrets.py
