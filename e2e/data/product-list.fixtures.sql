-- e2e-data: product-list fixtures
-- seed の後に実行し、fixtures.json を作る（読み取り専用）:
--   scripts/db-query.sh --raw < e2e/data/product-list.fixtures.sql > e2e/data/product-list.fixtures.json
SELECT jsonb_pretty(jsonb_build_object(
  'feature', 'product-list',
  'generatedAt', to_char(now() AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD"T"HH24:MI:SS"+09:00"'),
  'data', jsonb_build_object(
    'D1', (SELECT jsonb_build_object('table', 'categories', 'id', id, 'name', name)
           FROM categories WHERE name = 'E2E-PL-カテゴリ'),
    'D2', (SELECT jsonb_build_object('table', 'products', 'id', id, 'sku', sku, 'name', name, 'price', price, 'stock', stock)
           FROM products WHERE sku = 'E2E-PL-001'),
    'D3', (SELECT jsonb_build_object('table', 'products', 'id', id, 'sku', sku, 'name', name, 'price', price, 'stock', stock)
           FROM products WHERE sku = 'E2E-PL-002'),
    'D4', (SELECT jsonb_build_object('table', 'products', 'id', id, 'sku', sku, 'name', name, 'price', price, 'stock', stock)
           FROM products WHERE sku = 'E2E-PL-003'),
    'D5', (SELECT jsonb_build_object('table', 'products', 'id', id, 'sku', sku, 'name', name, 'price', price, 'stock', stock)
           FROM products WHERE sku = 'E2E-PL-004'),
    -- パスワードは DB にはハッシュしか無いので、spec の値をそのまま書く（テスト用の値）
    'D6', (SELECT jsonb_build_object('table', 'users', 'id', id, 'email', email, 'password', 'E2E-pl-pass1', 'name', name)
           FROM users WHERE email = 'e2e-pl@example.com')
  )
));
