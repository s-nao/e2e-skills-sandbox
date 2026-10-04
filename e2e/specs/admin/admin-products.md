---
feature: admin-products
area: admin
title: 店舗管理画面の商品管理と権限（管理画面は別アプリ :5174、API は共通）
pages: [/products, /products/new, /products/:id, /forbidden]
data_prefix: E2E-AP-
data_requirements:
  - id: D1
    table: categories
    description: テスト専用カテゴリ
    values: { name: E2E-AP-カテゴリ }
    used_by: [S1, S3, S4, S5, S6, S7]
  - id: D2
    table: products
    description: 編集・SKU 重複の確認に使う商品
    values: { sku: E2E-AP-001, name: E2E-AP-編集用, category: D1, price: 1000, stock: 10, is_active: true }
    used_by: [S2, S3]
  - id: D3
    table: products
    description: 注文履歴がなく、削除できる商品
    values: { sku: E2E-AP-002, name: E2E-AP-削除用, category: D1, price: 300, stock: 5, is_active: true }
    used_by: [S4]
  - id: D4
    table: products
    description: 注文履歴があり、削除できない商品
    values: { sku: E2E-AP-003, name: E2E-AP-注文済み, category: D1, price: 500, stock: 5, is_active: true }
    used_by: [S5]
  - id: D5
    table: products
    description: 販売停止にする商品（最初は販売中）
    values: { sku: E2E-AP-004, name: E2E-AP-停止にする, category: D1, price: 400, stock: 5, is_active: true }
    used_by: [S6]
  - id: D6
    table: products
    description: 最初から販売停止の商品（管理画面の一覧には出る）
    values: { sku: E2E-AP-005, name: E2E-AP-停止中, category: D1, price: 400, stock: 5, is_active: false }
    used_by: [S7]
  - id: D7
    table: users
    description: 店舗管理者
    values: { email: e2e-ap-admin@example.com, password: E2E-ap-pass1, name: E2E-AP-管理者, is_active: true, is_admin: true }
    used_by: [S1, S2, S3, S4, S5, S6, S7, S10]
  - id: D8
    table: users
    description: 一般ユーザー（管理者ではない）。D4 を 1 個注文した履歴を持つ
    values: { email: e2e-ap@example.com, password: E2E-ap-pass1, name: E2E-AP-ユーザー, is_active: true, is_admin: false }
    used_by: [S8, S9]
  - id: D9
    table: orders
    description: D8 が D4 を 1 個（単価 500）買った注文。D4 を削除できなくするためのもの
    values: { user: D8, status: placed, total: 500, items: [{ product: D4, quantity: 1, unit_price: 500 }] }
    used_by: [S5]
  - id: D10
    table: products
    description: SKU E2E-AP-NEW-001 の商品は存在しない（S1 で登録する。行は作らない）
    values: { sku: E2E-AP-NEW-001, name: E2E-AP-新商品 }
    must_not_exist: true
    used_by: [S1]
---

# 店舗管理画面の商品管理と権限 E2E テスト仕様

## 対象と範囲

- 対象: 管理画面の商品一覧・検索、登録、編集（販売停止を含む）、削除、管理画面を使える人の制限（未ログイン・一般ユーザー・管理者）
- 範囲外: CSV 一括登録（`admin/admin-csv`）、売り上げ（`admin/admin-sales`）
- 管理者は `users.is_admin = TRUE` のユーザー。ログインは一般ユーザーと同じ画面・API
- 商品の削除は、注文履歴がなければ物理削除、あれば 409 で拒否して「販売停止にしてください」と案内する（`api/app/admin.py`）

## シナリオ

### S1: 商品を登録でき、一覧に出る

- mode: auto
- perf: false
- tags: [smoke]
- ログイン: D7
- 前提データ: D1, D7, D10
- 手順:
  1. `/products/new` を開く
  2. `form-sku` に E2E-AP-NEW-001、`form-name` に E2E-AP-新商品、`form-category` に D1、`form-price` に 1200、`form-stock` に 5 を入れ、`form-submit` を押す
  3. `/products` で `admin-search` に E2E-AP-NEW-001 を入れて `admin-search-submit` を押す
- 期待結果:
  - 画面: 手順 2 のあと `/products` に移る。手順 3 で `admin-product-row[data-sku=E2E-AP-NEW-001]` が 1 件、商品名「E2E-AP-新商品」、価格「¥1,200」、在庫 5、`admin-product-status` が「販売中」
  - DB: products に sku=E2E-AP-NEW-001 が 1 件（price=1200, stock=5, is_active=true, category_id=D1）

### S2: すでに使われている SKU では登録できない

- mode: auto
- perf: false
- ログイン: D7
- 前提データ: D1, D2, D7
- 手順:
  1. `/products/new` を開く
  2. `form-sku` に D2 の SKU、`form-name` に「E2E-AP-重複」、価格 100、在庫 1 を入れ `form-submit` を押す
- 期待結果:
  - 画面: `form-error` に「SKU「E2E-AP-001」はすでに使われています」。URL は `/products/new` のまま
  - DB: products の sku=E2E-AP-001 は 1 件のまま、name は E2E-AP-編集用 のまま

### S3: 商品を編集でき、一覧に反映される

- mode: auto
- perf: false
- tags: [smoke]
- ログイン: D7
- 前提データ: D1, D2, D7
- 手順:
  1. `/products` で D2 を検索し、`admin-edit` を押す
  2. 編集画面に D2 の値（SKU・商品名・価格 1000・在庫 10・販売中）が入っていることを確かめる
  3. `form-price` を 1500、`form-stock` を 3 に変えて `form-submit` を押す
