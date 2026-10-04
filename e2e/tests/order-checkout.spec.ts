// 生成元: e2e/specs/order-checkout.md（e2e-run スキル）
import fixtures from '../data/order-checkout.fixtures.json'
import { queryValue } from './db'
import { expect, test } from './fixtures'

const { D1, D2, D3, D4, D5, D6 } = fixtures.data
const PREFIX = 'E2E-OC-'

const card = (page: import('@playwright/test').Page, sku: string) =>
  page.locator(`[data-testid="product-card"][data-sku="${sku}"]`)

test('S1: 商品名で検索すると、販売中の商品だけが表示される', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('search-input').fill(PREFIX)
  await page.getByTestId('search-button').click()

  await expect(page.getByTestId('result-count')).toHaveText('3 件')
  const skus = await page.getByTestId('product-card').evaluateAll((els) => els.map((e) => e.getAttribute('data-sku')))
  expect(skus.sort()).toEqual([D2.sku, D3.sku, D4.sku])
  await expect(card(page, D5.sku)).toHaveCount(0)
  expect(new URL(page.url()).searchParams.get('q')).toBe(PREFIX)
})

test('S2: カテゴリと「在庫ありのみ」で絞り込むと、在庫切れの商品が除外される', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('category-select').selectOption({ label: D1.name })
  await page.getByTestId('in-stock-checkbox').check()
  await page.getByTestId('search-button').click()

  await expect(page.getByTestId('result-count')).toHaveText('2 件')
  await expect(card(page, D2.sku)).toBeVisible()
  await expect(card(page, D3.sku)).toBeVisible()
  await expect(card(page, D4.sku)).toHaveCount(0)
})

test('S3: 在庫の状態によって、商品カードの表示が変わる', async ({ page }) => {
  await page.goto(`/?q=${encodeURIComponent(PREFIX)}`)

  const soldOut = card(page, D4.sku)
  await expect(soldOut.getByTestId('sold-out-badge')).toHaveText('在庫切れ')
  await expect(soldOut.getByTestId('add-to-cart')).toBeDisabled()

  const lowStock = card(page, D3.sku)
  await expect(lowStock.getByTestId('low-stock-badge')).toHaveText(`残りわずか（${D3.stock} 点）`)
  await expect(lowStock.getByTestId('add-to-cart')).toBeEnabled()
})

test('S4: 商品詳細から数量を指定してカートに入れ、注文できる', async ({ page }) => {
  await page.goto(`/products/${D2.id}`)
  await page.getByTestId('quantity-input').fill('3')
  await page.getByTestId('add-to-cart').click()
  await expect(page.getByTestId('added-message')).toHaveText('カートに追加しました')
  await expect(page.getByTestId('cart-count')).toHaveText('3')

  await page.getByTestId('cart-link').click()
  await expect(page.getByTestId('cart-total')).toHaveText('¥1,500')
  await page.getByTestId('email-input').fill(D6.customer_email)
  await page.getByTestId('place-order').click()

  await expect(page.getByTestId('order-number')).toBeVisible()
  await expect(page.getByTestId('cart-count')).toHaveText('0')

  await page.getByTestId('to-history').click()
  await expect(page.getByTestId('order-item')).toHaveCount(1)
  await expect(page.getByTestId('order-total')).toHaveText('¥1,500')

  // DB: 在庫が 10 → 7、注文が 1 件（total 1500、明細 3 × 500）
  expect(queryValue(`SELECT stock FROM products WHERE id = ${D2.id}`)).toBe(String(D2.stock - 3))
  expect(
    queryValue(
      `SELECT count(*) || ':' || max(total) FROM orders WHERE customer_email = '${D6.customer_email}'`,
    ),
  ).toBe('1:1500')
  expect(
    queryValue(
      `SELECT oi.quantity || 'x' || oi.unit_price FROM order_items oi JOIN orders o ON o.id = oi.order_id
       WHERE o.customer_email = '${D6.customer_email}'`,
    ),
  ).toBe('3x500')
})

test('S5: 在庫より多く注文すると、エラーが表示され注文は作られない', async ({ page }) => {
  await page.goto(`/?q=${encodeURIComponent(D3.name)}`)
  await card(page, D3.sku).getByTestId('add-to-cart').click()

  await page.getByTestId('cart-link').click()
  await page.getByTestId('cart-quantity').fill('3')
  await page.getByTestId('cart-quantity').blur()
  await page.getByTestId('email-input').fill(D6.customer_email)
  await page.getByTestId('place-order').click()

  await expect(page.getByTestId('order-error')).toHaveText(
    `「${D3.name}」の在庫が不足しています（残り ${D3.stock} 点）`,
  )
  await expect(page.getByTestId('cart-line')).toHaveCount(1)

  // DB: 在庫は変わらず、D6 の注文は S4 の 1 件のまま
  expect(queryValue(`SELECT stock FROM products WHERE id = ${D3.id}`)).toBe(String(D3.stock))
  expect(queryValue(`SELECT count(*) FROM orders WHERE customer_email = '${D6.customer_email}'`)).toBe('1')
})

test('S6: 販売停止の商品の詳細ページを直接開くと「商品が見つかりません」と表示される', async ({ page }) => {
  await page.goto(`/products/${D5.id}`)
  await expect(page.getByTestId('error-message')).toHaveText('商品が見つかりません')
})
