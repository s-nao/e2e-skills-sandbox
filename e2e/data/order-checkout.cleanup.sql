-- e2e-data: order-checkout cleanup
-- data_prefix: E2E-OC- / user: e2e-oc@example.com

DELETE FROM order_items
WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'E2E-OC-%')
   OR order_id IN (SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = 'e2e-oc@example.com');
DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email = 'e2e-oc@example.com');
DELETE FROM users WHERE email = 'e2e-oc@example.com';   -- sessions は ON DELETE CASCADE で消える
DELETE FROM products WHERE sku LIKE 'E2E-OC-%';
DELETE FROM categories WHERE name LIKE 'E2E-OC-%';
