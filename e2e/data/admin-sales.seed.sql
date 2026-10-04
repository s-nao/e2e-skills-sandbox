-- e2e-data: admin-sales seed
-- spec: e2e/specs/admin/admin-sales.md / data_prefix: E2E-AS-
-- 何度流しても同じ状態になるよう、先に cleanup と同じ削除をする

DELETE FROM order_items
WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'E2E-AS-%')
   OR order_id IN (SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email IN ('e2e-as-admin@example.com', 'e2e-as@example.com'));
DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email IN ('e2e-as-admin@example.com', 'e2e-as@example.com'));
DELETE FROM users WHERE email IN ('e2e-as-admin@example.com', 'e2e-as@example.com');   -- sessions は ON DELETE CASCADE で消える
DELETE FROM products WHERE sku LIKE 'E2E-AS-%';
DELETE FROM categories WHERE name LIKE 'E2E-AS-%';

-- D1
INSERT INTO categories (name) VALUES ('E2E-AS-カテゴリ');

-- 商品
INSERT INTO products (sku, name, description, category_id, price, stock, is_active) VALUES
  -- D2
  ('E2E-AS-001', 'E2E-AS-ノート', 'E2E テスト用', (SELECT id FROM categories WHERE name = 'E2E-AS-カテゴリ'), 500, 10, TRUE);

-- ユーザー（パスワードは pgcrypto で bcrypt にする。cost 12）
INSERT INTO users (email, password_hash, name, is_active, is_admin) VALUES
  -- D3
  ('e2e-as-admin@example.com', crypt('E2E-as-pass1', gen_salt('bf', 12)), 'E2E-AS-管理者', TRUE, TRUE),
  -- D4
  ('e2e-as@example.com', crypt('E2E-as-pass1', gen_salt('bf', 12)), 'E2E-AS-購入者', TRUE, FALSE);

-- 注文
WITH o AS (
  INSERT INTO orders (user_id, status, total, created_at)
  VALUES ((SELECT id FROM users WHERE email = 'e2e-as@example.com'), 'placed', 1500, '2001-03-10T10:00:00+09:00') RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, (SELECT id FROM products WHERE sku = 'E2E-AS-001'), 3, 500 FROM o;   -- D5
WITH o AS (
  INSERT INTO orders (user_id, status, total, created_at)
  VALUES ((SELECT id FROM users WHERE email = 'e2e-as@example.com'), 'placed', 500, '2001-03-10T23:30:00+09:00') RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, (SELECT id FROM products WHERE sku = 'E2E-AS-001'), 1, 500 FROM o;   -- D6
WITH o AS (
  INSERT INTO orders (user_id, status, total, created_at)
  VALUES ((SELECT id FROM users WHERE email = 'e2e-as@example.com'), 'placed', 1000, '2001-03-11T00:30:00+09:00') RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, (SELECT id FROM products WHERE sku = 'E2E-AS-001'), 2, 500 FROM o;   -- D7
WITH o AS (
  INSERT INTO orders (user_id, status, total, created_at)
  VALUES ((SELECT id FROM users WHERE email = 'e2e-as@example.com'), 'cancelled', 500, '2001-03-12T12:00:00+09:00') RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, (SELECT id FROM products WHERE sku = 'E2E-AS-001'), 1, 500 FROM o;   -- D8
WITH o AS (
  INSERT INTO orders (user_id, status, total, created_at)
  VALUES ((SELECT id FROM users WHERE email = 'e2e-as@example.com'), 'placed', 2000, '2001-03-20T12:00:00+09:00') RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, (SELECT id FROM products WHERE sku = 'E2E-AS-001'), 4, 500 FROM o;   -- D9
WITH o AS (
  INSERT INTO orders (user_id, status, total, created_at)
  VALUES ((SELECT id FROM users WHERE email = 'e2e-as@example.com'), 'placed', 500, '2001-04-01T12:00:00+09:00') RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, (SELECT id FROM products WHERE sku = 'E2E-AS-001'), 1, 500 FROM o;   -- D10
