---
name: e2e-run
description: E2E テスト仕様（e2e/specs/<area>/<feature>.md）と投入済みのテストデータ（e2e/data/<feature>.fixtures.json）をもとに、Playwright のテスト（e2e/tests/<area>/<feature>.spec.ts）を生成・実行し、結果と API・画面の応答時間を e2e/reports/ にまとめる。manual のシナリオはブラウザを操作して確認する。「E2E を流して」「テストを実施して」と頼まれたとき、または e2e スキルの最後のステップとして使う。
---

# 操作してのテスト実施

## 前提の確認

1. アプリが起動しているか: `curl -sf http://localhost:5173/api/health`（`E2E_BASE_URL` があればそちら）。止まっていれば `docker compose up -d` を提案して止まる。
2. `e2e/data/<feature>.fixtures.json` があるか。無ければ e2e-data-seed が必要だと報告して止まる。
   - テストで DB の値が変わる（注文で在庫が減る等）ので、**2 回目以降の実行の前には必ず seed を流し直す**:
     `scripts/db-exec.sh e2e/data/<feature>.seed.sql && scripts/db-query.sh --raw < e2e/data/<feature>.fixtures.sql > e2e/data/<feature>.fixtures.json`
     （ローカル以外の接続先では、e2e-data-seed のルールどおり了承を得てから）
3. `e2e/node_modules` が無ければ `cd e2e && npm install && npx playwright install chromium`。

## e2e/ の構成

```
e2e/
├── specs/<area>/<feature>.md      仕様（e2e-spec）
├── data/<feature>.*               テストデータ（e2e-data-check / e2e-data-seed）
├── pages/                         Page Object。画面ごとの操作と要素をまとめる
├── support/fixtures.ts            test / expect。ログイン（loginAs）と計測
├── support/db.ts                  queryValue / queryRows（読み取り専用）
└── tests/<area>/<feature>.spec.ts テスト（このスキルが書く）
```

## テストコードの生成（`e2e/tests/<area>/<feature>.spec.ts`）

既にあり、spec の更新日時より新しければ再生成しない。spec に新しいシナリオが増えた場合は、そのシナリオだけ追加する。
手本: `e2e/tests/checkout/order-checkout.spec.ts`

- `import { test, expect } from '../../support/fixtures'` を使う（API と画面の応答時間、想定外の 401 が自動で記録される）。
- テストデータは `../../data/<feature>.fixtures.json` を `import` して、そこから値を取る。**SKU・メールアドレス・パスワードをテストコードに直接書かない。**
- テスト名は `S1: <シナリオ名>` の形にする（レポートで spec と対応を取るため）。`mode: manual` のシナリオは生成しない。
- **ログイン**は spec の `ログイン:` に従う:
  - `D<n>` → `test.describe` でまとめ、その中で `test.use({ loginAs: fixtures.data.D<n> })`。API でログインした状態から始まる。画面のログイン操作は書かない。
  - `なし` → 何も書かない（未ログインで始まる）。手順にログイン画面の操作があれば `LoginPage.login()` を使う。
  - ログイン済みのシナリオの最初で `header.expectLoggedInAs(name)` を確認する。ログインに失敗していたとき、後の操作のタイムアウトではなく、ここで分かりやすく失敗させるため。
- **グループ化**: `test.describe` で「ログインの有無」や「画面のまとまり」ごとにまとめる。`tags: [smoke]` のシナリオには `{ tag: '@smoke' }` を付ける。
- **Page Object**: 要素の取得と、2 手以上の操作は `e2e/pages/` のクラスに置く。必要なものが無ければ追加する。
  - 要素は `page.getByTestId(...)` で取る。CSS セレクタや XPath は使わない（商品カードの `data-sku` のような属性の絞り込みは可）。
  - 操作の前に、操作できる状態かを `expect(...).toBeVisible()` で確かめる（例: `CartPage.placeOrder()`）。要素が無いとき、30 秒待たずに「何が無いか」が分かる失敗になる。
- 期待結果の「DB」は `../../support/db` の `queryValue` / `queryRows` で確認する（読み取り専用）。件数は、可能ならテストの前後の差で確認する（他のシナリオの影響を受けないため）。
- ファイルの中のテストは、書いた順に 1 つのワーカーで流れる。ファイル同士は並列に流れる（`workers: 2`）。データは機能ごとのプレフィックスで分かれているので、他のファイルとは干渉しない。
- `waitForTimeout` で待たない。`expect(...).toHaveText` などの自動待機を使う。

## 実行

```bash
cd e2e && npx playwright test tests/<area>/<feature>.spec.ts   # 1 機能
cd e2e && npx playwright test tests/<area>/                    # まとまりごと
cd e2e && npx playwright test --grep @smoke                    # 主経路だけ
```

その後、集計スクリプトで Markdown にする（リポジトリのルートで実行）:

```bash
node .claude/skills/e2e-run/scripts/summarize.mjs e2e/test-results/results.json > e2e/reports/<feature>-<YYYYMMDD-HHmm>.md
```

## 失敗したときの切り分け

失敗はそのまま「テストが落ちた」で終わらせず、原因を次のどれかに分類してレポートに書く。**テストを通すために期待値を書き換えるのは、原因が「テストコード」の場合だけ**。

| 分類 | 見分け方 | 次のアクション |
|---|---|---|
| データ | 失敗時の DB の値が fixtures.json と違う、前のシナリオの影響 | e2e-data-check → e2e-data-seed からやり直す |
| 認証 | `loginAs` のログインで失敗（ユーザーが無い・パスワード違い・停止中）、またはレポートに「想定外の 401」がある | ユーザーのデータなら e2e-data-check から。ログインの仕組みの問題なら実装として報告 |
| 仕様 | spec の期待結果とコードの実装が明らかに違うが、実装の方が意図どおりに見える | e2e-spec で spec を直す |
| 実装 | spec が正しく、アプリが期待と違う動きをしている | **バグとして報告する**（アプリのコードは直さない） |
| テストコード | セレクタの誤り、待機の不足など | spec.ts / Page Object を直して再実行（最大 2 回） |

調べるもの: `e2e/test-results/` のスクリーンショットと `trace.zip`、レポートの `console-errors` と「想定外の 401」。必要ならブラウザで同じ手順を操作して再現する。

## manual のシナリオ

ブラウザを操作して手順どおりに進め、期待結果ごとにスクリーンショットを撮って `e2e/reports/<feature>-<日時>/S<n>.png` に保存する。合否はレポートの「manual」の節に書く。

## レポート

集計スクリプトの出力に、次の 2 節を書き足す:

- **失敗の分析**: シナリオごとに、分類・根拠・次のアクション
- **性能の所見**: `perf: true` のシナリオと、API が 500ms を超えたリクエストについて、気になる点。前回のレポートが `e2e/reports/` にあれば比較する。

最後にユーザーへは、合否の件数・失敗の分類・レポートのパスだけを短く伝える。
