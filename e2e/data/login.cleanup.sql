-- e2e-data: login cleanup
-- data_prefix: E2E-LG- / users: spec の D1〜D4 のメールアドレス（D4 は存在しないことを保証するため削除対象に含める）

DELETE FROM order_items
WHERE order_id IN (SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email IN ('e2e-lg@example.com', 'e2e-lg-inactive@example.com', 'e2e-lg-logout@example.com', 'e2e-lg-nobody@example.com'));
DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email IN ('e2e-lg@example.com', 'e2e-lg-inactive@example.com', 'e2e-lg-logout@example.com', 'e2e-lg-nobody@example.com'));
DELETE FROM users WHERE email IN ('e2e-lg@example.com', 'e2e-lg-inactive@example.com', 'e2e-lg-logout@example.com', 'e2e-lg-nobody@example.com');   -- sessions は ON DELETE CASCADE で消える
