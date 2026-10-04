# E2E 実行結果

- 日時: 2026/10/4 17:56:09
- 結果: ✅ 7 / ❌ 0 / ⏭️ 0（全 7 件）

## シナリオ

### `checkout/order-checkout.spec.ts`

| 結果 | シナリオ | 所要 | API 呼び出し | API 最大 | load |
|---|---|---:|---:|---:|---:|
| ✅ | S1: 商品名で検索すると、販売中の商品だけが表示される | 0.6s | 4 | 29ms | 149ms |
| ✅ | S2: カテゴリと「在庫ありのみ」で絞り込むと、在庫切れの商品が除外される | 0.3s | 4 | 9ms | 68ms |
| ✅ | S3: 在庫の状態によって、商品カードの表示が変わる | 0.2s | 3 | 8ms | 68ms |
| ✅ | S6: 販売停止の商品の詳細ページを直接開くと「商品が見つかりません」と表示される | 0.2s | 2 | 7ms | 74ms |
| ✅ | S4: 商品詳細から数量を指定してカートに入れ、注文できる | 1.2s | 4 | 35ms | 61ms |
| ✅ | S5: 在庫より多く注文すると、エラーが表示され注文は作られない | 1.1s | 4 | 12ms | 98ms |
| ✅ | S7: 未ログインではカートから注文できず、ログインするとカートに戻って注文できる状態になる | 0.9s | 3 | 13ms | 57ms |

## API 応答時間

| エンドポイント | 回数 | p50 | p95 | 最大 |
|---|---:|---:|---:|---:|
| `GET /api/auth/me` | 7 | 4ms | 29ms | 29ms |
| `GET /api/categories` | 4 | 8ms | 21ms | 21ms |
| `GET /api/orders` | 1 | 11ms | 11ms | 11ms |
| `GET /api/products` | 6 | 9ms | 27ms | 27ms |
| `GET /api/products/:id` | 3 | 6ms | 7ms | 7ms |
| `POST /api/auth/login` | 1 | 13ms | 13ms | 13ms |
| `POST /api/orders` | 2 | 35ms | 35ms | 35ms |

## console.error

- S1: 商品名で検索すると、販売中の商品だけが表示される: Failed to load resource: the server responded with a status of 401 (Unauthorized)
- S2: カテゴリと「在庫ありのみ」で絞り込むと、在庫切れの商品が除外される: Failed to load resource: the server responded with a status of 401 (Unauthorized)
- S3: 在庫の状態によって、商品カードの表示が変わる: Failed to load resource: the server responded with a status of 401 (Unauthorized)
- S6: 販売停止の商品の詳細ページを直接開くと「商品が見つかりません」と表示される: Failed to load resource: the server responded with a status of 401 (Unauthorized)
- S6: 販売停止の商品の詳細ページを直接開くと「商品が見つかりません」と表示される: Failed to load resource: the server responded with a status of 404 (Not Found)
- S5: 在庫より多く注文すると、エラーが表示され注文は作られない: Failed to load resource: the server responded with a status of 409 (Conflict)
- S7: 未ログインではカートから注文できず、ログインするとカートに戻って注文できる状態になる: Failed to load resource: the server responded with a status of 401 (Unauthorized)

## 失敗の分析

失敗なし。ログインの導入（`28eacd3`）で S4 / S5 がタイムアウトしていた件は、spec を更新して解消した。

- 分類: 仕様（注文がログイン必須になり、spec とテストが追従していなかった）
- 対応: テストユーザー D6 を追加し、S4 / S5 はログイン済みで開始（`loginAs`）。未ログインの正しい挙動を S7 として追加。

## 性能の所見

- 前回（`order-checkout-20261004-1510.md`）と比べて、API はどれも 50ms 未満で大きな変化はない。
- 各画面の最初で `/api/auth/me` が 1 回増えた（ログイン状態の確認）。応答は 10ms 前後で、影響は小さい。
