import type { Page } from '@playwright/test'

import { expect } from '../support/fixtures'

export class CartPage {
  constructor(private readonly page: Page) {}

  get lines() {
    return this.page.getByTestId('cart-line')
  }
  get total() {
    return this.page.getByTestId('cart-total')
  }
  get placeOrderButton() {
    return this.page.getByTestId('place-order')
  }
  get loginToOrderLink() {
    return this.page.getByTestId('login-to-order')
  }
  get orderError() {
    return this.page.getByTestId('order-error')
  }

  async setQuantity(quantity: number, index = 0) {
    const input = this.page.getByTestId('cart-quantity').nth(index)
    await input.fill(String(quantity))
    await input.blur()
  }

  /**
   * 注文ボタンを押す。ボタンが無い（未ログインなど）ときは、操作のタイムアウトを待たずに
   * 「注文ボタンが表示されていない」という失敗にする。
   */
  async placeOrder() {
    await expect(this.placeOrderButton, '注文ボタンが表示されていません（未ログインの可能性）').toBeVisible()
    await this.placeOrderButton.click()
  }
}
