-- e2e-data: admin-products cleanup
-- data_prefix: E2E-AP- / users: e2e-ap-admin@example.com, e2e-ap@example.com

DELETE FROM order_items
WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'E2E-AP-%')
   OR order_id IN (SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email IN ('e2e-ap-admin@example.com', 'e2e-ap@example.com'));
DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email IN ('e2e-ap-admin@example.com', 'e2e-ap@example.com'));
DELETE FROM users WHERE email IN ('e2e-ap-admin@example.com', 'e2e-ap@example.com');   -- sessions は ON DELETE CASCADE で消える
DELETE FROM products WHERE sku LIKE 'E2E-AP-%';
DELETE FROM categories WHERE name LIKE 'E2E-AP-%';
