# Proxy Rules Kit

给经常切换设备、客户端和订阅的人准备的一套代理分流模板：通过合理分流，让 AI（如 Claude）、YouTube、Spotify、Web3、开发工具和企业内网获得更低延迟、更少耗时和更稳定的访问体验。

## 解决什么问题

很多代理订阅只负责提供节点，但一旦刷新订阅，自己手动配置的规则、策略组和地区偏好就容易被覆盖。结果是：Claude 又没锁美国，Spotify 又跑错注册地区，YouTube 体验不稳定，企业内网也可能被代理干扰。

这个项目把“节点订阅”和“自定义规则 / 策略组”分离：订阅只负责更新节点，本仓库负责维护分流逻辑。换订阅、换客户端、刷新配置时，核心规则仍然可以复用。

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

### Clash Verge Rev：给订阅加扩展脚本

适合桌面端使用。节点仍然来自你自己的订阅，RouteKit 只负责在订阅更新后自动注入规则和策略组。

1. 打开 Clash Verge Rev，进入“订阅”页面。
2. 找到你的订阅卡片，右键选择“扩展脚本”。
3. 打开并复制这份脚本内容：

```text
https://raw.githubusercontent.com/luzihang123/proxy-rules-kit/main/clients/clash-verge-rev/generic-script.js
```

4. 粘贴到“扩展脚本”窗口，保存。
5. 刷新该订阅，策略组里应能看到 `RouteKit-*` 分组。

如果你的订阅节点命名比较特殊，调整脚本里的 `REGION_FILTERS` 即可，例如把 `HK`、`Hong Kong`、`香港` 都匹配到香港节点组。

### Shadowrocket：导入完整配置文件

适合 iOS 使用。先导入自己的节点订阅，再导入 RouteKit 配置文件，配置会自动创建分组和规则。

1. 在 Shadowrocket 首页添加自己的订阅，确认节点能正常更新。
2. 进入“配置”页面，点击右上角 `+`。
3. 选择“从 URL 导入”，填入：

```text
https://raw.githubusercontent.com/luzihang123/proxy-rules-kit/main/clients/shadowrocket/routekit.conf
```

4. 导入后点击该配置并选择“使用”。
5. 回到首页开启代理，模式选择规则模式。

如果某些分组没有匹配到节点，编辑 `routekit.conf` 里的 `policy-regex-filter`，按你的节点名称补充地区关键词。

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
