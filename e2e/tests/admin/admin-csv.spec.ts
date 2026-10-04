// 生成元: e2e/specs/admin/admin-csv.md（e2e-run スキル）
import fixtures from '../../data/admin-csv.fixtures.json'
import { AdminImportPage } from '../../pages/AdminImportPage'
import { Header } from '../../pages/Header'
import { queryValue } from '../../support/db'
import { expect, test } from '../../support/fixtures'

const { D1, D2, D3, D4, D5, D6, D7, D9 } = fixtures.data
const [NEW1, NEW2, NEW9, NEWC, NEWD, BAD] = D9.skus
const CAT = D1.name

const exists = (sku: string) => queryValue(`SELECT count(*) FROM products WHERE sku = '${sku}'`)
const row = (sku: string) =>
  queryValue(
    `SELECT name || '|' || description || '|' || price || '|' || stock || '|' || is_active FROM products WHERE sku = '${sku}'`,
  )

test.describe('店舗管理画面の CSV 一括登録・変更・削除', () => {
  test.describe('管理者', () => {
    test.use({ loginAs: D2 })

    test('S1: 新しい商品を CSV で登録できる（確認してから反映）', { tag: '@smoke' }, async ({ page }) => {
      const header = new Header(page)
      const imp = new AdminImportPage(page)

      await imp.goto()
      await header.expectLoggedInAs(D2.name)
      await imp.chooseCsv(
        [
          'sku,name,description,category,price,stock,is_active,action',
          `${NEW1},E2E-AC-新商品1,説明1,${CAT},300,10,true,`,
          `${NEW2},E2E-AC-新商品2,,${CAT},400,5,false,`,
        ].join('\n'),
      )

      await expect(imp.summary).toHaveText('登録 2 件 / 変更 0 件 / 削除 0 件')
      await expect(imp.errorRows).toHaveCount(0)
      await expect(imp.apply).toBeEnabled()
      // 確認の段階では書き込まれない
      expect(exists(NEW1)).toBe('0')
      expect(exists(NEW2)).toBe('0')

      await imp.apply.click()
      await expect(imp.done).toHaveText('反映しました（登録 2 件 / 変更 0 件 / 削除 0 件）')
      expect(row(NEW1)).toBe('E2E-AC-新商品1|説明1|300|10|true')
      expect(row(NEW2)).toBe('E2E-AC-新商品2||400|5|false')
    })

    test('S2: 既存の商品を CSV で変更でき、書かなかった列は変わらない', async ({ page }) => {
      const imp = new AdminImportPage(page)

      await imp.goto()
      await imp.chooseCsv(['sku,name,category,price,stock', `${D3.sku},E2E-AC-既存A改,${CAT},160,8`].join('\n'))
      await expect(imp.summary).toHaveText('登録 0 件 / 変更 1 件 / 削除 0 件')
      await imp.apply.click()

      await expect(imp.done).toHaveText('反映しました（登録 0 件 / 変更 1 件 / 削除 0 件）')
      // description と is_active（販売停止）は CSV に列が無いので保たれる
      expect(row(D3.sku)).toBe('E2E-AC-既存A改|E2E-AC-説明A|160|8|false')
      expect(exists(D3.sku)).toBe('1')
    })

    test('S3: action 列に delete と書いた行で商品を削除できる', async ({ page }) => {
      const imp = new AdminImportPage(page)

      await imp.goto()
      await imp.chooseCsv(['sku,name,category,price,stock,action', `${D4.sku},,,,,delete`].join('\n'))
      await expect(imp.summary).toHaveText('登録 0 件 / 変更 0 件 / 削除 1 件')
      expect(exists(D4.sku)).toBe('1')
      await imp.apply.click()

      await expect(imp.done).toHaveText('反映しました（登録 0 件 / 変更 0 件 / 削除 1 件）')
      expect(exists(D4.sku)).toBe('0')
    })

    test('S4: 注文履歴のある商品の削除行はエラーになり、反映できない', async ({ page }) => {
      const imp = new AdminImportPage(page)

      await imp.goto()
      await imp.chooseCsv(['sku,name,category,price,stock,action', `${D5.sku},,,,,delete`].join('\n'))

      await expect(imp.errorRows).toHaveCount(1)
      await expect(imp.errorRows.first()).toHaveText(
        `2 行目（${D5.sku}）: 注文履歴のある商品は削除できません（is_active を false にして販売停止にしてください）`,
      )
      await expect(imp.apply).toBeDisabled()
      expect(exists(D5.sku)).toBe('1')
    })

    test('S5: エラーの行が 1 つでもあれば、正しい行も含めて何も反映されない', async ({ page }) => {
      const imp = new AdminImportPage(page)
      const csv = [
        'sku,name,category,price,stock',
        `${NEW9},E2E-AC-新商品9,${CAT},300,1`,
        `${D6.sku},${D6.name},${CAT},999,99`,
        `${BAD},E2E-AC-不正,${CAT},abc,1`,
      ].join('\n')
      const before = row(D6.sku)

      await imp.goto()
      await imp.chooseCsv(csv)
      await expect(imp.errorRows).toHaveCount(1)
      await expect(imp.errorRows.first()).toHaveText(`4 行目（${BAD}）: price の値が正しくありません`)
      await expect(imp.summary).toHaveText('登録 1 件 / 変更 1 件 / 削除 0 件')
      await expect(imp.apply).toBeDisabled()

      // 画面を通さず API に直接反映を頼んでも、エラーがあれば何も書き込まれない
      const res = await page.request.post('/api/admin/products/import', { data: { csv, dry_run: false } })
      expect(res.status()).toBe(200)
      expect((await res.json()).errors).toHaveLength(1)
      expect(exists(NEW9)).toBe('0')
      expect(row(D6.sku)).toBe(before)
    })

    test('S6: 必須の列が足りない CSV はエラーになる', async ({ page }) => {
      const imp = new AdminImportPage(page)

      await imp.goto()
      await imp.chooseCsv(['sku,name,category,stock', `E2E-AC-X,名前,${CAT},1`].join('\n'))

      await expect(imp.errorRows).toHaveCount(1)
      await expect(imp.errorRows.first()).toHaveText('1 行目: 列 price がありません')
      await expect(imp.apply).toBeDisabled()
    })

    test('S7: 存在しないカテゴリ名の行はエラーになる', async ({ page }) => {
      const imp = new AdminImportPage(page)

      await imp.goto()
      await imp.chooseCsv(['sku,name,category,price,stock', `${NEWC},E2E-AC-新商品C,E2E-AC-無いカテゴリ,100,1`].join('\n'))

      await expect(imp.errorRows).toHaveCount(1)
      await expect(imp.errorRows.first()).toHaveText(`2 行目（${NEWC}）: category「E2E-AC-無いカテゴリ」が存在しません`)
      await expect(imp.apply).toBeDisabled()
      expect(exists(NEWC)).toBe('0')
    })

    test('S8: 同じ sku が CSV の中に 2 回あるとエラーになる', async ({ page }) => {
      const imp = new AdminImportPage(page)

      await imp.goto()
      await imp.chooseCsv(
        [
          'sku,name,category,price,stock',
          `${NEWD},E2E-AC-新商品D,${CAT},100,1`,
          `${NEWD},E2E-AC-新商品D2,${CAT},200,2`,
        ].join('\n'),
      )

      await expect(imp.errorRows).toHaveCount(1)
      await expect(imp.errorRows.first()).toHaveText(`3 行目（${NEWD}）: 同じ sku が CSV の中に複数あります`)
      await expect(imp.apply).toBeDisabled()
    })
  })

  test.describe('一般ユーザー', () => {
    test.use({ loginAs: D7 })

    test('S9: 一般ユーザーは CSV の取り込み API を使えない', async ({ page }) => {
      const before = queryValue('SELECT count(*) FROM products')
      const csv = ['sku,name,category,price,stock', `${NEWC},E2E-AC-新商品1,${CAT},300,10`].join('\n')

      const res = await page.request.post('/api/admin/products/import', { data: { csv, dry_run: false } })

      expect(res.status()).toBe(403)
      expect((await res.json()).detail).toBe('管理者のみ利用できます')
      expect(queryValue('SELECT count(*) FROM products')).toBe(before)
      expect(exists(NEWC)).toBe('0')
    })
  })
})
