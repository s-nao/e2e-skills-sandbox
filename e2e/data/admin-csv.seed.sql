-- e2e-data: admin-csv seed
-- spec: e2e/specs/admin/admin-csv.md / data_prefix: E2E-AC-
-- 何度流しても同じ状態になるよう、先に cleanup と同じ削除をする

DELETE FROM order_items
WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'E2E-AC-%')
   OR order_id IN (SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email IN ('e2e-ac-admin@example.com', 'e2e-ac@example.com'));
DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email IN ('e2e-ac-admin@example.com', 'e2e-ac@example.com'));
DELETE FROM users WHERE email IN ('e2e-ac-admin@example.com', 'e2e-ac@example.com');   -- sessions は ON DELETE CASCADE で消える
DELETE FROM products WHERE sku LIKE 'E2E-AC-%';
DELETE FROM categories WHERE name LIKE 'E2E-AC-%';

-- D1
INSERT INTO categories (name) VALUES ('E2E-AC-カテゴリ');

-- 商品
INSERT INTO products (sku, name, description, category_id, price, stock, is_active) VALUES
  -- D3
  ('E2E-AC-001', 'E2E-AC-既存A', 'E2E-AC-説明A', (SELECT id FROM categories WHERE name = 'E2E-AC-カテゴリ'), 100, 10, FALSE),
  -- D4
  ('E2E-AC-002', 'E2E-AC-削除対象', 'E2E テスト用', (SELECT id FROM categories WHERE name = 'E2E-AC-カテゴリ'), 100, 1, TRUE),
  -- D5
  ('E2E-AC-003', 'E2E-AC-注文済み', 'E2E テスト用', (SELECT id FROM categories WHERE name = 'E2E-AC-カテゴリ'), 500, 5, TRUE),
  -- D6
  ('E2E-AC-004', 'E2E-AC-据え置き', 'E2E テスト用', (SELECT id FROM categories WHERE name = 'E2E-AC-カテゴリ'), 200, 20, TRUE);

-- ユーザー（パスワードは pgcrypto で bcrypt にする。cost 12）
INSERT INTO users (email, password_hash, name, is_active, is_admin) VALUES
  -- D2
  ('e2e-ac-admin@example.com', crypt('E2E-ac-pass1', gen_salt('bf', 12)), 'E2E-AC-管理者', TRUE, TRUE),
  -- D7
  ('e2e-ac@example.com', crypt('E2E-ac-pass1', gen_salt('bf', 12)), 'E2E-AC-ユーザー', TRUE, FALSE);

-- 注文
WITH o AS (
  INSERT INTO orders (user_id, status, total)
  VALUES ((SELECT id FROM users WHERE email = 'e2e-ac@example.com'), 'placed', 500) RETURNING id
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT o.id, (SELECT id FROM products WHERE sku = 'E2E-AC-003'), 1, 500 FROM o;   -- D8
