import type { Page } from '@playwright/test'

import { expect, type LoginUser } from '../support/fixtures'

export class LoginPage {
  constructor(private readonly page: Page) {}

  get email() {
    return this.page.getByTestId('login-email')
  }
  get password() {
    return this.page.getByTestId('login-password')
  }
  get submit() {
    return this.page.getByTestId('login-submit')
  }
  get error() {
    return this.page.getByTestId('login-error')
  }
  get requiredMessage() {
    return this.page.getByTestId('login-required-message')
  }

  async goto(redirect?: string) {
    await this.page.goto(redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login')
  }

  /** 画面を操作してログインする。ログイン済みで始めたいだけのテストは、これではなく test.use({ loginAs }) を使う */
  async login(user: LoginUser) {
    await expect(this.submit).toBeVisible()
    await this.email.fill(user.email)
    await this.password.fill(user.password)
    await this.submit.click()
  }
}
