---
feature: admin-csv
area: admin
title: 店舗管理画面の CSV 一括登録・変更・削除
pages: [/products/import]
data_prefix: E2E-AC-
data_requirements:
  - id: D1
    table: categories
    description: テスト専用カテゴリ
    values: { name: E2E-AC-カテゴリ }
    used_by: [S1, S2, S3, S4, S5, S6, S7, S8]
  - id: D2
    table: users
    description: 店舗管理者
    values: { email: e2e-ac-admin@example.com, password: E2E-ac-pass1, name: E2E-AC-管理者, is_active: true, is_admin: true }
    used_by: [S1, S2, S3, S4, S5, S6, S7, S8]
  - id: D3
    table: products
    description: CSV で変更する商品（説明・販売停止の状態が保たれることも確かめる）
    values: { sku: E2E-AC-001, name: E2E-AC-既存A, description: E2E-AC-説明A, category: D1, price: 100, stock: 10, is_active: false }
    used_by: [S2]
  - id: D4
    table: products
    description: CSV で削除する商品（注文履歴なし）
    values: { sku: E2E-AC-002, name: E2E-AC-削除対象, category: D1, price: 100, stock: 1, is_active: true }
    used_by: [S3]
  - id: D5
    table: products
    description: 注文履歴があり、削除できない商品
    values: { sku: E2E-AC-003, name: E2E-AC-注文済み, category: D1, price: 500, stock: 5, is_active: true }
    used_by: [S4]
  - id: D6
    table: products
    description: エラー行のあるファイルで「変更されないこと」を確かめる商品
    values: { sku: E2E-AC-004, name: E2E-AC-据え置き, category: D1, price: 200, stock: 20, is_active: true }
    used_by: [S5]
  - id: D7
    table: users
    description: 一般ユーザー。D5 を 1 個注文した履歴を持つ
    values: { email: e2e-ac@example.com, password: E2E-ac-pass1, name: E2E-AC-ユーザー, is_active: true, is_admin: false }
    used_by: [S4, S9]
  - id: D8
    table: orders
    description: D7 が D5 を 1 個（単価 500）買った注文
    values: { user: D7, status: placed, total: 500, items: [{ product: D5, quantity: 1, unit_price: 500 }] }
    used_by: [S4]
  - id: D9
    table: products
    description: SKU E2E-AC-NEW-1 / NEW-2 / NEW-9 / NEW-C / NEW-D の商品は存在しない（CSV で登録する。行は作らない）
    values: { sku: E2E-AC-NEW-1 }
    must_not_exist: true
    used_by: [S1, S5, S7, S8]
---

# 店舗管理画面の CSV 一括登録・変更・削除 E2E テスト仕様

## 対象と範囲

- 対象: CSV の選択 → 確認（dry run）→ 反映の流れ、登録・変更・削除、行ごとのエラー、1 行でもエラーがあれば何も反映しないこと
- 範囲外: 商品 1 件ずつの登録・編集（`admin/admin-products`）、Shift-JIS など UTF-8 以外の文字コード（非対応）、1000 行を超える CSV
- CSV の仕様（`api/app/admin.py`）:
  - 必須列: sku, name, category（カテゴリ名）, price, stock。任意: description, is_active, action
  - sku が無ければ登録、あれば変更。`action` 列が `delete` の行は削除（他の列は無視）
  - description / is_active の列が無い、または空欄のとき、変更では既存の値を保ち、登録ではそれぞれ空・販売中になる
- テストでは CSV をテストコードの中で組み立て、`import-file` に `setInputFiles` で渡す

## シナリオ

### S1: 新しい商品を CSV で登録できる（確認してから反映）

- mode: auto
- perf: false
- tags: [smoke]
- ログイン: D2
- 前提データ: D1, D2, D9
- 手順:
  1. `/products/import` を開き、`import-file` に次の CSV を選ぶ
     ```
     sku,name,description,category,price,stock,is_active,action
     E2E-AC-NEW-1,E2E-AC-新商品1,説明1,E2E-AC-カテゴリ,300,10,true,
     E2E-AC-NEW-2,E2E-AC-新商品2,,E2E-AC-カテゴリ,400,5,false,
     ```
  2. 確認結果を見たあと、`import-apply` を押す
- 期待結果:
  - 画面: 手順 1 のあと `import-preview` が表示され、`import-summary` が「登録 2 件 / 変更 0 件 / 削除 0 件」、`import-errors` は無く、`import-apply` が有効。手順 2 のあと `import-done` が「反映しました（登録 2 件 / 変更 0 件 / 削除 0 件）」
  - DB: 手順 1 の時点では E2E-AC-NEW-1 / NEW-2 は 0 件（確認だけでは書き込まない）。手順 2 のあと 2 件になり、NEW-1 が price=300, stock=10, is_active=true、NEW-2 が price=400, stock=5, is_active=false, description が空

### S2: 既存の商品を CSV で変更でき、書かなかった列は変わらない

- mode: auto
- perf: false
- ログイン: D2
- 前提データ: D1, D2, D3
- 手順:
  1. `import-file` に次の CSV を選ぶ（description と is_active の列が無い）
     ```
     sku,name,category,price,stock
     E2E-AC-001,E2E-AC-既存A改,E2E-AC-カテゴリ,160,8
     ```
  2. `import-apply` を押す
- 期待結果:
  - 画面: `import-summary` が「登録 0 件 / 変更 1 件 / 削除 0 件」。反映後の `import-done` が「反映しました（登録 0 件 / 変更 1 件 / 削除 0 件）」
  - DB: E2E-AC-001 が name=E2E-AC-既存A改, price=160, stock=8。description は E2E-AC-説明A、is_active は false のまま。sku の件数は 1 のまま

