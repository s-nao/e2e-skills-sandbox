-- e2e-data: login seed
-- spec: e2e/specs/account/login.md / data_prefix: E2E-LG-
-- 何度流しても同じ状態になるよう、先に cleanup と同じ削除をする

DELETE FROM order_items
WHERE order_id IN (SELECT o.id FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email IN ('e2e-lg@example.com', 'e2e-lg-inactive@example.com', 'e2e-lg-logout@example.com', 'e2e-lg-nobody@example.com'));
DELETE FROM orders WHERE user_id IN (SELECT id FROM users WHERE email IN ('e2e-lg@example.com', 'e2e-lg-inactive@example.com', 'e2e-lg-logout@example.com', 'e2e-lg-nobody@example.com'));
DELETE FROM users WHERE email IN ('e2e-lg@example.com', 'e2e-lg-inactive@example.com', 'e2e-lg-logout@example.com', 'e2e-lg-nobody@example.com');   -- sessions は ON DELETE CASCADE で消える

-- D1〜D3（パスワードは pgcrypto で bcrypt にする）。D4 は作らない
INSERT INTO users (email, password_hash, name, is_active) VALUES
  ('e2e-lg@example.com',          crypt('E2E-lg-pass1', gen_salt('bf', 12)), 'E2E-LG-ユーザー',     TRUE),   -- D1
  ('e2e-lg-inactive@example.com', crypt('E2E-lg-pass1', gen_salt('bf', 12)), 'E2E-LG-停止ユーザー', FALSE),  -- D2
  ('e2e-lg-logout@example.com',   crypt('E2E-lg-pass1', gen_salt('bf', 12)), 'E2E-LG-ログアウト',   TRUE);   -- D3
