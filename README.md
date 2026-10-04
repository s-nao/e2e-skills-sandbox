# e2e-skills-sandbox

E2E テストの工程を Claude Code のスキルに分けて回す試作。

```
/e2e order-checkout
  ├─ e2e-spec        仕様を策定          → e2e/specs/order-checkout.md
  ├─ e2e-data-check  DB を確認（読み取り専用）→ e2e/data/order-checkout.check.md
  ├─ e2e-data-seed   テストデータを投入    → e2e/data/order-checkout.{seed,cleanup,fixtures}.sql, fixtures.json
  └─ e2e-run         Playwright で実施   → e2e/tests/order-checkout.spec.ts, e2e/reports/*.md
```

## はじめかた

```bash
docker compose up -d
cd e2e && npm install && npx playwright install chromium
```

Claude Code でこのフォルダを開き、`/e2e order-checkout` または「商品詳細ページの E2E テストを作って流して」のように頼む。

## 開発/検証環境の DB を使う

```bash
export E2E_DB_URL='postgresql://user:pass@dev-db.example.internal:5432/shop'
export E2E_DB_ALLOWED_HOSTS='localhost,127.0.0.1,db,dev-db.example.internal'
export E2E_BASE_URL='https://dev.example.internal'
```

- `scripts/db-query.sh` は `default_transaction_read_only=on` で接続するので、確認系のスキルが誤って書き込むことはない。可能なら、DB 側でも参照専用ユーザーを用意する。
- `scripts/db-exec.sh` は、接続先が許可リストに無い場合、`prod` / `production` / `live` を含む場合、1 行目が `-- e2e-data:` でない SQL ファイルの場合に実行を拒否する。
