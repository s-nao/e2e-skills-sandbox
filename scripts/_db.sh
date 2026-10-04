# shellcheck shell=bash
# db-query.sh / db-exec.sh の共通処理。直接実行しない。
#
# 接続先:
#   E2E_DB_URL 未設定        → docker compose の db サービス（ローカル）
#   E2E_DB_URL=postgresql://user:pass@host:port/db → そのDB（開発/検証環境）
#
# 書き込み可能なホスト:
#   E2E_DB_ALLOWED_HOSTS（カンマ区切り。既定: localhost,127.0.0.1,db）

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

db_target_host() {
  if [[ -z "${E2E_DB_URL:-}" ]]; then
    echo "db"
  else
    # postgresql://user:pass@HOST:port/db から HOST を取り出す
    sed -E 's#^[a-z+]+://([^@/]*@)?([^:/?]+).*#\2#' <<<"$E2E_DB_URL"
  fi
}

db_describe_target() {
  if [[ -z "${E2E_DB_URL:-}" ]]; then
    echo "local docker compose (service=db, database=shop)"
  else
    # パスワードは表示しない
    sed -E 's#(://[^:/@]+):[^@]*@#\1:****@#' <<<"$E2E_DB_URL"
  fi
}

# 標準入力の SQL を psql に流す。追加の psql 引数と環境変数 PGOPTIONS を引き継ぐ。
db_psql() {
  local opts=(-X -v ON_ERROR_STOP=1 --pset=pager=off "$@")
  if [[ -z "${E2E_DB_URL:-}" ]]; then
    docker compose -f "$ROOT_DIR/docker-compose.yml" exec -T -e PGOPTIONS="${PGOPTIONS:-}" db \
      psql -U app -d shop "${opts[@]}"
  elif command -v psql >/dev/null 2>&1; then
    psql "$E2E_DB_URL" "${opts[@]}"
  else
    docker run --rm -i -e PGOPTIONS="${PGOPTIONS:-}" postgres:16 psql "$E2E_DB_URL" "${opts[@]}"
  fi
}
