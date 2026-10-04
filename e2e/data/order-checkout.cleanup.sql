-- e2e-data: order-checkout cleanup
-- data_prefix: E2E-OC- / reserve: e2e-oc@example.com

DELETE FROM order_items
WHERE product_id IN (SELECT id FROM products WHERE sku LIKE 'E2E-OC-%')
   OR order_id IN (SELECT id FROM orders WHERE customer_email = 'e2e-oc@example.com');
DELETE FROM orders WHERE customer_email = 'e2e-oc@example.com';
DELETE FROM products WHERE sku LIKE 'E2E-OC-%';
DELETE FROM categories WHERE name LIKE 'E2E-OC-%';
