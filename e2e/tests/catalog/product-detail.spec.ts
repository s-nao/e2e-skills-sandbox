// 生成元: e2e/specs/catalog/product-detail.md（e2e-run スキル）
import fixtures from '../../data/product-detail.fixtures.json'
import { CartPage } from '../../pages/CartPage'
import { Header } from '../../pages/Header'
import { ProductDetailPage } from '../../pages/ProductDetailPage'
import { queryValue } from '../../support/db'
import { expect, test } from '../../support/fixtures'

const { D1, D2, D3, D4, D5 } = fixtures.data

test.describe('商品詳細', () => {
  test.describe('商品詳細（未ログイン）', () => {
    test('S1: 未ログインで商品詳細を開くと、商品の情報が表示され、ヘッダーにログインへのリンクが出る', async ({ page }) => {
      const header = new Header(page)
      const detail = new ProductDetailPage(page)
      await detail.goto(D2.id)

      await expect(detail.name).toHaveText(D2.name)
      await expect(detail.price).toHaveText('¥500')
      await expect(detail.stock).toHaveText(`在庫: ${D2.stock} 点`)
      await expect(page.getByText(`${D1.name} / ${D2.sku}`)).toBeVisible()
      await expect(detail.quantityInput).toHaveValue('1')
      await expect(detail.addToCartButton).toBeEnabled()
      await expect(detail.soldOutBadge).toHaveCount(0)
      await header.expectLoggedOut()
    })

    test('S2: 数量を指定してカートに入れると、カートに数量どおりの行ができる', { tag: '@smoke' }, async ({ page }) => {
      const header = new Header(page)
      const detail = new ProductDetailPage(page)
      const cart = new CartPage(page)
      await detail.goto(D2.id)
      await detail.addToCart(3)

      await expect(detail.addedMessage).toHaveText('カートに追加しました')
      await expect(header.cartCount).toHaveText('3')

      await header.openCart()
      await expect(cart.lines).toHaveCount(1)
      await expect(cart.lines.first()).toHaveAttribute('data-sku', D2.sku)
      await expect(page.getByTestId('cart-quantity')).toHaveValue('3')
      await expect(cart.total).toHaveText('¥1,500')

      // DB: カートはブラウザ内だけなので、在庫は減らない
      expect(queryValue(`SELECT stock FROM products WHERE id = ${D2.id}`)).toBe(String(D2.stock))
    })

    test('S3: 在庫切れの商品は「在庫切れ」と表示され、カートに入れられない', async ({ page }) => {
      const detail = new ProductDetailPage(page)
      await detail.goto(D3.id)

      await expect(detail.stock).toHaveText('在庫: 0 点')
      await expect(detail.soldOutBadge).toHaveText('在庫切れ')
      await expect(detail.addToCartButton).toHaveCount(0)
      await expect(detail.quantityInput).toHaveCount(0)
    })

    test('S4: 販売停止の商品の詳細ページを直接開くと「商品が見つかりません」と表示される', async ({ page }) => {
      const detail = new ProductDetailPage(page)
      await detail.goto(D4.id)

      await expect(detail.errorMessage).toHaveText('商品が見つかりません')
      await expect(page.getByTestId('product-detail')).toHaveCount(0)
    })
  })

  test.describe('商品詳細（ログイン済み）', () => {
    test.use({ loginAs: D5 })

    test('S5: ログイン済みでは、ヘッダーにユーザー名が出て、商品の表示とカートへの追加は未ログインと変わらない', async ({ page }) => {
      const header = new Header(page)
      const detail = new ProductDetailPage(page)
      await detail.goto(D2.id)

      await header.expectLoggedInAs(D5.name)
      await expect(header.logoutButton).toBeVisible()
      await expect(header.loginLink).toHaveCount(0)

      // 商品の表示は S1 と同じ
      await expect(detail.name).toHaveText(D2.name)
      await expect(detail.price).toHaveText('¥500')
      await expect(detail.stock).toHaveText(`在庫: ${D2.stock} 点`)

      await detail.addToCart(3)
      await expect(detail.addedMessage).toHaveText('カートに追加しました')
      await expect(header.cartCount).toHaveText('3')
    })
  })
})
