# Shadowrocket

推荐导入完整配置 `routekit.conf`，它包含 `[General]`、`[Proxy Group]` 和 `[Rule]` 三部分。

## 使用方式

1. 先在 Shadowrocket 中导入自己的订阅，节点由订阅提供。
2. 在“配置”里从 URL 或本地文件导入 `routekit.conf`。
3. 按节点命名调整 `policy-regex-filter`，例如 `美国|USA|US|🇺🇸`。
4. 启用该配置并使用规则模式。

如果只想远程引用规则文件，公开仓库可直接使用 GitHub Raw URL：

- `routekit.rules` 完整规则：

```text
https://raw.githubusercontent.com/luzihang123/proxy-rules-kit/main/clients/shadowrocket/routekit.rules
```

- `routekit-lite.rules` 精简规则，由 `scripts/sync_shadowrocket_rules.py` 生成：

```text
https://raw.githubusercontent.com/luzihang123/proxy-rules-kit/main/clients/shadowrocket/routekit-lite.rules
```

不要把真实节点订阅 URL、机场 token、私有 Gist 或本地服务地址提交到公开仓库。

## 策略组说明

| 组名 | 类型 | 默认地区 | 说明 |
|------|------|---------|------|
| `RouteKit-Claude` | url-test | 美国 | Anthropic 非美 IP 会被拒绝 |
| `RouteKit-ChatGPT` | select | 美国优先 | OpenAI 系服务 |
| `RouteKit-Gemini` | select | 美国优先 | Google AI 系服务 |
| `RouteKit-Grok` | select | 日本/新加坡 | xAI 服务 |
| `RouteKit-AI` | select | 美国优先 | 通用 AI 工具 |
| `RouteKit-YouTube` | url-test | 日本/新加坡 | 速度优先 |
| `RouteKit-Spotify` | select | 新加坡固定 | 账号注册地，切区触发风控 |
| `RouteKit-Apple` | select | **香港优先** | Apple / iCloud / App Store，可手动切 DIRECT / 日本 |
| `RouteKit-Dev-US` | select | 美国 | 需要美国出口的开发场景 |
| `RouteKit-Dev` | url-test | 日本/新加坡 | GitHub、Docker、PyPI 等 |
| `RouteKit-Cursor` | url-test | 日本/台湾 | IDE 补全延迟敏感 |
| `RouteKit-Crypto-Web3` | select | 日本/新加坡 | 交易所，select 锁定避免频繁换 IP |
| `RouteKit-Broker` | select | **香港优先** | 港资券商，见下方说明 |
| `RouteKit-Twitter` | url-test | 日本/新加坡 | 近区优先 |
| `RouteKit-Proxy` | url-test | 全部节点 | 兜底 |

### RouteKit-Broker：港资券商

长桥（LongBridge/Longport）、富途（Futu/Moomoo）、老虎证券（Tiger Brokers）均为港资持牌券商，交易撮合与行情服务器主要位于香港，**默认选香港节点延迟最低**；备选顺序：日本 → 台湾 → 新加坡 → 美国。

`policy-regex-filter` 覆盖关键词：`香港|🇭🇰|HK|Hong Kong|日本|🇯🇵|台湾|🇹🇼|新加坡|🇸🇬|美国|🇺🇸`

> `futunn.com`（富途）原归入 `RouteKit-Crypto-Web3`，已迁移至本组。
