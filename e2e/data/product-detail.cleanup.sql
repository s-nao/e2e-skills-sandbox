-- e2e-data: product-detail cleanup
-- data_prefix: E2E-PD- / user: e2e-pd@example.com

DELETE FROM order_items
WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'E2E-PD-%')
   OR order_id IN (SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email = 'e2e-pd@example.com');
DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email = 'e2e-pd@example.com');
DELETE FROM users WHERE email = 'e2e-pd@example.com';   -- sessions は ON DELETE CASCADE で消える
DELETE FROM products WHERE sku LIKE 'E2E-PD-%';
DELETE FROM categories WHERE name LIKE 'E2E-PD-%';
