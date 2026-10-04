---
name: e2e
description: 機能単位の E2E テストを、仕様策定 → データ確認 → データ作成 → 実施 の順に通しで行う。「〇〇機能を E2E でテストして」「/e2e order-checkout」のように、工程を指定せずにテストを頼まれたときに使う。個別の工程だけを頼まれたときは e2e-spec / e2e-data-check / e2e-data-seed / e2e-run を直接使う。
argument-hint: <feature> [テストしたい内容の説明]
---

# E2E テスト（通し実行）

引数: `$ARGUMENTS`（先頭が機能名 `<feature>`、残りはテストの観点の説明）

4 つのスキルを順に呼ぶ。各スキルの成果物はファイルで受け渡すので、**途中から再開できる**。
すでに成果物があり、元にしたファイルより新しければ、その工程は飛ばしてよい（飛ばしたことは報告する）。

```
e2e-spec        → e2e/specs/<area>/<feature>.md
e2e-data-check  → e2e/data/<feature>.check.md
e2e-data-seed   → e2e/data/<feature>.{seed,cleanup,fixtures}.sql, <feature>.fixtures.json
e2e-run         → e2e/tests/<area>/<feature>.spec.ts, e2e/reports/<feature>-<日時>.md
```

## 流れ

1. **e2e-spec** を実行する。spec を新しく作った、または大きく変えたときは、シナリオの一覧（ID と 1 行の説明）をユーザーに見せる。ここでは止まらずに先へ進む。
2. **e2e-data-check** を実行する。
   - `CONFLICT` がある → 1 に戻って spec の識別子・検索語を変える（1 回まで。2 回目はユーザーに相談）。
3. **e2e-data-seed** を実行する。
   - 接続先がローカルの docker でなければ、ここで**必ずユーザーの了承を待つ**（e2e-data-seed のルールどおり）。
4. **e2e-run** を実行する。
   - 失敗の分類が「データ」なら 2 からやり直す（1 回まで）。
   - 「仕様」「実装」の場合は、自動でやり直さずにレポートで報告する。
5. 最後に次の形で報告する:
   - 結果: ✅ n / ❌ n
   - 失敗: シナリオ ID・分類・一言
   - 性能: 気になった点（なければ省略）
   - 成果物: spec / レポートのパス
   - 後片付け: テストデータを残している旨と、消すときのコマンド（`scripts/db-exec.sh e2e/data/<feature>.cleanup.sql`）
