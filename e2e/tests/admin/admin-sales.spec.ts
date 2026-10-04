// 生成元: e2e/specs/admin/admin-sales.md（e2e-run スキル）
import { request as apiRequest } from '@playwright/test'

import fixtures from '../../data/admin-sales.fixtures.json'
import { AdminSalesPage } from '../../pages/AdminSalesPage'
import { Header } from '../../pages/Header'
import { queryValue } from '../../support/db'
import { expect, test } from '../../support/fixtures'

const { D2, D3, D4, D5, D6, D7, D8, D9, D10 } = fixtures.data

const orderExists = (id: number) => queryValue(`SELECT count(*) FROM orders WHERE id = ${id}`)

test.describe('店舗管理画面の売り上げ確認と削除', () => {
  test.describe('管理者', () => {
    test.use({ loginAs: D3 })

    test('S1: 1 日の範囲で絞ると、日本時間でその日の注文だけが集計される', { tag: '@smoke' }, async ({ page }) => {
      const header = new Header(page)
      const sales = new AdminSalesPage(page)

      await sales.goto()
      await header.expectLoggedInAs(D3.name)
      await sales.show('2001-03-10')

      await expect(sales.count).toHaveText('2')
      await expect(sales.total).toHaveText('¥2,000')
      await expect(sales.rows).toHaveCount(2)
      await expect(sales.row(D5.id)).toBeVisible()
      await expect(sales.row(D6.id)).toBeVisible()
      // 日本時間では 3/11 の注文（UTC では 3/10）は含まれない
      await expect(sales.row(D7.id)).toHaveCount(0)
    })

    test('S2: 期間を広げると合計が増え、キャンセル済みは明細に出るが合計には入らない', async ({ page }) => {
      const sales = new AdminSalesPage(page)

      await sales.goto()
      await sales.show('2001-03-10', '2001-03-12')

      await expect(sales.count).toHaveText('3')
      await expect(sales.total).toHaveText('¥3,000')
      await expect(sales.rows).toHaveCount(4)
      await expect(sales.rows.nth(0)).toHaveAttribute('data-order-id', String(D8.id))
      await expect(sales.rows.nth(1)).toHaveAttribute('data-order-id', String(D7.id))
      await expect(sales.rows.nth(2)).toHaveAttribute('data-order-id', String(D6.id))
      await expect(sales.rows.nth(3)).toHaveAttribute('data-order-id', String(D5.id))
      await expect(sales.row(D8.id)).toContainText('キャンセル')
      await expect(sales.row(D7.id)).toContainText('注文済み')
    })

    test('S3: 該当する注文がない期間では 0 円・0 件と案内が表示される', async ({ page }) => {
      const sales = new AdminSalesPage(page)

      await sales.goto()
      await sales.show('2001-02-01', '2001-02-28')

      await expect(sales.count).toHaveText('0')
      await expect(sales.total).toHaveText('¥0')
      await expect(sales.empty).toHaveText('該当する注文はありません')
      await expect(sales.table).toHaveCount(0)
    })

    test('S4: 注文を削除すると、売り上げから消え、明細も一緒に消える（在庫は戻らない）', async ({ page }) => {
      const sales = new AdminSalesPage(page)
      const stock = () => queryValue(`SELECT stock FROM products WHERE id = ${D2.id}`)
      const stockBefore = stock()

      await sales.goto()
      await sales.show('2001-03-20')
      await expect(sales.count).toHaveText('1')
      await expect(sales.total).toHaveText('¥2,000')
      await expect(sales.row(D9.id)).toBeVisible()

      const dialogText = await sales.delete(D9.id)

      await expect(sales.message).toHaveText(`注文番号 ${D9.id} を削除しました`)
      expect(dialogText()).toBe(`注文番号 ${D9.id} の売り上げを削除しますか？（在庫は戻りません）`)
      await expect(sales.count).toHaveText('0')
      await expect(sales.total).toHaveText('¥0')
      await expect(sales.empty).toBeVisible()
      expect(orderExists(D9.id)).toBe('0')
      expect(queryValue(`SELECT count(*) FROM order_items WHERE order_id = ${D9.id}`)).toBe('0')
      expect(stock()).toBe(stockBefore)
      expect(orderExists(D10.id)).toBe('1')
    })

    test('S5: 確認ダイアログで取り消すと、注文は削除されない', async ({ page }) => {
      const sales = new AdminSalesPage(page)

      await sales.goto()
      await sales.show('2001-04-01')
      await expect(sales.row(D10.id)).toBeVisible()
      await sales.delete(D10.id, false)

      await expect(sales.row(D10.id)).toBeVisible()
      await expect(sales.message).toHaveCount(0)
      await expect(sales.count).toHaveText('1')
      expect(orderExists(D10.id)).toBe('1')
    })

    test('S6: 明細に購入者と商品・数量が表示される', async ({ page }) => {
      const sales = new AdminSalesPage(page)

      await sales.goto()
      await sales.show('2001-03-10')

      const row = sales.row(D5.id)
      await expect(row).toContainText(D4.name)
      await expect(row).toContainText(D4.email)
      await expect(row).toContainText(`${D2.name} × 3`)
      await expect(row.getByTestId('sales-row-total')).toHaveText('¥1,500')
    })
  })

  test.describe('一般ユーザー', () => {
    test.use({ loginAs: D4 })

    test('S7: 一般ユーザーと未ログインは売り上げを見られず、削除もできない', async ({ page, baseURL }) => {
      await page.goto('/sales')
      await expect(page).toHaveURL(/\/forbidden$/)
      await expect(page.getByTestId('forbidden-message')).toBeVisible()

      expect((await page.request.get('/api/admin/sales')).status()).toBe(403)
      expect((await page.request.delete(`/api/admin/sales/${D10.id}`)).status()).toBe(403)

      const anonymous = await apiRequest.newContext({ baseURL, storageState: { cookies: [], origins: [] } })
      expect((await anonymous.get('/api/admin/sales')).status()).toBe(401)
      await anonymous.dispose()

      expect(orderExists(D10.id)).toBe('1')
    })
  })
})
