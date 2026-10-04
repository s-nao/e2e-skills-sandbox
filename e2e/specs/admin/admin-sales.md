---
feature: admin-sales
area: admin
title: 店舗管理画面の売り上げ確認と削除
pages: [/sales]
data_prefix: E2E-AS-
data_requirements:
  - id: D1
    table: categories
    description: テスト専用カテゴリ
    values: { name: E2E-AS-カテゴリ }
    used_by: [S1]
  - id: D2
    table: products
    description: 売り上げの明細に出る商品
    values: { sku: E2E-AS-001, name: E2E-AS-ノート, category: D1, price: 500, stock: 10, is_active: true }
    used_by: [S1, S6]
  - id: D3
    table: users
    description: 店舗管理者
    values: { email: e2e-as-admin@example.com, password: E2E-as-pass1, name: E2E-AS-管理者, is_active: true, is_admin: true }
    used_by: [S1, S2, S3, S4, S5, S6]
  - id: D4
    table: users
    description: 購入者。一般ユーザー
    values: { email: e2e-as@example.com, password: E2E-as-pass1, name: E2E-AS-購入者, is_active: true, is_admin: false }
    used_by: [S6, S7]
  - id: D5
    table: orders
    description: 2001-03-10 10:00（日本時間）の注文。D2 × 3 = 1500
    values: { user: D4, status: placed, total: 1500, created_at: "2001-03-10T10:00:00+09:00", items: [{ product: D2, quantity: 3, unit_price: 500 }] }
    used_by: [S1, S2, S6]
  - id: D6
    table: orders
    description: 2001-03-10 23:30（日本時間。UTC では 14:30）の注文。D2 × 1 = 500。その日の終わりぎわ
    values: { user: D4, status: placed, total: 500, created_at: "2001-03-10T23:30:00+09:00", items: [{ product: D2, quantity: 1, unit_price: 500 }] }
    used_by: [S1, S2]
  - id: D7
    table: orders
    description: 2001-03-11 00:30（日本時間。UTC では 3/10 15:30）の注文。D2 × 2 = 1000。日付の変わりぎわ
    values: { user: D4, status: placed, total: 1000, created_at: "2001-03-11T00:30:00+09:00", items: [{ product: D2, quantity: 2, unit_price: 500 }] }
    used_by: [S1, S2]
  - id: D8
    table: orders
    description: 2001-03-12 12:00（日本時間）のキャンセル済みの注文。D2 × 1 = 500
    values: { user: D4, status: cancelled, total: 500, created_at: "2001-03-12T12:00:00+09:00", items: [{ product: D2, quantity: 1, unit_price: 500 }] }
    used_by: [S2]
  - id: D9
    table: orders
    description: 2001-03-20 12:00（日本時間）の注文。削除に使う。D2 × 4 = 2000
    values: { user: D4, status: placed, total: 2000, created_at: "2001-03-20T12:00:00+09:00", items: [{ product: D2, quantity: 4, unit_price: 500 }] }
    used_by: [S4]
  - id: D10
    table: orders
    description: 2001-04-01 12:00（日本時間）の注文。削除をやめる・権限の確認に使う。D2 × 1 = 500
    values: { user: D4, status: placed, total: 500, created_at: "2001-04-01T12:00:00+09:00", items: [{ product: D2, quantity: 1, unit_price: 500 }] }
    used_by: [S5, S7]
---

# 店舗管理画面の売り上げ確認と削除 E2E テスト仕様

## 対象と範囲

- 対象: 期間（日本時間の日付）を指定した売り上げの合計・件数・明細の表示、注文の削除（確認ダイアログあり）、権限
- 範囲外: 売り上げのグラフ・CSV 出力（未実装）、注文のキャンセル操作（画面が無い。`cancelled` はデータで作る）、200 件を超えたときの打ち切り表示（大量のデータが必要なため。API のテストで扱う）
- 他のデータ（開発用の注文や他の spec の注文）と混ざらないよう、テストデータの注文はすべて 2001 年の日付にし、期間を必ず 2001 年の範囲に絞って確かめる
- 売り上げの合計と件数は `status = placed` の注文だけを数える。キャンセル済みも明細には表示される
- 注文の削除は記録を消すだけで、在庫は戻さない

## シナリオ

### S1: 1 日の範囲で絞ると、日本時間でその日の注文だけが集計される

- mode: auto
- perf: true
- tags: [smoke]
- ログイン: D3
- 前提データ: D1, D2, D3, D5, D6, D7
- 手順:
  1. `/sales` を開き、`sales-from` と `sales-to` に 2001-03-10 を入れて `sales-search` を押す
