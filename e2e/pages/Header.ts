import type { Page } from '@playwright/test'

import { expect } from '../support/fixtures'

/** 全画面に共通のヘッダー */
export class Header {
  constructor(private readonly page: Page) {}

  get cartLink() {
    return this.page.getByTestId('cart-link')
  }
  get cartCount() {
    return this.page.getByTestId('cart-count')
  }
  get userName() {
    return this.page.getByTestId('user-name')
  }
  get loginLink() {
    return this.page.getByTestId('login-link')
  }
  get logoutButton() {
    return this.page.getByTestId('logout-button')
  }

  async expectLoggedInAs(name: string) {
    await expect(this.userName).toHaveText(`${name} さん`)
  }

  async expectLoggedOut() {
    await expect(this.loginLink).toBeVisible()
    await expect(this.userName).toHaveCount(0)
  }

  async openCart() {
    await this.cartLink.click()
    await expect(this.page).toHaveURL(/\/cart$/)
  }
}
