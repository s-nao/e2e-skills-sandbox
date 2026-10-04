-- e2e-data: admin-products fixtures
-- seed の後に実行し、fixtures.json を作る（読み取り専用）:
--   scripts/db-query.sh --raw < e2e/data/admin-products.fixtures.sql > e2e/data/admin-products.fixtures.json
SELECT jsonb_pretty(jsonb_build_object(
  'feature', 'admin-products',
  'generatedAt', to_char(now() AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD"T"HH24:MI:SS"+09:00"'),
  'data', jsonb_build_object(
    'D1', (SELECT jsonb_build_object('table', 'categories', 'id', id, 'name', name)
           FROM categories WHERE name = 'E2E-AP-カテゴリ'),
    'D2', (SELECT jsonb_build_object('table', 'products', 'id', id, 'sku', sku, 'name', name, 'description', description, 'price', price, 'stock', stock, 'is_active', is_active)
           FROM products WHERE sku = 'E2E-AP-001'),
    'D3', (SELECT jsonb_build_object('table', 'products', 'id', id, 'sku', sku, 'name', name, 'description', description, 'price', price, 'stock', stock, 'is_active', is_active)
           FROM products WHERE sku = 'E2E-AP-002'),
    'D4', (SELECT jsonb_build_object('table', 'products', 'id', id, 'sku', sku, 'name', name, 'description', description, 'price', price, 'stock', stock, 'is_active', is_active)
           FROM products WHERE sku = 'E2E-AP-003'),
    'D5', (SELECT jsonb_build_object('table', 'products', 'id', id, 'sku', sku, 'name', name, 'description', description, 'price', price, 'stock', stock, 'is_active', is_active)
           FROM products WHERE sku = 'E2E-AP-004'),
    'D6', (SELECT jsonb_build_object('table', 'products', 'id', id, 'sku', sku, 'name', name, 'description', description, 'price', price, 'stock', stock, 'is_active', is_active)
           FROM products WHERE sku = 'E2E-AP-005'),
    'D7', (SELECT jsonb_build_object('table', 'users', 'id', id, 'email', email, 'password', 'E2E-ap-pass1', 'name', name, 'is_admin', is_admin)
           FROM users WHERE email = 'e2e-ap-admin@example.com'),
    'D8', (SELECT jsonb_build_object('table', 'users', 'id', id, 'email', email, 'password', 'E2E-ap-pass1', 'name', name, 'is_admin', is_admin)
           FROM users WHERE email = 'e2e-ap@example.com'),
    'D9', (SELECT jsonb_build_object('table', 'orders', 'id', o.id, 'user_id', o.user_id, 'status', o.status, 'total', o.total)
           FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = 'e2e-ap@example.com'),
    'D10', jsonb_build_object('table', 'products', 'must_not_exist', TRUE, 'sku', 'E2E-AP-NEW-001', 'skus', jsonb_build_array('E2E-AP-NEW-001'),
           'exists', EXISTS (SELECT 1 FROM products WHERE sku IN ('E2E-AP-NEW-001')))
  )
));
