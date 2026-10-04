# e2e-skills-sandbox

E2E テストを 4 つのスキルに分けて回すための試作リポジトリ。題材は商品一覧・検索・注文のサンプルショップ。

## 構成

- `web/` Vue 3 + Vite（:5173、`/api` を api にプロキシ）。お客さん向けの画面
- `admin/` 店舗管理画面。web とは別の Vue 3 + Vite アプリ（:5174、独自のログイン画面、API は共通）
- `api/` FastAPI + SQLAlchemy 2.0（:8000）
- `db/init/` PostgreSQL のスキーマと開発用の初期データ（ホストからは :55432）
- `e2e/` Playwright。`specs/<area>/` 仕様、`data/` テストデータ、`tests/<area>/` テストコード、`pages/` Page Object、`support/` 共通のフィクスチャ（ログイン・計測）、`reports/` 結果
- `.github/workflows/e2e.yml` PR の作成・更新で E2E を流す CI（seed → fixtures を作り直してから実行）
- `scripts/db-query.sh` 読み取り専用で SQL を実行 / `scripts/db-exec.sh` 安全装置付きの書き込み

## コマンド

- 起動: `docker compose up -d`（初回は web の npm install で 30 秒ほどかかる）
- DB を初期状態に戻す: `docker compose down -v && docker compose up -d`
- E2E: `cd e2e && npx playwright test`（Playwright のプロジェクトは `chromium` = お客さん画面、`admin` = 管理画面 :5174。`tests/admin/` は admin だけで動く）。`tests/<area>/` でまとまりごと、`--grep @smoke` で主経路だけ

## ログイン

- セッション Cookie（`session`、HttpOnly）。サーバー側は `sessions` テーブルにトークンの SHA-256 を保存する。実装は `api/app/auth.py` と `web/src/auth.ts`
- 注文（`POST /api/orders`）と注文履歴はログイン必須。商品の閲覧とカートはログインなしで使える
- 開発用ユーザー（`db/init/002_seed.sql`）: `customer@example.com` / `password123`。`inactive@example.com` は停止中でログインできない
- 店舗管理者: `admin@example.com` / `admin123`（`users.is_admin`。固定の開発用アカウント）。管理画面は http://localhost:5174/ で、`/api/admin/*` は管理者だけ（未ログイン 401、一般ユーザー 403）。実装は `api/app/admin.py` と `admin/src/`。Cookie はポートで分かれないので、5173 と 5174 でログインは共有される
- 起動済みの DB に管理者の機能を入れるときは `users` に `is_admin` 列が要る（`docker compose down -v && docker compose up -d` で作り直すのが簡単）
- テストデータのユーザーは SQL で作れる: `crypt('<pw>', gen_salt('bf', 12))`（pgcrypto）
- E2E でログイン済みから始めるテストは `test.use({ loginAs: fixtures.data.D<n> })`。API でログインし、ワーカーごとに使い回す（`e2e/support/fixtures.ts`）

## E2E スキル

`/e2e <feature>` で通し実行。個別には `e2e-spec` → `e2e-data-check` → `e2e-data-seed` → `e2e-run`。

- DB に書き込むのは e2e-data-seed だけ。他のスキルは `scripts/db-query.sh`（読み取り専用）しか使わない。
- テストデータは機能ごとの `data_prefix`（例: `E2E-OC-`）で始め、作成も削除もこのプレフィックスで行う。
- 開発/検証環境の DB を使うときは `E2E_DB_URL` と `E2E_DB_ALLOWED_HOSTS` を設定する。書き込みは毎回ユーザーの了承を得る。

## 仕様書

- `docs/app-guide.html` が仕様書（動作仕様とコードリーディングの要点）。claude.ai の Artifact として公開している: https://claude.ai/artifact/SV4AaKSYwfA6Ujvu9a2WQG
- 画面・API・DB・E2E の構成を変えたら、同じ変更の中で `docs/app-guide.html` も更新し、Artifact ツールに上の URL を `url` として渡して公開し直す（新しい URL を作らない）。更新前に `action: "read"` で公開中の版を読む
- 行番号を書いている箇所は、変更後のコードで確かめ直す。フッターと冒頭のコミット ID も更新する