- 期待結果:
  - 画面: 手順 2 で `form-sku` が E2E-AP-001、`form-price` が 1000。手順 3 のあと `/products` に移り、D2 の行が価格「¥1,500」、在庫 3
  - DB: products の E2E-AP-001 が price=1500, stock=3。name は変わらない

### S4: 注文履歴のない商品を削除できる

- mode: auto
- perf: false
- ログイン: D7
- 前提データ: D1, D3, D7
- 手順:
  1. `/products` で D3 を検索する
  2. `admin-delete` を押し、確認ダイアログ「「E2E-AP-削除用」を削除しますか？」で OK を押す
- 期待結果:
  - 画面: `admin-message` に「「E2E-AP-削除用」を削除しました」。一覧から D3 の行が消える（`admin-product-row[data-sku=E2E-AP-002]` が 0 件）
  - DB: products に sku=E2E-AP-002 が 0 件

### S5: 注文履歴のある商品は削除できず、販売停止を案内される

- mode: auto
- perf: false
- ログイン: D7
- 前提データ: D1, D4, D7, D8, D9
- 手順:
  1. `/products` で D4 を検索する
  2. `admin-delete` を押し、確認ダイアログで OK を押す
- 期待結果:
  - 画面: `admin-error` に「注文履歴のある商品は削除できません。販売停止にしてください」。D4 の行は残る
  - DB: products に sku=E2E-AP-003 が 1 件のまま。order_items の件数も変わらない

### S6: 販売停止にした商品は、お客さん向けの一覧と詳細から消える

- mode: auto
- perf: false
- ログイン: D7
- 前提データ: D1, D5, D7
- 手順:
  1. `/products` で D5 を検索し、`admin-edit` を押す
  2. `form-active`（販売中）のチェックを外して `form-submit` を押す
  3. `/products` で D5 を検索する
  4. API `GET /api/products?q=E2E-AP-停止にする` と `GET /api/products/<D5 の id>` を呼ぶ
- 期待結果:
  - 画面: 手順 3 で D5 の `admin-product-status` が「販売停止」（管理画面の一覧には残る）
  - API: 手順 4 の一覧は total=0、詳細は 404
  - DB: products の E2E-AP-004 が is_active=false。stock などは変わらない

### S7: 管理画面の検索は SKU でも商品名でもでき、販売停止の商品も出る

- mode: auto
- perf: false
- ログイン: D7
- 前提データ: D1, D6, D7
- 手順:
  1. `/products` で `admin-search` に D6 の SKU「E2E-AP-005」を入れて検索する
  2. 検索語を D6 の商品名の一部「停止中」に変えて検索する
  3. 存在しない語「E2E-AP-nothing」で検索する
- 期待結果:
  - 画面: 手順 1・2 とも `admin-product-row[data-sku=E2E-AP-005]` が 1 件で、`admin-product-status` が「販売停止」。手順 3 は `admin-products-empty` が表示され、`admin-products-total` が「全 0 件」

### S8: 未ログインで管理画面を開くとログイン画面へ移り、ログイン後に戻る

- mode: auto
- perf: false
- ログイン: なし（画面を操作してログインする）
- 前提データ: D7
- 手順:
  1. 未ログインで `/products` を開く
  2. D7 でログインする
- 期待結果:
  - 画面: 手順 1 で `/login?redirect=/products` に移る。手順 2 のあと `/products` が開き、`admin-products-table` が表示される

### S9: 一般ユーザーは管理画面も管理 API も使えない

- mode: auto
- perf: false
- ログイン: D8
- 前提データ: D8
- 手順:
  1. `/products` を開く
  2. ヘッダーのユーザー名を確認する
  3. API `GET /api/admin/products`、`POST /api/admin/products`（正しい内容）、`DELETE /api/admin/products/<D4 の id>` を呼ぶ
  4. ログインせずに API `GET /api/admin/products` を呼ぶ
- 期待結果:
  - 画面: 手順 1 で `/forbidden` に移り、`forbidden-message`「このページは店舗管理者だけが利用できます」が表示される。手順 2 で `user-name` に一般ユーザーの名前が出る（管理画面にログインはできるが、管理機能は使えない）
  - API: 手順 3 はすべて 403（detail「管理者のみ利用できます」）。手順 4 は 401
  - DB: products の件数は前後で変わらない（POST が通っていない）。D4 も残っている

### S10: 管理者が管理画面のトップを開くと商品一覧に移り、3 つのタブが表示される

- mode: auto
- perf: false
- ログイン: D7
- 前提データ: D7
- 手順:
  1. `/` を開く
- 期待結果:
  - 画面: `user-name` に「{D7 の名前} さん」。`/products` に移り、`admin-tab-products` / `admin-tab-import` / `admin-tab-sales` が表示される

## 未確定の点

- 管理者アカウントは SQL で作る固定運用（画面から作成・変更する機能は無い）。開発用は `admin@example.com`（`db/init/002_seed.sql`）。本番では初期パスワードの変更手段が必要
- 商品の削除はブラウザの確認ダイアログ（`window.confirm`）で確認している。見た目を揃えるなら画面内のダイアログに変えることも考えられる
- 管理 API に CSRF 対策は無い（Cookie は SameSite=Lax）。管理者の操作が GET では行われないので当面は許容するが、本番では要検討
