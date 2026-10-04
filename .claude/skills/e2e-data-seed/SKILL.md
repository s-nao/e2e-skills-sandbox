---
name: e2e-data-seed
description: E2E テスト仕様とデータ確認結果をもとに、テストデータの投入用 SQL・削除用 SQL・テストから参照する fixtures.json を生成し、DB に投入する。「テストデータを作って」「seed して」「テストデータを消して」と頼まれたとき、または e2e スキルの 3 番目のステップとして使う。DB に書き込む唯一のスキル。
---

# テストデータの作成

このスキルだけが DB に書き込む。だから**作る前に必ず計画を見せ、ローカル以外への書き込みはユーザーの明示的な了承を得てから**実行する。

## 入力

- `e2e/specs/<feature>.md`（`data_prefix` と `data_requirements`）
- `e2e/data/<feature>.check.md`（e2e-data-check の結果）。無い、または古い（spec の更新より前）ときは、先に e2e-data-check を実行する。
- 判定に `CONFLICT` があるときは投入しない。spec の修正が必要だと報告して止まる。

## 生成するファイル

| ファイル | 内容 |
|---|---|
| `e2e/data/<feature>.cleanup.sql` | `data_prefix` のデータをすべて削除する |
| `e2e/data/<feature>.seed.sql` | cleanup と同じ削除をしてから投入する（**何度流しても同じ状態になる**） |
| `e2e/data/<feature>.fixtures.sql` | 投入済みのデータを読み、fixtures.json の中身を 1 つの JSON として返す SELECT（読み取り専用） |
| `e2e/data/<feature>.fixtures.json` | データ ID → 実際の値（DB の id を含む）。fixtures.sql の出力をそのまま保存する。**手で書かない**（seed のたびに id が変わるため） |

### SQL のルール

- **1 行目は必ず** `-- e2e-data: <feature> seed` / `cleanup` / `fixtures` のどれか。`scripts/db-exec.sh` はこの行が無いファイルの実行を拒否する。
- 削除の条件は、必ず `data_prefix` での前方一致（`LIKE 'E2E-XX-%'`）か、spec に書かれた識別子の完全一致だけにする。条件なしの `DELETE` や `TRUNCATE` は書かない。
- 外部キーの順に削除する: `order_items` → `orders` → `products` → `categories`。
  - 他人の注文に、プレフィックスの商品が含まれている可能性があるので、`order_items` は `product_id IN (SELECT id FROM products WHERE sku LIKE ...)` の条件で消す。
- id はハードコードしない。カテゴリなどの参照は `(SELECT id FROM categories WHERE name = '...')` で解決する。
- 性能測定用に大量のデータが必要な場合は、`generate_series` で作る（例: `E2E-PERF-00001`〜）。件数は spec の `values` に書かれたものに従う。

### fixtures.sql / fixtures.json の形

fixtures.sql は `jsonb_pretty(jsonb_build_object(...))` で、データ ID ごとに `(SELECT jsonb_build_object(...) FROM ... WHERE <識別子>)` を並べる。`reserve_only` のデータは値をそのまま書く。実例: `e2e/data/order-checkout.fixtures.sql`

```json
{
  "feature": "<feature>",
  "generatedAt": "2026-10-04T15:00:00+09:00",
  "target": "local docker compose (service=db, database=shop)",
  "data": {
    "D1": { "table": "categories", "id": 4, "name": "E2E-XX-カテゴリ" },
    "D2": { "table": "products", "id": 12, "sku": "E2E-XX-001", "name": "E2E-XX-商品A", "price": 1000, "stock": 10 }
  }
}
```

## 手順

1. 入力を読み、上のルールで 3 ファイルのうち SQL の 2 本を書く。
2. **投入計画を提示する**。接続先（`scripts/db-query.sh "SELECT 1"` の `-- target:` 行）、削除される行数の見込み（`SELECT count(*)` で実測）、投入する行数。
3. 接続先で分岐する:
   - ローカルの docker（`E2E_DB_URL` 未設定）→ そのまま実行してよい。
   - それ以外 → **ユーザーの「はい」を待つ**。会話の中で以前に許可があっても、接続先か SQL が変わっていれば聞き直す。
4. 実行: `scripts/db-exec.sh e2e/data/<feature>.seed.sql`
   - 安全装置（接続先のホスト制限、本番らしい名前の拒否）で止まった場合は、**回避しない**。理由をユーザーに伝える。開発/検証環境なら `E2E_DB_ALLOWED_HOSTS` にホストを足すのはユーザーの判断。
5. fixtures.json を生成する:
   `scripts/db-query.sh --raw < e2e/data/<feature>.fixtures.sql > e2e/data/<feature>.fixtures.json`
   値が `null` のデータ ID があれば、投入に失敗しているので報告する。
6. e2e-data-check をもう一度実行し、全データが `OK` になったことを確認して報告する。

## 削除だけ頼まれたとき

`scripts/db-exec.sh e2e/data/<feature>.cleanup.sql` を実行する。ローカル以外では、上と同じく了承を得てから。
