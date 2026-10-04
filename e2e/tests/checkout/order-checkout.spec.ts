// 生成元: e2e/specs/checkout/order-checkout.md（e2e-run スキル）
import fixtures from '../../data/order-checkout.fixtures.json'
import { CartPage } from '../../pages/CartPage'
import { Header } from '../../pages/Header'
import { LoginPage } from '../../pages/LoginPage'
import { ProductListPage } from '../../pages/ProductListPage'
import { queryValue } from '../../support/db'
import { expect, test } from '../../support/fixtures'

const { D1, D2, D3, D4, D5, D6 } = fixtures.data
const PREFIX = 'E2E-OC-'

const orderCount = () => Number(queryValue(`SELECT count(*) FROM orders WHERE user_id = ${D6.id}`))

test.describe('商品の検索と表示（未ログイン）', () => {
  test('S1: 商品名で検索すると、販売中の商品だけが表示される', async ({ page }) => {
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
  })

  test('S6: 販売停止の商品の詳細ページを直接開くと「商品が見つかりません」と表示される', async ({ page }) => {
    await page.goto(`/products/${D5.id}`)
    await expect(page.getByTestId('error-message')).toHaveText('商品が見つかりません')
  })
})

test.describe('注文（ログイン済み）', () => {
  test.use({ loginAs: D6 })

  test('S4: 商品詳細から数量を指定してカートに入れ、注文できる', { tag: '@smoke' }, async ({ page }) => {
    const header = new Header(page)
    const cart = new CartPage(page)

    await page.goto(`/products/${D2.id}`)
    await header.expectLoggedInAs(D6.name)
    await page.getByTestId('quantity-input').fill('3')
    await page.getByTestId('add-to-cart').click()
    await expect(page.getByTestId('added-message')).toHaveText('カートに追加しました')
    await expect(header.cartCount).toHaveText('3')

    await header.openCart()
    await expect(cart.total).toHaveText('¥1,500')
    await cart.placeOrder()

    await expect(page.getByTestId('order-number')).toBeVisible()
    await expect(header.cartCount).toHaveText('0')

    await page.getByTestId('to-history').click()
    await expect(page.getByTestId('order-item')).toHaveCount(1)
    await expect(page.getByTestId('order-total')).toHaveText('¥1,500')

    // DB: 在庫が 10 → 7、注文が 1 件（total 1500、明細 3 × 500）
    expect(queryValue(`SELECT stock FROM products WHERE id = ${D2.id}`)).toBe(String(D2.stock - 3))
    expect(queryValue(`SELECT count(*) || ':' || max(total) FROM orders WHERE user_id = ${D6.id}`)).toBe('1:1500')
    expect(
      queryValue(
        `SELECT oi.quantity || 'x' || oi.unit_price FROM order_items oi JOIN orders o ON o.id = oi.order_id
         WHERE o.user_id = ${D6.id}`,
      ),
    ).toBe('3x500')
  })

  test('S5: 在庫より多く注文すると、エラーが表示され注文は作られない', async ({ page }) => {
    const header = new Header(page)
    const list = new ProductListPage(page)
    const cart = new CartPage(page)
    const before = orderCount()

    await list.goto(D3.name)
    await list.card(D3.sku).getByTestId('add-to-cart').click()
    await header.openCart()
    await cart.setQuantity(3)
    await cart.placeOrder()

    await expect(cart.orderError).toHaveText(`「${D3.name}」の在庫が不足しています（残り ${D3.stock} 点）`)
    await expect(cart.lines).toHaveCount(1)

    // DB: 在庫は変わらず、注文も増えない
    expect(queryValue(`SELECT stock FROM products WHERE id = ${D3.id}`)).toBe(String(D3.stock))
    expect(orderCount()).toBe(before)
  })
})

test.describe('注文（未ログイン）', () => {
  test('S7: 未ログインではカートから注文できず、ログインするとカートに戻って注文できる状態になる', async ({ page }) => {
    const header = new Header(page)
    const cart = new CartPage(page)
    const login = new LoginPage(page)
    const before = orderCount()

    await page.goto(`/products/${D2.id}`)
    await header.expectLoggedOut()
    await page.getByTestId('add-to-cart').click()
    await header.openCart()

    // 未ログインの正しい挙動: 注文ボタンの代わりにログインへの導線が出る
    await expect(cart.loginToOrderLink).toHaveText('ログインして注文する')
    await expect(cart.placeOrderButton).toHaveCount(0)

    await cart.loginToOrderLink.click()
    await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)cart$/)
    await expect(login.requiredMessage).toBeVisible()

    await login.login(D6)
    await expect(page).toHaveURL(/\/cart$/)
    await expect(cart.lines).toHaveCount(1)
    await expect(cart.lines.first()).toHaveAttribute('data-sku', D2.sku)
    await expect(cart.placeOrderButton).toBeVisible()
    await header.expectLoggedInAs(D6.name)

    expect(orderCount()).toBe(before)
  })
})
