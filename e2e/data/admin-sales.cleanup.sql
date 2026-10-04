-- e2e-data: admin-sales cleanup
-- data_prefix: E2E-AS- / users: e2e-as-admin@example.com, e2e-as@example.com

DELETE FROM order_items
WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'E2E-AS-%')
   OR order_id IN (SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email IN ('e2e-as-admin@example.com', 'e2e-as@example.com'));
DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email IN ('e2e-as-admin@example.com', 'e2e-as@example.com'));
DELETE FROM users WHERE email IN ('e2e-as-admin@example.com', 'e2e-as@example.com');   -- sessions は ON DELETE CASCADE で消える
DELETE FROM products WHERE sku LIKE 'E2E-AS-%';
DELETE FROM categories WHERE name LIKE 'E2E-AS-%';