### S3: action 列に delete と書いた行で商品を削除できる

- mode: auto
- perf: false
- ログイン: D2
- 前提データ: D1, D2, D4
- 手順:
  1. `import-file` に次の CSV を選ぶ
     ```
     sku,name,category,price,stock,action
     E2E-AC-002,,,,,delete
     ```
  2. `import-apply` を押す
- 期待結果:
  - 画面: `import-summary` が「登録 0 件 / 変更 0 件 / 削除 1 件」。反映後の `import-done` が「反映しました（登録 0 件 / 変更 0 件 / 削除 1 件）」
  - DB: products に E2E-AC-002 が 0 件

### S4: 注文履歴のある商品の削除行はエラーになり、反映できない

- mode: auto
- perf: false
- ログイン: D2
- 前提データ: D1, D2, D5, D7, D8
- 手順:
  1. `import-file` に次の CSV を選ぶ
     ```
     sku,name,category,price,stock,action
     E2E-AC-003,,,,,delete
     ```
- 期待結果:
  - 画面: `import-error-row` が 1 件で「2 行目（E2E-AC-003）: 注文履歴のある商品は削除できません（is_active を false にして販売停止にしてください）」。`import-apply` は disabled
  - DB: E2E-AC-003 は 1 件のまま

### S5: エラーの行が 1 つでもあれば、正しい行も含めて何も反映されない

- mode: auto
- perf: false
- ログイン: D2
- 前提データ: D1, D2, D6, D9
- 手順:
  1. `import-file` に次の CSV を選ぶ（1 行目は登録、2 行目は D6 の変更、3 行目は price が数字でない）
     ```
     sku,name,category,price,stock
     E2E-AC-NEW-9,E2E-AC-新商品9,E2E-AC-カテゴリ,300,1
     E2E-AC-004,E2E-AC-据え置き,E2E-AC-カテゴリ,999,99
     E2E-AC-BAD,E2E-AC-不正,E2E-AC-カテゴリ,abc,1
     ```
  2. 同じ内容を、管理者としてログインした状態で API `POST /api/admin/products/import`（`dry_run: false`）に直接送る
- 期待結果:
  - 画面: `import-error-row` が 1 件で「4 行目（E2E-AC-BAD）: price の値が正しくありません」。`import-summary` は「登録 1 件 / 変更 1 件 / 削除 0 件」と表示されるが、`import-apply` は disabled
  - API: 手順 2 は 200 で `errors` が 1 件
  - DB: E2E-AC-NEW-9 は 0 件、E2E-AC-004 は price=200, stock=20 のまま（API で直接送っても反映されない）

### S6: 必須の列が足りない CSV はエラーになる

- mode: auto
- perf: false
- ログイン: D2
- 前提データ: D2
- 手順:
  1. `import-file` に次の CSV を選ぶ（price 列が無い）
     ```
     sku,name,category,stock
     E2E-AC-X,名前,E2E-AC-カテゴリ,1
     ```
- 期待結果:
  - 画面: `import-error-row` が 1 件で「1 行目: 列 price がありません」。`import-apply` は disabled

### S7: 存在しないカテゴリ名の行はエラーになる

- mode: auto
- perf: false
- ログイン: D2
- 前提データ: D1, D2, D9
- 手順:
  1. `import-file` に次の CSV を選ぶ
     ```
     sku,name,category,price,stock
     E2E-AC-NEW-C,E2E-AC-新商品C,E2E-AC-無いカテゴリ,100,1
     ```
- 期待結果:
  - 画面: `import-error-row` が 1 件で「2 行目（E2E-AC-NEW-C）: category「E2E-AC-無いカテゴリ」が存在しません」。`import-apply` は disabled
  - DB: E2E-AC-NEW-C は 0 件

### S8: 同じ sku が CSV の中に 2 回あるとエラーになる

- mode: auto
- perf: false
- ログイン: D2
- 前提データ: D1, D2, D9
- 手順:
  1. `import-file` に次の CSV を選ぶ
     ```
     sku,name,category,price,stock
     E2E-AC-NEW-D,E2E-AC-新商品D,E2E-AC-カテゴリ,100,1
     E2E-AC-NEW-D,E2E-AC-新商品D2,E2E-AC-カテゴリ,200,2
     ```
- 期待結果:
  - 画面: `import-error-row` が 1 件で「3 行目（E2E-AC-NEW-D）: 同じ sku が CSV の中に複数あります」。`import-apply` は disabled

### S9: 一般ユーザーは CSV の取り込み API を使えない

- mode: auto
- perf: false
- ログイン: D7
- 前提データ: D7
- 手順:
  1. API `POST /api/admin/products/import` に、登録行を 1 つ含む正しい CSV を `dry_run: false` で送る
- 期待結果:
  - API: 403（detail「管理者のみ利用できます」）
  - DB: products の件数は前後で変わらない

## 未確定の点

- CSV での削除は `action` 列に `delete` を書く方式にした（1 ファイルで登録・変更・削除をまとめられ、確認画面で削除件数が見える）。全件置換（CSV に無い商品を消す）は事故が大きいので採用していない
- CSV の文字コードは UTF-8（BOM 付きも可）のみ。Excel の「CSV（コンマ区切り）」は Shift-JIS で保存されることがあり、その場合は文字化けや「category が存在しません」になる
- 確認から反映までの間に他の人が商品を変えても検知しない（反映時にもう一度検証するので、エラーになるものは弾かれる）
