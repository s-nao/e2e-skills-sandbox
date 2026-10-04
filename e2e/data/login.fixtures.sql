-- e2e-data: login fixtures
-- seed の後に実行し、fixtures.json を作る（読み取り専用）:
--   scripts/db-query.sh --raw < e2e/data/login.fixtures.sql > e2e/data/login.fixtures.json
-- パスワードは DB にはハッシュしか無いので、spec の値をそのまま書く（テスト用の値）
SELECT jsonb_pretty(jsonb_build_object(
  'feature', 'login',
  'generatedAt', to_char(now() AT TIME ZONE 'Asia/Tokyo', 'YYYY-MM-DD"T"HH24:MI:SS"+09:00"'),
  'data', jsonb_build_object(
    'D1', (SELECT jsonb_build_object('table', 'users', 'id', id, 'email', email, 'password', 'E2E-lg-pass1', 'name', name)
           FROM users WHERE email = 'e2e-lg@example.com' AND is_active),
    'D2', (SELECT jsonb_build_object('table', 'users', 'id', id, 'email', email, 'password', 'E2E-lg-pass1', 'name', name)
           FROM users WHERE email = 'e2e-lg-inactive@example.com' AND NOT is_active),
    'D3', (SELECT jsonb_build_object('table', 'users', 'id', id, 'email', email, 'password', 'E2E-lg-pass1', 'name', name)
           FROM users WHERE email = 'e2e-lg-logout@example.com' AND is_active),
    -- D4 は存在しないユーザー。行が残っていれば exists が true になる
    'D4', jsonb_build_object('table', 'users', 'email', 'e2e-lg-nobody@example.com', 'password', 'E2E-lg-pass1',
           'exists', EXISTS (SELECT 1 FROM users WHERE email = 'e2e-lg-nobody@example.com'))
  )
));
