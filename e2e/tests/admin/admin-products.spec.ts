// 生成元: e2e/specs/admin/admin-products.md（e2e-run スキル）
import { request as apiRequest } from '@playwright/test'

import fixtures from '../../data/admin-products.fixtures.json'
import { AdminProductFormPage, AdminProductsPage } from '../../pages/AdminProductsPage'
import { Header } from '../../pages/Header'
import { LoginPage } from '../../pages/LoginPage'
import { queryValue } from '../../support/db'
import { expect, test } from '../../support/fixtures'

const { D1, D2, D3, D4, D5, D6, D7, D8, D10 } = fixtures.data

const productCount = () => Number(queryValue('SELECT count(*) FROM products'))
const productRow = (sku: string) =>
  queryValue(`SELECT price || ':' || stock || ':' || is_active || ':' || name FROM products WHERE sku = '${sku}'`)

test.describe('店舗管理画面の商品管理と権限', () => {
  test.describe('管理者', () => {
    test.use({ loginAs: D7 })

    test('S1: 商品を登録でき、一覧に出る', { tag: '@smoke' }, async ({ page }) => {
      const header = new Header(page)
      const form = new AdminProductFormPage(page)
      const list = new AdminProductsPage(page)

      await form.gotoNew()
      await header.expectLoggedInAs(D7.name)
      await form.fillNew({ sku: D10.sku, name: 'E2E-AP-新商品', category: D1.name, price: 1200, stock: 5 })
      await form.submit.click()

      await expect(page).toHaveURL(/\/products$/)
      await list.search(D10.sku)
      const row = list.row(D10.sku)
      await expect(row).toHaveCount(1)
      await expect(row).toContainText('E2E-AP-新商品')
      await expect(row).toContainText('¥1,200')
      await expect(row.getByTestId('admin-product-status')).toHaveText('販売中')
      expect(queryValue(`SELECT count(*) FROM products WHERE sku = '${D10.sku}'`)).toBe('1')
      expect(
        queryValue(`SELECT price || ':' || stock || ':' || is_active || ':' || category_id FROM products WHERE sku = '${D10.sku}'`),
      ).toBe(`1200:5:true:${D1.id}`)
    })

    test('S2: すでに使われている SKU では登録できない', async ({ page }) => {
      const form = new AdminProductFormPage(page)
      const before = productRow(D2.sku)

      await form.gotoNew()
      await form.fillNew({ sku: D2.sku, name: 'E2E-AP-重複', category: D1.name, price: 100, stock: 1 })
      await form.submit.click()

      await expect(form.error).toHaveText(`SKU「${D2.sku}」はすでに使われています`)
      await expect(page).toHaveURL(/\/products\/new$/)
      expect(queryValue(`SELECT count(*) FROM products WHERE sku = '${D2.sku}'`)).toBe('1')
      expect(productRow(D2.sku)).toBe(before)
    })

    test('S3: 商品を編集でき、一覧に反映される', { tag: '@smoke' }, async ({ page }) => {
      const list = new AdminProductsPage(page)
      const form = new AdminProductFormPage(page)

      await list.goto()
      await list.search(D2.sku)
      await list.edit(D2.sku)
      await expect(form.sku).toHaveValue(D2.sku)
      await expect(form.name).toHaveValue(D2.name)
      await expect(form.price).toHaveValue('1000')
      await expect(form.stock).toHaveValue('10')
      await expect(form.active).toBeChecked()

      await form.price.fill('1500')
      await form.stock.fill('3')
      await form.submit.click()

      await expect(page).toHaveURL(/\/products$/)
      await list.search(D2.sku)
      await expect(list.row(D2.sku)).toContainText('¥1,500')
      expect(productRow(D2.sku)).toBe(`1500:3:true:${D2.name}`)
    })

    test('S4: 注文履歴のない商品を削除できる', async ({ page }) => {
      const list = new AdminProductsPage(page)

      await list.goto()
      await list.search(D3.sku)
      await expect(list.row(D3.sku)).toHaveCount(1)
      const dialogText = await list.delete(D3.sku)

      await expect(list.message).toHaveText(`「${D3.name}」を削除しました`)
      expect(dialogText()).toBe(`「${D3.name}」を削除しますか？`)
      await expect(list.row(D3.sku)).toHaveCount(0)
      expect(queryValue(`SELECT count(*) FROM products WHERE sku = '${D3.sku}'`)).toBe('0')
    })

    test('S5: 注文履歴のある商品は削除できず、販売停止を案内される', async ({ page }) => {
      const list = new AdminProductsPage(page)
      const items = () => queryValue(`SELECT count(*) FROM order_items WHERE product_id = ${D4.id}`)
      const before = items()

      await list.goto()
      await list.search(D4.sku)
      await list.delete(D4.sku)

      await expect(list.error).toHaveText('注文履歴のある商品は削除できません。販売停止にしてください')
      await expect(list.row(D4.sku)).toHaveCount(1)
      expect(queryValue(`SELECT count(*) FROM products WHERE sku = '${D4.sku}'`)).toBe('1')
      expect(items()).toBe(before)
    })

    test('S6: 販売停止にした商品は、お客さん向けの一覧と詳細から消える', async ({ page }) => {
      const list = new AdminProductsPage(page)
      const form = new AdminProductFormPage(page)

      await list.goto()
      await list.search(D5.sku)
      await list.edit(D5.sku)
      await expect(form.active).toBeChecked()
      await form.active.uncheck()
      await form.submit.click()

      await expect(page).toHaveURL(/\/products$/)
      await list.search(D5.sku)
      await expect(list.row(D5.sku).getByTestId('admin-product-status')).toHaveText('販売停止')

      const shopList = await page.request.get(`/api/products?q=${encodeURIComponent(D5.name)}`)
      expect((await shopList.json()).total).toBe(0)
      expect((await page.request.get(`/api/products/${D5.id}`)).status()).toBe(404)
      expect(productRow(D5.sku)).toBe(`${D5.price}:${D5.stock}:false:${D5.name}`)
    })

    test('S7: 管理画面の検索は SKU でも商品名でもでき、販売停止の商品も出る', async ({ page }) => {
      const list = new AdminProductsPage(page)

      await list.goto()
      await list.search(D6.sku)
      await expect(list.row(D6.sku)).toHaveCount(1)
      await expect(list.row(D6.sku).getByTestId('admin-product-status')).toHaveText('販売停止')

      await list.search('停止中')
      await expect(list.row(D6.sku)).toHaveCount(1)
      await expect(list.row(D6.sku).getByTestId('admin-product-status')).toHaveText('販売停止')

      await list.search('E2E-AP-nothing')
      await expect(list.empty).toBeVisible()
      await expect(list.total).toHaveText('全 0 件')
    })

    test('S10: 管理者が管理画面のトップを開くと商品一覧に移り、3 つのタブが表示される', async ({ page }) => {
      const header = new Header(page)

      await page.goto('/')
      await header.expectLoggedInAs(D7.name)

      await expect(page).toHaveURL(/\/products$/)
      await expect(page.getByTestId('admin-tab-products')).toBeVisible()
      await expect(page.getByTestId('admin-tab-import')).toBeVisible()
      await expect(page.getByTestId('admin-tab-sales')).toBeVisible()
    })
  })

  test.describe('未ログイン', () => {
    test('S8: 未ログインで管理画面を開くとログイン画面へ移り、ログイン後に戻る', async ({ page }) => {
      const login = new LoginPage(page)
      const list = new AdminProductsPage(page)

      await page.goto('/products')
      await expect(page).toHaveURL(/\/login\?redirect=\/products$/)
      await login.login(D7)

      await expect(page).toHaveURL(/\/products$/)
      await expect(list.table).toBeVisible()
    })
  })

  test.describe('一般ユーザー', () => {
    test.use({ loginAs: D8 })

    test('S9: 一般ユーザーは管理画面も管理 API も使えない', async ({ page, baseURL }) => {
      const header = new Header(page)
      const before = productCount()
      const forbidden = '管理者のみ利用できます'

      await page.goto('/products')
      await expect(page).toHaveURL(/\/forbidden$/)
      await expect(page.getByTestId('forbidden-message')).toHaveText('このページは店舗管理者だけが利用できます')
      await header.expectLoggedInAs(D8.name)

      const get = await page.request.get('/api/admin/products')
      expect(get.status()).toBe(403)
      expect((await get.json()).detail).toBe(forbidden)
      const post = await page.request.post('/api/admin/products', {
        data: { sku: `${D4.sku}-X`, name: 'E2E-AP-不正', category_id: D1.id, price: 100, stock: 1 },
      })
      expect(post.status()).toBe(403)
      const del = await page.request.delete(`/api/admin/products/${D4.id}`)
      expect(del.status()).toBe(403)

      const anonymous = await apiRequest.newContext({ baseURL, storageState: { cookies: [], origins: [] } })
      expect((await anonymous.get('/api/admin/products')).status()).toBe(401)
      await anonymous.dispose()

      expect(productCount()).toBe(before)
      expect(queryValue(`SELECT count(*) FROM products WHERE id = ${D4.id}`)).toBe('1')
    })
  })
})
