-- e2e-data: order-checkout seed
-- spec: e2e/specs/checkout/order-checkout.md / data_prefix: E2E-OC-
-- 何度流しても同じ状態になるよう、先に cleanup と同じ削除をする

DELETE FROM order_items
WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'E2E-OC-%')
   OR order_id IN (SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = 'e2e-oc@example.com');
DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email = 'e2e-oc@example.com');
DELETE FROM users WHERE email = 'e2e-oc@example.com';
DELETE FROM products WHERE sku LIKE 'E2E-OC-%';
DELETE FROM categories WHERE name LIKE 'E2E-OC-%';

-- D1
INSERT INTO categories (name) VALUES ('E2E-OC-カテゴリ');

-- D2〜D5
INSERT INTO products (sku, name, description, category_id, price, stock, is_active)
SELECT v.sku, v.name, 'E2E テスト用', c.id, v.price, v.stock, v.is_active
FROM (VALUES
  ('E2E-OC-001', 'E2E-OC-ノート',   500, 10, TRUE),   -- D2
  ('E2E-OC-002', 'E2E-OC-ペン',     200,  2, TRUE),   -- D3
  ('E2E-OC-003', 'E2E-OC-消しゴム', 100,  0, TRUE),   -- D4
  ('E2E-OC-004', 'E2E-OC-定規',     300,  5, FALSE)   -- D5
) AS v(sku, name, price, stock, is_active)
CROSS JOIN (SELECT id FROM categories WHERE name = 'E2E-OC-カテゴリ') AS c;

-- D6（パスワードは pgcrypto で bcrypt にする）
INSERT INTO users (email, password_hash, name, is_active)
VALUES ('e2e-oc@example.com', crypt('E2E-oc-pass1', gen_salt('bf', 12)), 'E2E-OC-ユーザー', TRUE);
