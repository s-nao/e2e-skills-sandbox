-- e2e-data: admin-csv cleanup
-- data_prefix: E2E-AC- / users: e2e-ac-admin@example.com, e2e-ac@example.com

DELETE FROM order_items
WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'E2E-AC-%')
   OR order_id IN (SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email IN ('e2e-ac-admin@example.com', 'e2e-ac@example.com'));
DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email IN ('e2e-ac-admin@example.com', 'e2e-ac@example.com'));
DELETE FROM users WHERE email IN ('e2e-ac-admin@example.com', 'e2e-ac@example.com');   -- sessions は ON DELETE CASCADE で消える
DELETE FROM products WHERE sku LIKE 'E2E-AC-%';
DELETE FROM categories WHERE name LIKE 'E2E-AC-%';
