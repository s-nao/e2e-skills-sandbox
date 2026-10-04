---
feature: login
area: account
title: ログイン・ログアウト
pages: [/login, /, /orders]
data_prefix: E2E-LG-
data_requirements:
  - id: D1
    table: users
    description: ログインできる通常のユーザー（注文 0 件）
    values: { email: e2e-lg@example.com, password: E2E-lg-pass1, name: E2E-LG-ユーザー, is_active: true }
    used_by: [S1, S2, S5, S6, S8, S9]
  - id: D2
    table: users
    description: 停止中のユーザー（正しいパスワードでもログインできない）
    values: { email: e2e-lg-inactive@example.com, password: E2E-lg-pass1, name: E2E-LG-停止ユーザー, is_active: false }
    used_by: [S4]
  - id: D3
    table: users
    description: ログアウト専用のユーザー。ログアウトでセッションが消えるため、他のシナリオと共有しない
    values: { email: e2e-lg-logout@example.com, password: E2E-lg-pass1, name: E2E-LG-ログアウト, is_active: true }
    used_by: [S7]
  - id: D4
    table: users
    description: 存在しないユーザー（このメールアドレスの行が無いことを保証する。行は作らない）
    values: { email: e2e-lg-nobody@example.com, password: E2E-lg-pass1 }
    must_not_exist: true
    used_by: [S3]
---

# ログイン・ログアウト E2E テスト仕様

## 対象と範囲

- 対象: ログイン画面（成功・失敗）、ログインが必要な画面からの誘導と戻り先、ログイン済みでのログイン画面、ログアウト、リロード後のログイン状態
- 範囲外:
  - ログイン後の注文の動き（`checkout/order-checkout` の S4 / S5 / S7 で扱う）
  - セッションの有効期限切れ（期限切れのセッションを作るには、テストの途中で DB を書き換える必要がある。テストからの書き込みは禁止しているため）
- 前提: ログイン失敗の理由（パスワード誤り・存在しない・停止中）は、画面でも API でも区別しない（`api/app/auth.py`）

## シナリオ

### S1: 正しいメールアドレスとパスワードでログインできる

- mode: auto
- perf: true
- tags: [smoke]
- ログイン: なし（画面を操作してログインする）
- 前提データ: D1
- 手順:
  1. `/login` を開く
  2. `login-email` / `login-password` に D1 の値を入力し、`login-submit` を押す
- 期待結果:
  - 画面: `/` に移る。ヘッダーの `user-name` が「E2E-LG-ユーザー さん」、`logout-button` が表示され、`login-link` は表示されない
  - DB: sessions に D1 の行が 1 件増える

### S2: パスワードを間違えるとエラーが表示され、ログインできない

- mode: auto
- perf: false
- ログイン: なし
- 前提データ: D1
- 手順:
  1. `/login` を開く
  2. D1 のメールアドレスと、誤ったパスワード「wrong-password」で `login-submit` を押す
- 期待結果:
  - 画面: `login-error` に「メールアドレスまたはパスワードが正しくありません」。URL は `/login` のまま。`login-password` は空になる。ヘッダーに `login-link` が表示されたまま
  - DB: D1 の sessions の件数は前後で変わらない

### S3: 存在しないメールアドレスでは、パスワード誤りと同じエラーになる

- mode: auto
- perf: false
- ログイン: なし
- 前提データ: D4
- 手順:
  1. `/login` を開く
  2. D4 のメールアドレスとパスワードで `login-submit` を押す
- 期待結果:
  - 画面: `login-error` に「メールアドレスまたはパスワードが正しくありません」（S2 と同じ文言。存在するかどうかを推測させない）
  - DB: 変化なし

### S4: 停止中のユーザーは、正しいパスワードでもログインできない

- mode: auto
- perf: false
- ログイン: なし
- 前提データ: D2
- 手順:
  1. `/login` を開く
  2. D2 のメールアドレスと正しいパスワードで `login-submit` を押す
- 期待結果:
  - 画面: `login-error` に「メールアドレスまたはパスワードが正しくありません」（S2 と同じ文言）
  - DB: D2 の sessions は 0 件のまま

### S5: ログインが必要な画面を未ログインで開くとログイン画面に移り、ログイン後に元の画面へ戻る

- mode: auto
- perf: false
- ログイン: なし（画面を操作してログインする）
- 前提データ: D1
- 手順:
  1. 未ログインで `/orders` を開く
  2. D1 でログインする
- 期待結果:
  - 画面: 手順 1 で `/login?redirect=/orders` に移り、`login-required-message`「続けるにはログインしてください」が表示される
  - 画面: 手順 2 のあと `/orders` に戻り、`history-empty`「注文はありません」が表示される（D1 は注文 0 件）

### S6: ログイン済みでログイン画面を開くと、トップページに移る

- mode: auto
- perf: false
- ログイン: D1
- 前提データ: D1
- 手順:
  1. `/login` を開く
- 期待結果:
  - 画面: `/` に移る。`login-form` は表示されない

### S7: ログアウトすると未ログインの状態に戻り、ログインが必要な画面は開けなくなる

- mode: auto
- perf: false
- ログイン: D3
- 前提データ: D3
- 手順:
  1. `/` を開き、ヘッダーの `logout-button` を押す
  2. `/orders` を開く
- 期待結果:
  - 画面: 手順 1 のあと `/` に移り、ヘッダーに `login-link` が表示され、`user-name` は表示されない
  - 画面: 手順 2 で `/login?redirect=/orders` に移る
  - DB: D3 の sessions が 1 件減る（ログアウトしたセッションが消える）

### S8: ログイン後の戻り先に外部サイトを指定されても、サイトの外へは移らない

- mode: auto
- perf: false
- ログイン: なし（画面を操作してログインする）
- 前提データ: D1
- 手順:
  1. `/login?redirect=//evil.example.com/` を開く
  2. D1 でログインする
- 期待結果:
  - 画面: ログイン後の URL はアプリと同じオリジンの `/`。`evil.example.com` へは移らない
  - DB: 変化なし（ログインのセッションが 1 件増える以外）

### S9: ログインした状態は、ページを再読み込みしても保たれる

- mode: auto
- perf: false
- ログイン: D1
- 前提データ: D1
- 手順:
  1. `/` を開く
  2. ページを再読み込みする
- 期待結果:
  - 画面: 再読み込みの後もヘッダーの `user-name` が「E2E-LG-ユーザー さん」

## 未確定の点

- ログインの試行回数に制限がない（何度でもパスワードを試せる）。本番なら、回数制限やアカウントのロックが必要か検討が要る。
- ログアウトしてもカートの中身は残る（カートはブラウザの localStorage にあるため）。共有の端末で使うことを考えると、ログアウトでカートを空にすべきかは仕様として決まっていない。
- セッションの有効期限が切れた状態で注文すると、カートにエラー「ログインしてください」が出て、ヘッダーが未ログインに変わる（`CartPage.vue`）。上の理由で、このテストでは扱わない。
