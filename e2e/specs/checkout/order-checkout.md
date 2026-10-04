---
feature: order-checkout
area: checkout
title: カートから注文まで
pages: [/products/:id, /cart, /orders/complete/:id, /orders]
data_prefix: E2E-OC-
data_requirements:
  - id: D1
    table: categories
    description: テスト専用カテゴリ
    values: { name: E2E-OC-カテゴリ }
    used_by: [S4, S5, S7]
  - id: D2
    table: products
    description: 在庫が十分ある商品（注文の成功に使う）
    values: { sku: E2E-OC-001, name: E2E-OC-ノート, category: D1, price: 500, stock: 10, is_active: true }
    used_by: [S4, S7]
  - id: D3
    table: products
    description: 在庫が残りわずかの商品（在庫不足のエラーに使う）
    values: { sku: E2E-OC-002, name: E2E-OC-ペン, category: D1, price: 200, stock: 2, is_active: true }
    used_by: [S5]
  - id: D6
    table: users
    description: 注文するテストユーザー（注文が 0 件の状態で始める）
    values: { email: e2e-oc@example.com, password: E2E-oc-pass1, name: E2E-OC-ユーザー, is_active: true }
    used_by: [S4, S5, S7]
---

# カートから注文まで E2E テスト仕様

## 対象と範囲

- 対象: カートの表示、カートからの注文、在庫不足のエラー、注文完了と注文履歴、ログインの有無によるカート画面の違い
- 範囲外: 商品一覧の検索・絞り込み（`catalog/product-list`）、商品詳細の表示（`catalog/product-detail`）、同時注文による在庫の競合（API のテストで扱う）、ログイン画面そのものの動き（`account/login` の spec で扱う。`/orders` を未ログインで開いたときのログイン画面への移動もそちら）
- 注文と注文履歴はログイン必須。ログイン済みで始めるシナリオは「ログイン: D6」、未ログインの挙動を確かめるシナリオは「ログイン: なし」と書く
- 商品をカートに入れるまでは未ログインでもできる。ログインの有無でカート画面は `place-order` ↔ `login-to-order` が入れ替わる（S4 がログイン済み、S7 が未ログイン）
- 旧 spec にあった S1〜S3（一覧・検索）と S6（詳細の 404）は `catalog/` の spec へ移した。欠番のまま（ID は振り直さない）

## シナリオ

### S4: 商品詳細から数量を指定してカートに入れ、注文できる

- mode: auto
- perf: true
- tags: [smoke]
- ログイン: D6
- 前提データ: D2, D6
- 手順:
  1. E2E-OC-001 の詳細ページ `/products/<D2.id>` を開く
  2. `quantity-input` に 3 を入力し `add-to-cart` を押す
  3. `cart-link` からカートを開く
  4. `place-order` を押す
  5. 完了ページの `to-history` を押す
- 期待結果:
  - 画面: 手順 2 のあと `added-message`「カートに追加しました」、`cart-count` が 3
  - 画面: カートに `place-order` が表示され、`login-to-order` は無い。`cart-total` が「¥1,500」
  - 画面: 完了ページに `order-number` が表示され、`cart-count` が 0 に戻る
  - 画面: 注文履歴に `order-item` が 1 件、`order-total` が「¥1,500」
  - DB: products(E2E-OC-001).stock が 10 → 7。orders に user_id = D6 の行が 1 件、total = 1500。order_items が 1 件（quantity 3, unit_price 500）

### S5: 在庫より多く注文すると、エラーが表示され注文は作られない

- mode: auto
- perf: false
- ログイン: D6
- 前提データ: D3, D6
- 手順:
  1. `/?q=E2E-OC-ペン` を開き、E2E-OC-002 の `add-to-cart` を押す
  2. カートを開き、`cart-quantity` を 3 に変更する
  3. `place-order` を押す
- 期待結果:
  - 画面: `order-error` に「「E2E-OC-ペン」の在庫が不足しています（残り 2 点）」。カートの中身は残る
  - DB: products(E2E-OC-002).stock は 2 のまま。D6 の注文は S4 の 1 件のまま増えない

### S7: 未ログインではカートから注文できず、ログインするとカートに戻って注文できる状態になる

- mode: auto
- perf: false
- ログイン: なし（画面を操作してログインする）
- 前提データ: D2, D6
- 手順:
  1. 未ログインで `/products/<D2.id>` を開き、`add-to-cart` を押す
  2. `cart-link` からカートを開く
  3. `login-to-order` を押す
  4. ログイン画面で D6 のメールアドレスとパスワードを入力し `login-submit` を押す
- 期待結果:
  - 画面: 手順 1 でヘッダーに `login-link` が表示され、`user-name` は無い
  - 画面: 手順 2 のカートに `login-to-order`「ログインして注文する」が表示され、`place-order` は表示されない
  - 画面: 手順 3 で `/login?redirect=/cart` に移り、`login-required-message` が表示される
  - 画面: 手順 4 のあと `/cart` に戻り、カートの中身（E2E-OC-001 × 1）が残っている。`place-order` が表示され、ヘッダーの `user-name` が「E2E-OC-ユーザー さん」
  - DB: 注文は作られない（S7 の前後で D6 の注文件数が変わらない）

## 未確定の点

- カートに入れた後で商品の価格が変わった場合、カートに表示される価格（追加した時点の価格）と注文時の価格（DB の現在の価格）が食い違う。どちらが正しいかは仕様が決まっていないため、このテストでは扱わない。
