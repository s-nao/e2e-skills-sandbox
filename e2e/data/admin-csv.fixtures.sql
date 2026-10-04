-- e2e-data: admin-csv fixtures
-- seed の後に実行し、fixtures.json を作る（読み取り専用）:
--   scripts/db-query.sh --raw < e2e/data/admin-csv.fixtures.sql > e2e/data/admin-csv.fixtures.json
SELECT jsonb_pretty(jsonb_build_object(
  'feature', 'admin-csv',
  'generatedAt', to_char(now() AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD"T"HH24:MI:SS"+09:00"'),
  'data', jsonb_build_object(
    'D1', (SELECT jsonb_build_object('table', 'categories', 'id', id, 'name', name)
           FROM categories WHERE name = 'E2E-AC-カテゴリ'),
    'D3', (SELECT jsonb_build_object('table', 'products', 'id', id, 'sku', sku, 'name', name, 'description', description, 'price', price, 'stock', stock, 'is_active', is_active)
           FROM products WHERE sku = 'E2E-AC-001'),
    'D4', (SELECT jsonb_build_object('table', 'products', 'id', id, 'sku', sku, 'name', name, 'description', description, 'price', price, 'stock', stock, 'is_active', is_active)
           FROM products WHERE sku = 'E2E-AC-002'),
    'D5', (SELECT jsonb_build_object('table', 'products', 'id', id, 'sku', sku, 'name', name, 'description', description, 'price', price, 'stock', stock, 'is_active', is_active)
           FROM products WHERE sku = 'E2E-AC-003'),
    'D6', (SELECT jsonb_build_object('table', 'products', 'id', id, 'sku', sku, 'name', name, 'description', description, 'price', price, 'stock', stock, 'is_active', is_active)
           FROM products WHERE sku = 'E2E-AC-004'),
    'D2', (SELECT jsonb_build_object('table', 'users', 'id', id, 'email', email, 'password', 'E2E-ac-pass1', 'name', name, 'is_admin', is_admin)
           FROM users WHERE email = 'e2e-ac-admin@example.com'),
    'D7', (SELECT jsonb_build_object('table', 'users', 'id', id, 'email', email, 'password', 'E2E-ac-pass1', 'name', name, 'is_admin', is_admin)
           FROM users WHERE email = 'e2e-ac@example.com'),
    'D8', (SELECT jsonb_build_object('table', 'orders', 'id', o.id, 'user_id', o.user_id, 'status', o.status, 'total', o.total)
           FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = 'e2e-ac@example.com'),
    'D9', jsonb_build_object('table', 'products', 'must_not_exist', TRUE, 'sku', 'E2E-AC-NEW-1', 'skus', jsonb_build_array('E2E-AC-NEW-1', 'E2E-AC-NEW-2', 'E2E-AC-NEW-9', 'E2E-AC-NEW-C', 'E2E-AC-NEW-D', 'E2E-AC-BAD'),
           'exists', EXISTS (SELECT 1 FROM products WHERE sku IN ('E2E-AC-NEW-1', 'E2E-AC-NEW-2', 'E2E-AC-NEW-9', 'E2E-AC-NEW-C', 'E2E-AC-NEW-D', 'E2E-AC-BAD')))
  )
));
