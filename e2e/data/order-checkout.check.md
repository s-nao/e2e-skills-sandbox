# order-checkout データ確認結果

- 日時: 2026-10-04 17:55
- 接続先: local docker compose (service=db, database=shop) [read-only]
- 判定: **そのまま実行可**（seed 直後の確認）

| ID | 対象 | 判定 | 詳細 |
|---|---|---|---|
| D1 | categories: E2E-OC-カテゴリ | OK | |
| D2 | products: E2E-OC-001 | OK | price 500 / stock 10 / 販売中 |
| D3 | products: E2E-OC-002 | OK | price 200 / stock 2 / 販売中 |
| D4 | products: E2E-OC-003 | OK | price 100 / stock 0 / 販売中 |
| D5 | products: E2E-OC-004 | OK | price 300 / stock 5 / 販売停止 |
| D6 | users: e2e-oc@example.com | OK | is_active=true / password_ok=true / 注文 0 件 / セッション 0 件 |

- 衝突: 検索語「E2E-OC-」を含む、プレフィックス外の商品名は 0 件。`e2e-oc` で始まる別ユーザーは 0 件

## 実行した SQL

```sql
SELECT p.sku, c.name AS category, p.price, p.stock, p.is_active
FROM products p JOIN categories c ON c.id = p.category_id
WHERE p.sku LIKE 'E2E-OC-%' ORDER BY p.sku;

SELECT u.email, u.name, u.is_active, u.password_hash = crypt('E2E-oc-pass1', u.password_hash) AS password_ok,
       (SELECT count(*) FROM orders o WHERE o.user_id = u.id) AS orders,
       (SELECT count(*) FROM sessions s WHERE s.user_id = u.id) AS sessions
FROM users u WHERE u.email = 'e2e-oc@example.com';

SELECT count(*) AS conflict_names FROM products WHERE name ILIKE '%E2E-OC-%' AND sku NOT LIKE 'E2E-OC-%';
SELECT count(*) AS conflict_users FROM users WHERE email ILIKE 'e2e-oc%' AND email <> 'e2e-oc@example.com';
```
