---
name: e2e-data-check
description: E2E テスト仕様（e2e/specs/<area>/<feature>.md）の前提データが DB にそろっているかを読み取り専用で調べ、e2e/data/<feature>.check.md に結果を書く。「テストデータを確認して」「DB にデータがあるか見て」と頼まれたとき、または e2e スキルの 2 番目のステップとして使う。DB への書き込みは絶対にしない。
---

# テストデータの確認（読み取り専用）

spec の `data_requirements` を 1 件ずつ DB と突き合わせ、**作成が必要か、作成すると何かと衝突しないか**を判定する。
成果物は `e2e/data/<feature>.check.md`。後続の e2e-data-seed はこのファイルを見て投入するデータを決める。

## 絶対に守ること

- DB には `scripts/db-query.sh` でのみアクセスする。このスクリプトは読み取り専用のトランザクションで実行される。
- `SET TRANSACTION READ WRITE`、`SET default_transaction_read_only`、`COMMIT` を挟むなどして、読み取り専用を外す SQL は書かない。
- `docker compose exec db psql` や `psql` を直接呼ばない。
- 接続先は環境変数 `E2E_DB_URL` で決まる（未設定ならローカルの docker）。最初に出力される `-- target:` の行を、レポートにそのまま記録する。

## 手順

1. `e2e/specs/<area>/<feature>.md` の front matter から `data_prefix` と `data_requirements` を読む。
2. 接続を確認する: `scripts/db-query.sh "SELECT current_database(), now()"`
   - 失敗した場合: ローカルなら `docker compose ps` を見て、db が止まっていれば `docker compose up -d` を提案して止まる。
3. スキーマを確認する。spec の `table` / `values` の列が実在するか、`information_schema.columns` で確かめる。存在しない列があれば spec の誤りとして報告する。
4. データ ID ごとに次の 3 つを調べる。SQL は一覧性のため 1 データにつき 1〜2 本に抑える。
   - **存在**: 識別子（sku / name / email）で検索し、行があるか。
   - **一致**: 行がある場合、`values` の各値（stock, price, is_active など）と一致しているか。
     - ユーザーのパスワードは、ハッシュと照合して確かめる（読み取り専用でできる）:
       `SELECT password_hash = crypt('<spec の password>', password_hash) AS password_ok, substring(password_hash, 5, 2) AS cost FROM users WHERE email = '...'`
     - ハッシュの cost が `12`（`api/app/auth.py` の `BCRYPT_COST`）でなければ `MISMATCH`。
     - ユーザーに、前回のテストの注文（`orders.user_id`）やセッション（`sessions.user_id`）が残っていれば `MISMATCH`（注文 0 件で始める前提が崩れるため）。
   - **衝突**: プレフィックス以外の既存データが、テストの結果に影響しないか。例:
     - 検索のシナリオで、検索語が既存の商品名にも当たってしまわないか（`name ILIKE '%検索語%'` の件数）
     - テストユーザーのメールアドレスが、プレフィックスを使わない既存ユーザーと重複していないか
5. 全体の状況も 1 本の SQL で取る: `data_prefix` で始まるデータの件数（テーブルごと）。前回のテストの残骸を見つけるため。
6. [下の形式](#出力形式) で `e2e/data/<feature>.check.md` を書き、判定を報告する。

## 判定

| 判定 | 意味 | e2e-data-seed がすること |
|---|---|---|
| `OK` | 存在し、値も一致 | 何もしない（ただし seed は作り直す方針なので、結果的には再作成されてもよい） |
| `MISSING` | 存在しない | 作成する |
| `MISMATCH` | 存在するが値が違う（前回のテストで在庫が減った等） | 削除して作り直す |
| `CONFLICT` | プレフィックス外の既存データが結果に影響する | **作成では解決しない**。spec の検索語や識別子を変えるべきなので、e2e-spec に戻す |

## 出力形式

```markdown
# <feature> データ確認結果

- 日時: 2026-10-04 15:00
- 接続先: local docker compose (service=db, database=shop) [read-only]
- 判定: seed が必要 / そのまま実行可 / spec の修正が必要

| ID | 対象 | 判定 | 詳細 |
|---|---|---|---|
| D1 | categories: E2E-XX-カテゴリ | MISSING | 行なし |
| D2 | products: E2E-XX-001 | MISMATCH | stock 期待 10 / 実際 8 |
| D3 | users: e2e-xx@example.com | MISMATCH | password_ok=true / 注文が 1 件残っている |

## プレフィックスの残存データ
| table | count |

## 実行した SQL
（そのまま再実行できる形で全部貼る）
```
