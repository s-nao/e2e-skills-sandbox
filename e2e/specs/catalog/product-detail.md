---
feature: product-detail
area: catalog
title: 商品詳細
pages: [/products/:id]
data_prefix: E2E-PD-
data_requirements:
  - id: D1
    table: categories
    description: テスト専用カテゴリ
    values: { name: E2E-PD-カテゴリ }
    used_by: [S1, S5]
  - id: D2
    table: products
    description: 在庫が十分ある商品
    values: { sku: E2E-PD-001, name: E2E-PD-ノート, category: D1, price: 500, stock: 10, is_active: true }
    used_by: [S1, S2, S5]
  - id: D3
    table: products
    description: 在庫切れの商品
    values: { sku: E2E-PD-002, name: E2E-PD-消しゴム, category: D1, price: 100, stock: 0, is_active: true }
    used_by: [S3]
  - id: D4
    table: products
    description: 販売停止の商品（詳細は 404）
    values: { sku: E2E-PD-003, name: E2E-PD-定規, category: D1, price: 300, stock: 5, is_active: false }
    used_by: [S4]
  - id: D5
    table: users
    description: ログイン済みの表示を確かめるテストユーザー
    values: { email: e2e-pd@example.com, password: E2E-pd-pass1, name: E2E-PD-ユーザー, is_active: true }
    used_by: [S5]
---

# 商品詳細 E2E テスト仕様

## 対象と範囲

- 対象: 商品詳細の表示、数量を指定したカートへの追加、在庫切れ・販売停止の商品の表示、ログインの有無による表示の違い
- 範囲外: 一覧からの検索（`catalog/product-list`）、カートの編集と注文（`checkout/order-checkout`）、ログイン画面そのもの（`account/login`）
- 商品詳細は未ログインでも使える。ログインの有無で変わるのはヘッダー（`login-link` ↔ `user-name` + `logout-button`）だけで、商品の表示とカートへの追加は変わらない。S1 と S5 で両方の状態を確かめる

## シナリオ

### S1: 未ログインで商品詳細を開くと、商品の情報が表示され、ヘッダーにログインへのリンクが出る

- mode: auto
- perf: true
- ログイン: なし
- 前提データ: D1, D2
- 手順:
  1. `/products/<D2.id>` を開く
- 期待結果:
  - 画面: `product-name`「E2E-PD-ノート」、`product-price`「¥500」、`product-stock`「在庫: 10 点」。カテゴリ名「E2E-PD-カテゴリ」と SKU「E2E-PD-001」が含まれる行がある
  - 画面: `quantity-input` の初期値が 1、`add-to-cart` が押せる。`sold-out-badge` は無い
  - 画面: ヘッダーに `login-link` が表示され、`user-name` は無い
  - DB: 変化なし

### S2: 数量を指定してカートに入れると、カートに数量どおりの行ができる

- mode: auto
- perf: false
- tags: [smoke]
- ログイン: なし
- 前提データ: D2
- 手順:
  1. `/products/<D2.id>` を開く
  2. `quantity-input` に 3 を入力し `add-to-cart` を押す
  3. `cart-link` からカートを開く
- 期待結果:
  - 画面: 手順 2 のあと `added-message`「カートに追加しました」、`cart-count` が 3
  - 画面: カートに `cart-line`（E2E-PD-001）が 1 行、`cart-quantity` が 3、`cart-total` が「¥1,500」
  - DB: 変化なし（カートはブラウザ内だけで、在庫は減らない。products(E2E-PD-001).stock は 10 のまま）

### S3: 在庫切れの商品は「在庫切れ」と表示され、カートに入れられない

- mode: auto
- perf: false
- ログイン: なし
- 前提データ: D3
- 手順:
  1. `/products/<D3.id>` を開く
- 期待結果:
  - 画面: `product-stock`「在庫: 0 点」、`sold-out-badge`「在庫切れ」
  - 画面: `add-to-cart` と `quantity-input` は表示されない
  - DB: 変化なし

### S4: 販売停止の商品の詳細ページを直接開くと「商品が見つかりません」と表示される

- mode: auto
- perf: false
- ログイン: なし
- 前提データ: D4
- 手順:
  1. `/products/<D4.id>` を開く
- 期待結果:
  - 画面: `error-message` に「商品が見つかりません」。`product-detail` は表示されない
  - DB: 変化なし

### S5: ログイン済みでは、ヘッダーにユーザー名が出て、商品の表示とカートへの追加は未ログインと変わらない

- mode: auto
- perf: false
- ログイン: D5
- 前提データ: D1, D2, D5
- 手順:
  1. `/products/<D2.id>` を開く
  2. `quantity-input` に 3 を入力し `add-to-cart` を押す
- 期待結果:
  - 画面: ヘッダーの `user-name` が「E2E-PD-ユーザー さん」で、`logout-button` が表示される。`login-link` は無い
  - 画面: `product-name`・`product-price`・`product-stock` は S1 と同じ（「E2E-PD-ノート」「¥500」「在庫: 10 点」）
  - 画面: 手順 2 のあと `added-message`「カートに追加しました」、`cart-count` が 3
  - DB: 変化なし

## 未確定の点

なし
