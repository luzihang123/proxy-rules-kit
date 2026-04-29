# OpenClash

OpenClash 使用三个文件实现订阅防覆盖：

| 文件 | 路由器路径 | 作用 |
| --- | --- | --- |
| `custom_overwrite.yaml` | `/etc/openclash/custom/openclash_custom_overwrite.yaml` | DNS、fake-ip 例外、策略组 |
| `custom_rules.list` | `/etc/openclash/custom/openclash_custom_rules.list` | 前置规则，优先匹配 RouteKit 分流 |
| `custom_rules_2.list` | `/etc/openclash/custom/openclash_custom_rules_2.list` | 后置兜底规则 |

使用步骤：

1. 把三个文件复制到 OpenClash 对应路径。
2. 在 OpenClash 覆写设置里启用自定义覆写、自定义规则、自定义规则附加。
3. 重启 OpenClash。
4. 在 Mihomo 面板确认能看到 `RouteKit-*` 策略组。

如果你的企业/内网域名需要直连，要同时处理两处：

- 在 `custom_rules.list` 中加入 `RouteKit-DIRECT` 规则。
- 在 `custom_overwrite.yaml` 的 `dns.fake-ip-filter` 中加入这些域名，避免 fake-ip 影响真实解析。
