# Clash Verge Rev

`generic-script.js` 是通用订阅扩展脚本，适合大多数 Clash Verge Rev / Mihomo 场景。

## 推荐方式

1. 打开 Clash Verge Rev 的订阅页。
2. 右键目标订阅卡片，选择“编辑脚本”。
3. 粘贴 `generic-script.js`，保存并刷新订阅。
4. 如果某个服务商的上游策略组命名特殊，复制 `provider-templates/provider-template-script.js` 后修改 `UPSTREAM_FALLBACKS`。

## 设计点

- 每次执行前会清理同名 `RouteKit-*` 组，避免重复刷新时报重复组名。
- 地区组通过节点名正则匹配生成。
- 业务组引用地区组，按可用性、延迟和账号地区风险排序。
- 最后一条规则使用 `MATCH,🌍 RouteKit-Proxy` 兜底。
