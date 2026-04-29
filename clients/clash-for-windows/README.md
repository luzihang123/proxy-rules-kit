# Clash for Windows

`parsers.example.yaml` 是模板，不含真实订阅 URL。

使用方式：

1. 复制 `parsers.example.yaml` 到自己的私有配置。
2. 替换 `<YOUR_SUBSCRIPTION_URL>`。
3. 把 `<US_GROUP>`、`<JP_GROUP>`、`<FALLBACK_GROUP>` 等占位符换成订阅里真实存在的上游策略组名。
4. 在 CFW 的 Settings -> Parsers 中粘贴配置并刷新订阅。

CFW Parsers 对节点自动分组能力弱于 Mihomo 新客户端，因此这里以“占位符 + 手动上游组名”为主。
