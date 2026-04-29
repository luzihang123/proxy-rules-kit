# Shadowrocket

推荐导入完整配置 `routekit.conf`，它包含 `[General]`、`[Proxy Group]` 和 `[Rule]` 三部分。

## 使用方式

1. 先在 Shadowrocket 中导入自己的订阅，节点由订阅提供。
2. 在“配置”里从 URL 或本地文件导入 `routekit.conf`。
3. 按节点命名调整 `policy-regex-filter`，例如 `美国|USA|US|🇺🇸`。
4. 启用该配置并使用规则模式。

如果只想远程引用规则文件，可以发布：

- `routekit.rules`：完整规则。
- `routekit-lite.rules`：精简规则，由 `scripts/sync_shadowrocket_rules.py` 生成。

真实 Gist ID 或 Raw URL 不应提交到公开仓库，可以写在自己的私有笔记或本地 `.env` 中。
