import type { Page } from '@playwright/test'

import { expect } from '../support/fixtures'

/** 管理画面の売り上げ（/sales） */
export class AdminSalesPage {
  constructor(private readonly page: Page) {}

  get count() {
    return this.page.getByTestId('sales-count')
  }
  get total() {
    return this.page.getByTestId('sales-total')
  }
  get rows() {
    return this.page.getByTestId('sales-row')
  }
  get empty() {
    return this.page.getByTestId('sales-empty')
  }
  get table() {
    return this.page.getByTestId('sales-table')
  }
  get message() {
    return this.page.getByTestId('sales-message')
  }

  row(orderId: number) {
    return this.page.locator(`[data-testid=sales-row][data-order-id="${orderId}"]`)
  }

  async goto() {
    await this.page.goto('/sales')
    await expect(this.total).toBeVisible()
  }

  /** 期間（YYYY-MM-DD）を入れて表示する。to を省くと from と同じ日 */
  async show(from: string, to = from) {
    await this.page.getByTestId('sales-from').fill(from)
    await this.page.getByTestId('sales-to').fill(to)
    await this.page.getByTestId('sales-search').click()
  }

  async delete(orderId: number, accept = true) {
    let text = ''
    this.page.once('dialog', async (dialog) => {
      text = dialog.message()
      await (accept ? dialog.accept() : dialog.dismiss())
    })
    await this.row(orderId).getByTestId('sales-delete').click()
    return () => text
  }
}
