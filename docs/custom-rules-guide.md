# 自定义规则指南

规则优先级建议：

1. 企业/内网直连规则，走 `RouteKit-DIRECT`。
2. 账号或地区敏感服务，如 AI、Spotify、Web3。
3. 速度敏感服务，如 YouTube、开发工具下载。
4. 通用代理规则。
5. `MATCH` / `FINAL` 兜底。

新增规则时同步检查：

- Clash / Mihomo 规则是否写入对应 YAML 或脚本。
- Shadowrocket 规则是否写入 `routekit.rules`。
- 需要精简版时运行 `make sync-lite`。
- 策略组名必须完全一致，包括 emoji 和空格。
