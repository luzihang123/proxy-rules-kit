# Clash Verge Rev

`generic-script.js` 是通用订阅扩展脚本，适合大多数 Clash Verge Rev / Mihomo 场景。

## 推荐方式

1. 打开 Clash Verge Rev 的订阅页。
2. 右键目标订阅卡片，选择“扩展脚本”。
3. 粘贴 `generic-script.js`，保存并刷新订阅。
4. 如果某个服务商的上游策略组命名特殊，复制 `provider-templates/provider-template-script.js` 后修改 `UPSTREAM_FALLBACKS`。

## 设计点

- 每次执行前会清理同名 `RouteKit-*` 组，避免重复刷新时报重复组名。
- 地区组通过节点名正则匹配生成。
- 业务组引用地区组，按可用性、延迟和账号地区风险排序。
- 最后一条规则使用 `MATCH,🌍 RouteKit-Proxy` 兜底。

## 业务组说明

| 组名 | 默认地区 | 说明 |
|------|---------|------|
| `🤖 RouteKit-Claude` | 美国优先 | Anthropic 非美 IP 会被拒绝，锁美国更稳定 |
| `🤖 RouteKit-ChatGPT` | 美国优先 | OpenAI 在部分地区受限 |
| `🤖 RouteKit-Gemini` | 美国优先 | Google AI Studio / NotebookLM 等 |
| `🤖 RouteKit-Grok` | 日本/新加坡 | xAI 服务，近区低延迟优先 |
| `🤖 RouteKit-AI` | 美国优先 | 其他通用 AI 工具（Perplexity、Dify 等） |
| `📺 RouteKit-YouTube` | 日本/新加坡 | 速度优先，近区 CDN 更快 |
| `🎵 RouteKit-Spotify` | 新加坡固定 | 账号注册地为新加坡，切区会触发风控 |
| `🍎 RouteKit-Apple` | **香港优先** | Apple / iCloud / App Store，可手动切 RouteKit-DIRECT / 日本 |
| `🛠 RouteKit-Dev-US` | 美国专用 | 需要美国出口的特定开发场景 |
| `🔧 RouteKit-Dev` | 日本/新加坡 | GitHub、Docker、PyPI 等开发工具 |
| `🖥 RouteKit-Cursor` | 日本/台湾 | IDE 补全对延迟敏感，近区优先 |
| `🪙 RouteKit-Crypto-Web3` | 日本/新加坡 | 交易所对频繁换 IP 敏感，select 锁定节点 |
| `📈 RouteKit-Broker` | **香港优先** | 港资券商（长桥、富途/Moomoo、老虎证券），服务器主要在香港，香港节点延迟最低；备选日本→台湾→新加坡→美国 |
| `🐦 RouteKit-Twitter` | 日本/新加坡 | 近区速度优先 |
| `🌍 RouteKit-Proxy` | 全部节点 | 兜底组，未匹配的海外流量走这里 |

### RouteKit-Broker 覆盖域名

| 券商 | 域名 |
|------|------|
| 长桥 LongBridge | `longportapp.com`, `longbridgeapp.com`, `longbridge.com`, `longbridge.global`, `lbkrs.com`, `lbcdn.com` |
| 富途 Futu / Moomoo | `futunn.com`, `futubull.com`, `moomoo.com`, `futu5.com` |
| 老虎 Tiger Brokers | `itiger.com`, `tigerbrokers.com`, `tigertrade.com`, `tigerfintech.com` |

> `futunn.com` 原先归入 `RouteKit-Crypto-Web3`，已迁移至 `RouteKit-Broker`（富途主营港美股，非加密货币）。
