-- e2e-data: admin-products seed
-- spec: e2e/specs/admin/admin-products.md / data_prefix: E2E-AP-
-- 何度流しても同じ状態になるよう、先に cleanup と同じ削除をする

DELETE FROM order_items
WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'E2E-AP-%')
   OR order_id IN (SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email IN ('e2e-ap-admin@example.com', 'e2e-ap@example.com'));
DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email IN ('e2e-ap-admin@example.com', 'e2e-ap@example.com'));
DELETE FROM users WHERE email IN ('e2e-ap-admin@example.com', 'e2e-ap@example.com');   -- sessions は ON DELETE CASCADE で消える
DELETE FROM products WHERE sku LIKE 'E2E-AP-%';
DELETE FROM categories WHERE name LIKE 'E2E-AP-%';

-- D1
INSERT INTO categories (name) VALUES ('E2E-AP-カテゴリ');

-- 商品
INSERT INTO products (sku, name, description, category_id, price, stock, is_active) VALUES
  -- D2
  ('E2E-AP-001', 'E2E-AP-編集用', 'E2E テスト用', (SELECT id FROM categories WHERE name = 'E2E-AP-カテゴリ'), 1000, 10, TRUE),
  -- D3
  ('E2E-AP-002', 'E2E-AP-削除用', 'E2E テスト用', (SELECT id FROM categories WHERE name = 'E2E-AP-カテゴリ'), 300, 5, TRUE),
  -- D4
  ('E2E-AP-003', 'E2E-AP-注文済み', 'E2E テスト用', (SELECT id FROM categories WHERE name = 'E2E-AP-カテゴリ'), 500, 5, TRUE),
  -- D5
  ('E2E-AP-004', 'E2E-AP-停止にする', 'E2E テスト用', (SELECT id FROM categories WHERE name = 'E2E-AP-カテゴリ'), 400, 5, TRUE),
  -- D6
  ('E2E-AP-005', 'E2E-AP-停止中', 'E2E テスト用', (SELECT id FROM categories WHERE name = 'E2E-AP-カテゴリ'), 400, 5, FALSE);

-- ユーザー（パスワードは pgcrypto で bcrypt にする。cost 12）
INSERT INTO users (email, password_hash, name, is_active, is_admin) VALUES
  -- D7
  ('e2e-ap-admin@example.com', crypt('E2E-ap-pass1', gen_salt('bf', 12)), 'E2E-AP-管理者', TRUE, TRUE),
  -- D8
  ('e2e-ap@example.com', crypt('E2E-ap-pass1', gen_salt('bf', 12)), 'E2E-AP-ユーザー', TRUE, FALSE);

-- 注文
WITH o AS (
  INSERT INTO orders (user_id, status, total)
  VALUES ((SELECT id FROM users WHERE email = 'e2e-ap@example.com'), 'placed', 500) RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, (SELECT id FROM products WHERE sku = 'E2E-AP-003'), 1, 500 FROM o;   -- D9
