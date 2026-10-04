-- e2e-data: product-list seed
-- spec: e2e/specs/catalog/product-list.md / data_prefix: E2E-PL-
-- 何度流しても同じ状態になるよう、先に cleanup と同じ削除をする

DELETE FROM order_items
WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'E2E-PL-%')
   OR order_id IN (SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = 'e2e-pl@example.com');
DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email = 'e2e-pl@example.com');
DELETE FROM users WHERE email = 'e2e-pl@example.com';
DELETE FROM products WHERE sku LIKE 'E2E-PL-%';
DELETE FROM categories WHERE name LIKE 'E2E-PL-%';

-- D1
INSERT INTO categories (name) VALUES ('E2E-PL-カテゴリ');

-- 商品
INSERT INTO products (sku, name, description, category_id, price, stock, is_active)
SELECT v.sku, v.name, 'E2E テスト用', c.id, v.price, v.stock, v.is_active
FROM (VALUES
  ('E2E-PL-001', 'E2E-PL-ノート', 500, 10, TRUE),   -- D2
  ('E2E-PL-002', 'E2E-PL-ペン', 200, 2, TRUE),   -- D3
  ('E2E-PL-003', 'E2E-PL-消しゴム', 100, 0, TRUE),   -- D4
  ('E2E-PL-004', 'E2E-PL-定規', 300, 5, FALSE)   -- D5
) AS v(sku, name, price, stock, is_active)
CROSS JOIN (SELECT id FROM categories WHERE name = 'E2E-PL-カテゴリ') AS c;

-- テストユーザー（パスワードは pgcrypto で bcrypt にする）
INSERT INTO users (email, password_hash, name, is_active)
VALUES ('e2e-pl@example.com', crypt('E2E-pl-pass1', gen_salt('bf', 12)), 'E2E-PL-ユーザー', TRUE);
