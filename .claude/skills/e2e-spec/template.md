---
feature: <feature>
area: <area>                   # e2e/specs/<area>/ と e2e/tests/<area>/ のディレクトリ名
title: <機能の日本語名>
pages: [/, /cart]              # 対象画面のパス
data_prefix: E2E-XX-           # この spec のテストデータはすべてこれで始める
data_requirements:
  - id: D1
    table: categories
    description: テスト専用カテゴリ
    values: { name: E2E-XX-カテゴリ }
    used_by: [S1, S2]
  - id: D2
    table: products
    description: 在庫が十分ある商品
    values: { sku: E2E-XX-001, name: E2E-XX-商品A, category: D1, price: 1000, stock: 10, is_active: true }
    used_by: [S1]
  - id: D3
    table: users
    description: テストユーザー（注文が 0 件の状態で始める）
    values: { email: e2e-xx@example.com, password: E2E-xx-pass1, name: E2E-XX-ユーザー, is_active: true }
    used_by: [S2]
---

# <機能の日本語名> E2E テスト仕様

## 対象と範囲

- 対象: …
- 範囲外: …（理由）

## シナリオ

### S1: <一文で何を確かめるか>

- mode: auto
- perf: false
- tags: [smoke]
- ログイン: なし
- 前提データ: D1, D2
- 手順:
  1. `/` を開く
  2. `search-input` に「E2E-XX-商品A」と入力し `search-button` を押す
- 期待結果:
  - 画面: `result-count` が「1 件」。`product-card[data-sku=E2E-XX-001]` が表示される
  - DB: 変化なし

### S2: …

- ログイン: D3

## 未確定の点

- （コードから判断できなかった仕様。なければ「なし」）
