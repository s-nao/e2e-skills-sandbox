# admin-csv データ確認結果

- 日時: 2026-10-04 21:50
- 接続先: local docker compose (service=db, database=shop) [read-only]
- 判定: **seed が必要**（CONFLICT なし）

- スキーマ: spec の列（users.is_admin、orders.created_at を含む）はすべて存在
- プレフィックス `E2E-AC-` の商品・カテゴリ、`e2e-ac` で始まるユーザーは 0 件 → D\* はすべて MISSING（must_not_exist は OK）
- 衝突: 他の spec のデータとプレフィックスが重ならない。admin-sales の注文は 2001 年の日付で、2002 年より前の既存の注文は 0 件
