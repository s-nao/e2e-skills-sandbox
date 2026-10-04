# order-checkout データ確認結果

- 日時: 2026-10-04 15:07
- 接続先: local docker compose (service=db, database=shop) [read-only]
- 判定: **seed が必要**（CONFLICT なし）

| ID | 対象 | 判定 | 詳細 |
|---|---|---|---|
| D1 | categories: E2E-OC-カテゴリ | MISSING | 行なし |
| D2 | products: E2E-OC-001 | MISSING | 行なし |
| D3 | products: E2E-OC-002 | MISSING | 行なし |
| D4 | products: E2E-OC-003 | MISSING | 行なし |
| D5 | products: E2E-OC-004 | MISSING | 行なし |
| D6 | orders: e2e-oc@example.com（reserve_only） | OK | 注文 0 件 |

- 衝突: 検索語「E2E-OC-」を含む、プレフィックス外の商品名は 0 件
- スキーマ: spec の列はすべて存在（categories.name / products.sku, name, category_id, price, stock, is_active / orders.customer_email）

## プレフィックスの残存データ

| table | count |
|---|---:|
| categories | 0 |
| products | 0 |
| orders (D6) | 0 |

## 実行した SQL

```sql
SELECT p.sku, p.name, c.name AS category, p.price, p.stock, p.is_active
FROM products p JOIN categories c ON c.id = p.category_id
WHERE p.sku IN ('E2E-OC-001','E2E-OC-002','E2E-OC-003','E2E-OC-004');
SELECT id, name FROM categories WHERE name = 'E2E-OC-カテゴリ';
SELECT count(*) AS d6_orders FROM orders WHERE customer_email = 'e2e-oc@example.com';
SELECT count(*) AS conflict_names FROM products WHERE (name ILIKE '%E2E-OC-%') AND sku NOT LIKE 'E2E-OC-%';
SELECT 'categories' AS t, count(*) FROM categories WHERE name LIKE 'E2E-OC-%'
UNION ALL SELECT 'products', count(*) FROM products WHERE sku LIKE 'E2E-OC-%'
UNION ALL SELECT 'orders', count(*) FROM orders WHERE customer_email = 'e2e-oc@example.com';
```
