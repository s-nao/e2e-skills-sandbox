# e2e-skills-sandbox

E2E テストを 4 つのスキルに分けて回すための試作リポジトリ。題材は商品一覧・検索・注文のサンプルショップ。

## 構成

- `web/` Vue 3 + Vite（:5173、`/api` を api にプロキシ）
- `api/` FastAPI + SQLAlchemy 2.0（:8000）
- `db/init/` PostgreSQL のスキーマと開発用の初期データ（ホストからは :55432）
- `e2e/` Playwright。`specs/` 仕様、`data/` テストデータ、`tests/` テストコード、`reports/` 結果
- `scripts/db-query.sh` 読み取り専用で SQL を実行 / `scripts/db-exec.sh` 安全装置付きの書き込み

## コマンド

- 起動: `docker compose up -d`（初回は web の npm install で 30 秒ほどかかる）
- DB を初期状態に戻す: `docker compose down -v && docker compose up -d`
- E2E: `cd e2e && npx playwright test`

## ログイン

- セッション Cookie（`session`、HttpOnly）。サーバー側は `sessions` テーブルにトークンの SHA-256 を保存する。実装は `api/app/auth.py` と `web/src/auth.ts`
- 注文（`POST /api/orders`）と注文履歴はログイン必須。商品の閲覧とカートはログインなしで使える
- 開発用ユーザー（`db/init/002_seed.sql`）: `customer@example.com` / `password123`。`inactive@example.com` は停止中でログインできない
- テストデータのユーザーは SQL で作れる: `crypt('<pw>', gen_salt('bf'))`（pgcrypto）

## E2E スキル

`/e2e <feature>` で通し実行。個別には `e2e-spec` → `e2e-data-check` → `e2e-data-seed` → `e2e-run`。

- DB に書き込むのは e2e-data-seed だけ。他のスキルは `scripts/db-query.sh`（読み取り専用）しか使わない。
- テストデータは機能ごとの `data_prefix`（例: `E2E-OC-`）で始め、作成も削除もこのプレフィックスで行う。
- 開発/検証環境の DB を使うときは `E2E_DB_URL` と `E2E_DB_ALLOWED_HOSTS` を設定する。書き込みは毎回ユーザーの了承を得る。
