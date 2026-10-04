---
feature: <feature>
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
    table: orders
    description: 注文がまだ無い顧客（メールアドレスだけ予約する。行は作らない）
    values: { customer_email: e2e-xx@example.com }
    reserve_only: true         # 行は作らず、「存在しないこと」を確認・保証するだけ
    used_by: [S1]
---

# <機能の日本語名> E2E テスト仕様

## 対象と範囲

- 対象: …
- 範囲外: …（理由）

## シナリオ

### S1: <一文で何を確かめるか>

- mode: auto
- perf: false
- 前提データ: D1, D2, D3
- 手順:
  1. `/` を開く
  2. `search-input` に「E2E-XX-商品A」と入力し `search-button` を押す
- 期待結果:
  - 画面: `result-count` が「1 件」。`product-card[data-sku=E2E-XX-001]` が表示される
  - DB: 変化なし

### S2: …

## 未確定の点

- （コードから判断できなかった仕様。なければ「なし」）
