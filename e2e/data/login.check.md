# login データ確認結果

- 日時: 2026-10-04 17:57
- 接続先: local docker compose (service=db, database=shop) [read-only]
- 判定: **seed が必要**（CONFLICT なし）

| ID | 対象 | 判定 | 詳細 |
|---|---|---|---|
| D1 | users: e2e-lg@example.com | MISSING | 行なし |
| D2 | users: e2e-lg-inactive@example.com | MISSING | 行なし |
| D3 | users: e2e-lg-logout@example.com | MISSING | 行なし |
| D4 | users: e2e-lg-nobody@example.com（must_not_exist） | OK | 行なし（存在しないことが前提） |

- スキーマ: spec の列（email, password_hash ← password, name, is_active）はすべて存在
- 衝突: `e2e-lg` を含むメールアドレス、`E2E-LG-` で始まる名前の、spec 外のユーザーは 0 件

## プレフィックスの残存データ

| table | count |
|---|---:|
| users | 0 |
| sessions | 0 |
| orders | 0 |

## 実行した SQL

```sql
SELECT column_name FROM information_schema.columns
WHERE table_schema='public' AND table_name='users' ORDER BY ordinal_position;

SELECT u.email, u.name, u.is_active,
       u.password_hash = crypt('E2E-lg-pass1', u.password_hash) AS password_ok,
       (SELECT count(*) FROM orders o WHERE o.user_id = u.id) AS orders,
       (SELECT count(*) FROM sessions s WHERE s.user_id = u.id) AS sessions
FROM users u
WHERE u.email IN ('e2e-lg@example.com', 'e2e-lg-inactive@example.com', 'e2e-lg-logout@example.com', 'e2e-lg-nobody@example.com');

SELECT count(*) AS conflict_users FROM users
WHERE (email ILIKE '%e2e-lg%' OR name LIKE 'E2E-LG-%')
  AND email NOT IN ('e2e-lg@example.com', 'e2e-lg-inactive@example.com', 'e2e-lg-logout@example.com');

SELECT 'users' AS t, count(*) FROM users WHERE email LIKE 'e2e-lg%@example.com'
UNION ALL SELECT 'sessions', count(*) FROM sessions s JOIN users u ON u.id = s.user_id WHERE u.email LIKE 'e2e-lg%@example.com'
UNION ALL SELECT 'orders', count(*) FROM orders o JOIN users u ON u.id = o.user_id WHERE u.email LIKE 'e2e-lg%@example.com';
```

## seed 後の再確認（17:59）

| ID | 判定 | 詳細 |
|---|---|---|
| D1 | OK | is_active=true / password_ok=true / セッション 0 件 |
| D2 | OK | is_active=false / password_ok=true / セッション 0 件 |
| D3 | OK | is_active=true / password_ok=true / セッション 0 件 |
| D4 | OK | 行なし |
