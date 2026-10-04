// 生成元: e2e/specs/catalog/product-list.md（e2e-run スキル）
import fixtures from '../../data/product-list.fixtures.json'
import { Header } from '../../pages/Header'
import { ProductListPage } from '../../pages/ProductListPage'
import { expect, test } from '../../support/fixtures'

const { D1, D2, D3, D4, D5, D6 } = fixtures.data
const PREFIX = 'E2E-PL-'

test.describe('商品一覧・検索', () => {
  test.describe('商品一覧・検索（未ログイン）', () => {
    test('S1: 商品名で検索すると、販売中の商品だけが表示される', { tag: '@smoke' }, async ({ page }) => {
      const list = new ProductListPage(page)
      await list.goto()
      await list.search(PREFIX)

      await expect(list.resultCount).toHaveText('3 件')
      expect(await list.visibleSkus()).toEqual([D2.sku, D3.sku, D4.sku])
      await expect(list.card(D5.sku)).toHaveCount(0)
      expect(new URL(page.url()).searchParams.get('q')).toBe(PREFIX)
    })

    test('S2: カテゴリと「在庫ありのみ」で絞り込むと、在庫切れの商品が除外される', async ({ page }) => {
      const list = new ProductListPage(page)
      await list.goto()
      await list.categorySelect.selectOption({ label: D1.name })
      await list.inStockCheckbox.check()
      await list.searchButton.click()

      await expect(list.resultCount).toHaveText('2 件')
      await expect(list.card(D2.sku)).toBeVisible()
      await expect(list.card(D3.sku)).toBeVisible()
      await expect(list.card(D4.sku)).toHaveCount(0)
    })

    test('S3: 在庫の状態によって、商品カードの表示が変わる', async ({ page }) => {
      const list = new ProductListPage(page)
      await list.goto(PREFIX)

      const soldOut = list.card(D4.sku)
      await expect(soldOut.getByTestId('sold-out-badge')).toHaveText('在庫切れ')
      await expect(soldOut.getByTestId('add-to-cart')).toBeDisabled()

      const lowStock = list.card(D3.sku)
      await expect(lowStock.getByTestId('low-stock-badge')).toHaveText(`残りわずか（${D3.stock} 点）`)
      await expect(lowStock.getByTestId('add-to-cart')).toBeEnabled()

      const normal = list.card(D2.sku)
      await expect(normal).toBeVisible()
      await expect(normal.getByTestId('sold-out-badge')).toHaveCount(0)
      await expect(normal.getByTestId('low-stock-badge')).toHaveCount(0)
    })

    test('S4: 未ログインでは、ヘッダーにログインへのリンクが出て、商品はカートに入れられる', async ({ page }) => {
      const header = new Header(page)
      const list = new ProductListPage(page)
      await list.goto(D2.name)

      await header.expectLoggedOut()
      await expect(header.logoutButton).toHaveCount(0)

      await list.card(D2.sku).getByTestId('add-to-cart').click()
      await expect(header.cartCount).toHaveText('1')
    })
  })

  test.describe('商品一覧・検索（ログイン済み）', () => {
    test.use({ loginAs: D6 })

    test('S5: ログイン済みでは、ヘッダーにユーザー名が出て、一覧の中身は未ログインと変わらない', async ({ page }) => {
      const header = new Header(page)
      const list = new ProductListPage(page)
      await list.goto(PREFIX)

      await header.expectLoggedInAs(D6.name)
      await expect(header.logoutButton).toBeVisible()
      await expect(header.loginLink).toHaveCount(0)

      // 一覧の中身は S1・S3 と同じ
      await expect(list.resultCount).toHaveText('3 件')
      expect(await list.visibleSkus()).toEqual([D2.sku, D3.sku, D4.sku])
      await expect(list.card(D5.sku)).toHaveCount(0)
      await expect(list.card(D4.sku).getByTestId('sold-out-badge')).toHaveText('在庫切れ')
      await expect(list.card(D4.sku).getByTestId('add-to-cart')).toBeDisabled()
      await expect(list.card(D3.sku).getByTestId('low-stock-badge')).toHaveText(`残りわずか（${D3.stock} 点）`)

      await list.card(D2.sku).getByTestId('add-to-cart').click()
      await expect(header.cartCount).toHaveText('1')
    })
  })
})
