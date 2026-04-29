#!/usr/bin/env bash
# =====================================================================
# push_gist.sh
# 把 Shadowrocket 规则文件发布到 GitHub Gist（公开，可直接被 URL 引用）
#
# 用法：
#   export GITHUB_TOKEN=ghp_xxx   # 需要 gist scope（不需要 repo scope）
#   bash scripts/push_gist.sh
#
# 首次运行：创建新 Gist，把 Gist ID 写入 scripts/.gist-id
# 再次运行：更新已有 Gist（内容覆盖，URL 不变）
#
# 获取 Token：
#   GitHub → Settings → Developer settings → Personal access tokens
#   → Tokens (classic) → Generate new token → 勾选 gist → 复制
#
# 或者安装 GitHub CLI 后通过 gh auth login 授权，再用：
#   brew install gh && gh auth login
#   bash scripts/push_gist.sh   （脚本会自动从 gh 读 token）
# =====================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GIST_ID_FILE="$SCRIPT_DIR/.gist-id"
ENV_FILE="$REPO_ROOT/.env"

RULES=(
  "$REPO_ROOT/clients/shadowrocket/routekit.conf"
  "$REPO_ROOT/clients/shadowrocket/routekit.rules"
  "$REPO_ROOT/clients/shadowrocket/routekit-lite.rules"
)

GIST_DESC="RouteKit · Shadowrocket Config & Rule Set (routekit.conf / routekit.rules / routekit-lite.rules)"

# ── 依赖检查 ──────────────────────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
  echo "❌ 需要 python3（macOS 默认已有）"
  exit 1
fi

# ── 自动加载仓库根目录的 .env（已加入 .gitignore，不会被提交）──────────
if [ -f "$ENV_FILE" ] && [ -z "${GITHUB_TOKEN:-}" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
  [ -n "${GITHUB_TOKEN:-}" ] && echo "🔑 已从 .env 加载 GITHUB_TOKEN"
fi

# ── Token 获取（优先环境变量/.env，其次尝试 gh CLI）───────────────────
if [ -z "${GITHUB_TOKEN:-}" ]; then
  if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
    GITHUB_TOKEN=$(gh auth token)
    echo "🔑 使用 gh CLI token"
  else
    echo "❌ 未找到 GITHUB_TOKEN"
    echo ""
    echo "方式 A（推荐，一次配置长期使用）："
    echo "  cp .env.example .env"
    echo "  在 .env 里填上 GITHUB_TOKEN=ghp_xxx"
    echo "  bash scripts/push_gist.sh"
    echo ""
    echo "方式 B（临时用）："
    echo "  export GITHUB_TOKEN=ghp_你的token"
    echo "  bash scripts/push_gist.sh"
    echo ""
    echo "方式 C（gh CLI 永久免密）："
    echo "  brew install gh && gh auth login"
    echo "  bash scripts/push_gist.sh"
    exit 1
  fi
fi

# ── 把规则文件编码成 Gist API 的 JSON payload（用 python3）────────────
build_payload() {
  python3 - "${RULES[@]}" <<'PYEOF'
import json, sys

files = {}
for path in sys.argv[1:]:
    name = path.split("/")[-1]
    with open(path, "r", encoding="utf-8") as f:
        files[name] = {"content": f.read()}

print(json.dumps({"files": files}))
PYEOF
}

# ── 获取 GitHub 用户名（用于拼接 Raw URL）────────────────────────────
get_login() {
  curl -fsSL \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/user" \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['login'])"
}

# ── 创建新 Gist ───────────────────────────────────────────────────────
create_gist() {
  local payload
  payload=$(build_payload)

  # 追加 description 和 public 字段
  payload=$(python3 -c "
import json, sys
d = json.loads(sys.argv[1])
d['description'] = sys.argv[2]
d['public'] = True
print(json.dumps(d))
" "$payload" "$GIST_DESC")

  curl -fsSL \
    -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "https://api.github.com/gists" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['id'])"
}

# ── 更新已有 Gist ─────────────────────────────────────────────────────
update_gist() {
  local gist_id="$1"
  local payload
  payload=$(build_payload)

  curl -fsSL \
    -X PATCH \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "https://api.github.com/gists/$gist_id" \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['id'])"
}

# ── 主流程 ────────────────────────────────────────────────────────────
echo ""
echo "📋 Shadowrocket Gist 推送工具"
echo "────────────────────────────────"

if [ -f "$GIST_ID_FILE" ]; then
  GIST_ID=$(cat "$GIST_ID_FILE")
  echo "📤 更新 Gist $GIST_ID ..."
  update_gist "$GIST_ID" > /dev/null
  echo "✅ 更新成功"
else
  echo "🆕 首次创建 Gist ..."
  GIST_ID=$(create_gist)
  echo "$GIST_ID" > "$GIST_ID_FILE"
  echo "✅ 创建成功，ID 已保存到 scripts/.gist-id"
fi

LOGIN=$(get_login)
BASE="https://gist.githubusercontent.com/<your-user>/<your-gist-id>/raw/routekit.conf

echo ""
echo "🔗 Gist 页面：https://gist.github.com/<your-user>/<your-gist-id>
echo ""
echo "📱 Shadowrocket 导入链接（复制到 App）："
echo ""
echo "  ★ 完整配置文件（推荐从URL直接导入，Shadowrocket → 配置 → + → 从URL导入）："
echo "  $BASE/routekit.conf"
echo ""
echo "  规则集 - 完整版（作为远程规则集引用）："
echo "  $BASE/routekit.rules"
echo ""
echo "  规则集 - 精简版（作为远程规则集引用）："
echo "  $BASE/routekit-lite.rules"
echo ""
