#!/usr/bin/env bash
# 読み取り専用で SQL を実行する。書き込み系の SQL は DB 側で拒否される。
#
#   scripts/db-query.sh "SELECT count(*) FROM products"
#   scripts/db-query.sh < query.sql
#   scripts/db-query.sh --csv "SELECT ..."     # CSV で出力
#   scripts/db-query.sh --raw < x.sql          # 値だけを出力（JSON を組み立てる SELECT 用）

source "$(dirname "$0")/_db.sh"

extra=()
case "${1:-}" in
  --csv) extra+=(--csv); shift ;;
  --raw) extra+=(-q -A -t); shift ;;
esac

echo "-- target: $(db_describe_target) [read-only]" >&2

export PGOPTIONS="-c default_transaction_read_only=on"
if [[ $# -gt 0 ]]; then
  printf '%s\n' "$1" | db_psql ${extra[@]+"${extra[@]}"}
else
  db_psql ${extra[@]+"${extra[@]}"}
fi
