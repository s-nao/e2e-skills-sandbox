---
feature: product-list
area: catalog
title: 商品一覧・検索
pages: [/]
data_prefix: E2E-PL-
data_requirements:
  - id: D1
    table: categories
    description: テスト専用カテゴリ
    values: { name: E2E-PL-カテゴリ }
    used_by: [S2]
  - id: D2
    table: products
    description: 在庫が十分ある商品
    values: { sku: E2E-PL-001, name: E2E-PL-ノート, category: D1, price: 500, stock: 10, is_active: true }
    used_by: [S1, S2, S3, S4, S5]
  - id: D3
    table: products
    description: 在庫が残りわずかの商品（5 点以下）
    values: { sku: E2E-PL-002, name: E2E-PL-ペン, category: D1, price: 200, stock: 2, is_active: true }
    used_by: [S1, S2, S3, S5]
  - id: D4
    table: products
    description: 在庫切れの商品
    values: { sku: E2E-PL-003, name: E2E-PL-消しゴム, category: D1, price: 100, stock: 0, is_active: true }
    used_by: [S1, S2, S3, S5]
  - id: D5
    table: products
    description: 販売停止の商品（一覧に出ない）
    values: { sku: E2E-PL-004, name: E2E-PL-定規, category: D1, price: 300, stock: 5, is_active: false }
    used_by: [S1, S5]
  - id: D6
    table: users
    description: ログイン済みの表示を確かめるテストユーザー
    values: { email: e2e-pl@example.com, password: E2E-pl-pass1, name: E2E-PL-ユーザー, is_active: true }
    used_by: [S5]
---

# 商品一覧・検索 E2E テスト仕様

## 対象と範囲

- 対象: 商品一覧の検索・絞り込み、在庫の状態による商品カードの表示、ログインの有無による表示の違い
- 範囲外: ページング（12 件を超えるデータが必要なので別の spec で扱う）、商品詳細（`catalog/product-detail`）、カートと注文（`checkout/order-checkout`）、ログイン画面そのもの（`account/login`）
- 商品一覧は未ログインでも使える。ログインの有無で変わるのはヘッダー（`login-link` ↔ `user-name` + `logout-button`）だけで、一覧の中身・検索結果・カートへの追加は変わらない。S4 と S5 で両方の状態を確かめる

## シナリオ

### S1: 商品名で検索すると、販売中の商品だけが表示される

- mode: auto
- perf: true
- tags: [smoke]
- ログイン: なし
- 前提データ: D2, D3, D4, D5
- 手順:
  1. `/` を開く
  2. `search-input` に「E2E-PL-」と入力し `search-button` を押す
- 期待結果:
  - 画面: `result-count` が「3 件」。`product-card` の `data-sku` が E2E-PL-001〜003 の 3 つ。E2E-PL-004（販売停止）は表示されない
  - 画面: URL に `q=E2E-PL-` が含まれる（リロードで同じ結果になる）
  - DB: 変化なし

### S2: カテゴリと「在庫ありのみ」で絞り込むと、在庫切れの商品が除外される

- mode: auto
- perf: false
- ログイン: なし
- 前提データ: D1, D2, D3, D4
- 手順:
  1. `/` を開く
  2. `category-select` で「E2E-PL-カテゴリ」を選び、`in-stock-checkbox` をオンにして `search-button` を押す
- 期待結果:
  - 画面: `result-count` が「2 件」。表示されるのは E2E-PL-001 と E2E-PL-002
  - DB: 変化なし

### S3: 在庫の状態によって、商品カードの表示が変わる

- mode: auto
- perf: false
- ログイン: なし
- 前提データ: D2, D3, D4
- 手順:
  1. `/?q=E2E-PL-` を開く
- 期待結果:
  - 画面: E2E-PL-003 のカードに `sold-out-badge`「在庫切れ」が表示され、`add-to-cart` が disabled
  - 画面: E2E-PL-002 のカードに `low-stock-badge`「残りわずか（2 点）」が表示され、`add-to-cart` が押せる
  - 画面: E2E-PL-001 のカードには `sold-out-badge` も `low-stock-badge` も出ない
  - DB: 変化なし

### S4: 未ログインでは、ヘッダーにログインへのリンクが出て、商品はカートに入れられる

- mode: auto
- perf: false
- ログイン: なし
- 前提データ: D2
- 手順:
  1. `/?q=E2E-PL-ノート` を開く
  2. E2E-PL-001 のカードの `add-to-cart` を押す
- 期待結果:
  - 画面: ヘッダーに `login-link`「ログイン」が表示され、`user-name` と `logout-button` は無い
  - 画面: 手順 2 のあと、ヘッダーの `cart-count` が 1
  - DB: 変化なし

### S5: ログイン済みでは、ヘッダーにユーザー名が出て、一覧の中身は未ログインと変わらない

- mode: auto
- perf: false
- ログイン: D6
- 前提データ: D2, D3, D4, D5, D6
- 手順:
  1. `/?q=E2E-PL-` を開く
  2. E2E-PL-001 のカードの `add-to-cart` を押す
- 期待結果:
  - 画面: ヘッダーの `user-name` が「E2E-PL-ユーザー さん」で、`logout-button` が表示される。`login-link` は無い
  - 画面: `result-count` が「3 件」、`data-sku` が E2E-PL-001〜003（S1 と同じ。E2E-PL-004 は出ない）
  - 画面: E2E-PL-003 は `sold-out-badge` と disabled の `add-to-cart`、E2E-PL-002 は `low-stock-badge`（S3 と同じ）
  - 画面: 手順 2 のあと、`cart-count` が 1
  - DB: 変化なし（ログインしても一覧の閲覧で DB は変わらない）

## 未確定の点

なし
