# Proxy Rules Kit

跨客户端代理规则模板。目标是把“节点订阅”和“自定义规则/策略组”分离，避免订阅更新覆盖自己的分流逻辑。

## 场景与思路来源

在 AI 时代，想稳定使用各类模型和全球服务，代理规则本身就是一层基础设施，值得持续维护和迭代。这个项目不是为了“全量走代理”，而是基于真实使用场景做稳定分流，目标是让**合规、体验和可维护性**同时成立：

- 数字货币 / Web3 场景下，美国相关服务往往带有更强的监管与风控约束，因此优先把日本、新加坡等地区作为主要可选出口。
- Claude 这类对出口地区敏感的服务，默认严格走美国节点，减少地区漂移带来的可用性波动和风控问题。
- YouTube 更看重持续吞吐和时延稳定性，因此优先选择体验更好的视频线路。
- Spotify 这类与账号注册地强相关的服务，例如账号注册在新加坡，就应固定使用新加坡节点，避免跨区异常。
- Twitter / X 对时延比较敏感，通常选择东亚近区，例如新加坡、日本，体验会更顺。
- 企业办公和内网资源预留直连规则，默认走 `DIRECT`，避免代理干扰公司系统、本地网络和内网链路。

因此，本仓库的规则设计重点是“按业务场景分组、按地区策略落地”，把不同服务的推荐路径沉淀成可复用模板，让这套规则文件可以长期维护。

## 支持的客户端

| 客户端 | 目录 | 防覆盖方式 |
| --- | --- | --- |
| Clash Verge Rev | `clients/clash-verge-rev/` | 订阅扩展脚本 / 覆写配置 |
| Clash Party / Mihomo Party | `clients/clashparty/` | 覆写配置 / 覆写脚本 |
| OpenClash | `clients/openclash/` | 自定义覆写 + 前置/后置规则 |
| Shadowrocket | `clients/shadowrocket/` | 配置文件与远程规则分离 |
| Clash for Windows | `clients/clash-for-windows/` | Parsers 示例 |

## 分组总览与设计思路

| 分组 | 主要场景 | 选路思路 |
| --- | --- | --- |
| `RouteKit-Claude` | Claude / Anthropic | 美国优先，保持稳定的出口特征，降低可用性波动和风控概率 |
| `RouteKit-ChatGPT` | ChatGPT / OpenAI | 美国优先，可回退日本 / 新加坡，兼顾可用性与稳定性 |
| `RouteKit-Gemini` | Gemini / Google AI | 美国优先，可回退日本 / 新加坡，保障模型与 API 访问一致性 |
| `RouteKit-Grok` | Grok / xAI | 日本 / 新加坡优先，走东亚低时延线路 |
| `RouteKit-AI` | 通用 AI 工具（Perplexity / Dify 等） | 美国 / 日本 / 新加坡混合池，按服务可达性和稳定性选择 |
| `RouteKit-YouTube` | YouTube 视频 / 音频 | 香港 / 日本优先，以吞吐和时延体验为导向 |
| `RouteKit-Spotify` | Spotify 音乐服务 | 按账号注册地固定地区，例如新加坡，减少跨区异常 |
| `RouteKit-Dev-US` | Google 与部分开发基础服务 | 美国固定出口，避免地区差异导致服务不一致 |
| `RouteKit-Cursor` | Cursor IDE 相关域名 | 日本 / 台湾 / 新加坡优先，兼顾低时延与连通性 |
| `RouteKit-Dev` | GitHub / Docker / PyPI 等开发工具链 | 日本 / 新加坡优先，强调开发下载与 API 稳定性 |
| `RouteKit-Crypto-Web3` | 数字货币 / Web3 平台 | 日本 / 新加坡优先，适配合规和风控差异场景 |
| `RouteKit-Twitter` | Twitter / X | 东亚近区优先，例如日本 / 新加坡，降低交互时延 |
| `RouteKit-Proxy` | 通用兜底代理流量 | 自动测速选优，承接未命中专属规则的境外流量 |
| `DIRECT` | 企业办公 / 内网 / 局域网 | 直连规则，确保内网资源和办公链路稳定 |

## 快速开始

1. 复制 `subscriptions/subscriptions.example.yaml` 为自己的私有 `subscriptions/subscriptions.yaml`，填入真实订阅。该文件已被 `.gitignore` 忽略。
2. 按客户端导入对应目录下的模板。
3. 按自己的节点命名调整地区正则，例如 `HK|Hong Kong|香港`。
4. 运行 `make check` 检查 Shadowrocket 规则和敏感字段。

## 重要安全约定

不要提交真实订阅 URL、token、内网 IP、公司域名、家庭成员名称、机场后台地址。公开仓库只保留模板和示例值。

## 目录

```text
clients/        # 客户端配置模板
rules/          # 跨客户端共享规则原始列表
examples/       # 示例输入与占位配置
subscriptions/  # 订阅模板，真实文件本地忽略
scripts/        # lint、同步、敏感字段扫描
docs/           # 使用说明与维护方法
```
