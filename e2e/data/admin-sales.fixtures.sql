-- e2e-data: admin-sales fixtures
-- seed の後に実行し、fixtures.json を作る（読み取り専用）:
--   scripts/db-query.sh --raw < e2e/data/admin-sales.fixtures.sql > e2e/data/admin-sales.fixtures.json
SELECT jsonb_pretty(jsonb_build_object(
  'feature', 'admin-sales',
  'generatedAt', to_char(now() AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD"T"HH24:MI:SS"+09:00"'),
  'data', jsonb_build_object(
    'D1', (SELECT jsonb_build_object('table', 'categories', 'id', id, 'name', name)
           FROM categories WHERE name = 'E2E-AS-カテゴリ'),
    'D2', (SELECT jsonb_build_object('table', 'products', 'id', id, 'sku', sku, 'name', name, 'description', description, 'price', price, 'stock', stock, 'is_active', is_active)
           FROM products WHERE sku = 'E2E-AS-001'),
    'D3', (SELECT jsonb_build_object('table', 'users', 'id', id, 'email', email, 'password', 'E2E-as-pass1', 'name', name, 'is_admin', is_admin)
           FROM users WHERE email = 'e2e-as-admin@example.com'),
    'D4', (SELECT jsonb_build_object('table', 'users', 'id', id, 'email', email, 'password', 'E2E-as-pass1', 'name', name, 'is_admin', is_admin)
           FROM users WHERE email = 'e2e-as@example.com'),
    'D5', (SELECT jsonb_build_object('table', 'orders', 'id', o.id, 'user_id', o.user_id, 'status', o.status, 'total', o.total)
           FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = 'e2e-as@example.com' AND o.created_at = '2001-03-10T10:00:00+09:00'),
    'D6', (SELECT jsonb_build_object('table', 'orders', 'id', o.id, 'user_id', o.user_id, 'status', o.status, 'total', o.total)
           FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = 'e2e-as@example.com' AND o.created_at = '2001-03-10T23:30:00+09:00'),
    'D7', (SELECT jsonb_build_object('table', 'orders', 'id', o.id, 'user_id', o.user_id, 'status', o.status, 'total', o.total)
           FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = 'e2e-as@example.com' AND o.created_at = '2001-03-11T00:30:00+09:00'),
    'D8', (SELECT jsonb_build_object('table', 'orders', 'id', o.id, 'user_id', o.user_id, 'status', o.status, 'total', o.total)
           FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = 'e2e-as@example.com' AND o.created_at = '2001-03-12T12:00:00+09:00'),
    'D9', (SELECT jsonb_build_object('table', 'orders', 'id', o.id, 'user_id', o.user_id, 'status', o.status, 'total', o.total)
           FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = 'e2e-as@example.com' AND o.created_at = '2001-03-20T12:00:00+09:00'),
    'D10', (SELECT jsonb_build_object('table', 'orders', 'id', o.id, 'user_id', o.user_id, 'status', o.status, 'total', o.total)
           FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = 'e2e-as@example.com' AND o.created_at = '2001-04-01T12:00:00+09:00')
  )
));