- 期待結果:
  - 画面: `sales-count` が 2、`sales-total` が「¥2,000」。`sales-row` は 2 件で、D5（¥1,500）と D6（¥500）。D7（日本時間では 3/11）は含まれない

### S2: 期間を広げると合計が増え、キャンセル済みは明細に出るが合計には入らない

- mode: auto
- perf: false
- ログイン: D3
- 前提データ: D2, D3, D5, D6, D7, D8
- 手順:
  1. `sales-from` に 2001-03-10、`sales-to` に 2001-03-12 を入れて `sales-search` を押す
- 期待結果:
  - 画面: `sales-count` が 3、`sales-total` が「¥3,000」（D5 + D6 + D7）。`sales-row` は 4 件で、D8 の行の状態は「キャンセル」、他は「注文済み」。新しい順（D8, D7, D6, D5）に並ぶ

### S3: 該当する注文がない期間では 0 円・0 件と案内が表示される

- mode: auto
- perf: false
- ログイン: D3
- 前提データ: D3
- 手順:
  1. `sales-from` に 2001-02-01、`sales-to` に 2001-02-28 を入れて `sales-search` を押す
- 期待結果:
  - 画面: `sales-count` が 0、`sales-total` が「¥0」、`sales-empty` に「該当する注文はありません」。`sales-table` は表示されない

### S4: 注文を削除すると、売り上げから消え、明細も一緒に消える（在庫は戻らない）

- mode: auto
- perf: false
- ログイン: D3
- 前提データ: D2, D3, D9
- 手順:
  1. `sales-from` と `sales-to` に 2001-03-20 を入れて `sales-search` を押し、D9 の行があることを確かめる
  2. その行の `sales-delete` を押し、確認ダイアログ「注文番号 <D9 の id> の売り上げを削除しますか？（在庫は戻りません）」で OK を押す
- 期待結果:
  - 画面: 手順 1 で `sales-count` が 1、`sales-total` が「¥2,000」。手順 2 のあと `sales-message` に「注文番号 <id> を削除しました」、`sales-count` が 0、`sales-total` が「¥0」、`sales-empty` が表示される
  - DB: orders に D9 の id が 0 件、order_items にその order_id が 0 件。D2 の stock は前後で変わらない。D10 など他の注文は残っている

### S5: 確認ダイアログで取り消すと、注文は削除されない

- mode: auto
- perf: false
- ログイン: D3
- 前提データ: D3, D10
- 手順:
  1. `sales-from` と `sales-to` に 2001-04-01 を入れて `sales-search` を押す
  2. D10 の行の `sales-delete` を押し、確認ダイアログでキャンセルする
- 期待結果:
  - 画面: D10 の行が残り、`sales-message` は表示されない。`sales-count` は 1 のまま
  - DB: orders に D10 の id が 1 件のまま

### S6: 明細に購入者と商品・数量が表示される

- mode: auto
- perf: false
- ログイン: D3
- 前提データ: D2, D3, D4, D5
- 手順:
  1. 2001-03-10 の範囲で表示し、D5 の行（`sales-row[data-order-id=<D5 の id>]`）を見る
- 期待結果:
  - 画面: 行に購入者名「E2E-AS-購入者」とメールアドレス「e2e-as@example.com」、商品「E2E-AS-ノート × 3」、`sales-row-total` が「¥1,500」

### S7: 一般ユーザーと未ログインは売り上げを見られず、削除もできない

- mode: auto
- perf: false
- ログイン: D4
- 前提データ: D4, D10
- 手順:
  1. `/sales` を開く
  2. API `GET /api/admin/sales` と `DELETE /api/admin/sales/<D10 の id>` を呼ぶ
  3. ログインせずに API `GET /api/admin/sales` を呼ぶ
- 期待結果:
  - 画面: 手順 1 で `/forbidden` に移り、`forbidden-message` が表示される
  - API: 手順 2 はどちらも 403。手順 3 は 401
  - DB: orders に D10 の id が 1 件のまま

## 未確定の点

- 売り上げの削除は物理削除で、削除の履歴は残らない。誤操作に備えるなら「削除済み」の印を付ける方式や、削除ログが必要か検討が要る
- 削除しても在庫を戻さない（返品・キャンセルではなく記録の訂正という位置づけ）。この扱いでよいかは運用次第
- 期間の日付は日本時間（Asia/Tokyo）で判定する。海外のユーザー向けには別の考え方が要る
