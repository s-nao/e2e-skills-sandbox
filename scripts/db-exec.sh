#!/usr/bin/env bash
# テストデータ投入・削除用。SQL ファイルを 1 トランザクションで実行する。
#
#   scripts/db-exec.sh e2e/data/order-checkout.seed.sql
#
# 安全装置:
#   - 接続先ホストが E2E_DB_ALLOWED_HOSTS に含まれていなければ中止
#   - 接続先に prod / production / live という文字が含まれていれば中止
#   - ファイル先頭行が "-- e2e-data:" で始まらなければ中止（スキルが生成した SQL だけを流す）

source "$(dirname "$0")/_db.sh"

file="${1:?usage: scripts/db-exec.sh <file.sql>}"
[[ -f "$file" ]] || { echo "ERROR: $file not found" >&2; exit 1; }

host="$(db_target_host)"
target="$(db_describe_target)"
allowed="${E2E_DB_ALLOWED_HOSTS:-localhost,127.0.0.1,db}"

if grep -qiE 'prod|production|live' <<<"$target"; then
  echo "ERROR: 本番らしい接続先には書き込めません: $target" >&2
  exit 2
fi
if ! tr ',' '\n' <<<"$allowed" | grep -qxF "$host"; then
  echo "ERROR: $host は E2E_DB_ALLOWED_HOSTS ($allowed) に含まれていません" >&2
  exit 2
fi
if ! head -n1 "$file" | grep -q '^-- e2e-data:'; then
  echo "ERROR: $file の 1 行目が '-- e2e-data:' ではありません。e2e-data-seed スキルで生成した SQL のみ実行できます" >&2
  exit 2
fi

echo "-- target: $target [write]" >&2
echo "-- file:   $file" >&2
db_psql --single-transaction < "$file"
