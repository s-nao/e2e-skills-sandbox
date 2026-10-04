import type { Page } from '@playwright/test'

import { expect } from '../support/fixtures'

/** 管理画面の商品一覧（/products） */
export class AdminProductsPage {
  constructor(private readonly page: Page) {}

  get searchInput() {
    return this.page.getByTestId('admin-search')
  }
  get message() {
    return this.page.getByTestId('admin-message')
  }
  get error() {
    return this.page.getByTestId('admin-error')
  }
  get empty() {
    return this.page.getByTestId('admin-products-empty')
  }
  get total() {
    return this.page.getByTestId('admin-products-total')
  }
  get table() {
    return this.page.getByTestId('admin-products-table')
  }

  row(sku: string) {
    return this.page.locator(`[data-testid=admin-product-row][data-sku="${sku}"]`)
  }

  async goto() {
    await this.page.goto('/products')
    await expect(this.page.getByTestId('admin-search')).toBeVisible()
  }

  async search(keyword: string) {
    await this.searchInput.fill(keyword)
    await this.page.getByTestId('admin-search-submit').click()
  }

  async edit(sku: string) {
    await this.row(sku).getByTestId('admin-edit').click()
  }

  /** 確認ダイアログの文言を返す。accept=false なら取り消す */
  async delete(sku: string, accept = true) {
    let text = ''
    this.page.once('dialog', async (dialog) => {
      text = dialog.message()
      await (accept ? dialog.accept() : dialog.dismiss())
    })
    await this.row(sku).getByTestId('admin-delete').click()
    return () => text
  }
}

/** 商品の登録・編集フォーム */
export class AdminProductFormPage {
  constructor(private readonly page: Page) {}

  get sku() {
    return this.page.getByTestId('form-sku')
  }
  get name() {
    return this.page.getByTestId('form-name')
  }
  get category() {
    return this.page.getByTestId('form-category')
  }
  get price() {
    return this.page.getByTestId('form-price')
  }
  get stock() {
    return this.page.getByTestId('form-stock')
  }
  get active() {
    return this.page.getByTestId('form-active')
  }
  get submit() {
    return this.page.getByTestId('form-submit')
  }
  get error() {
    return this.page.getByTestId('form-error')
  }

  async gotoNew() {
    await this.page.goto('/products/new')
    await expect(this.submit).toBeVisible()
  }

  async fillNew(v: { sku: string; name: string; category: string; price: number; stock: number }) {
    await this.sku.fill(v.sku)
    await this.name.fill(v.name)
    await this.category.selectOption({ label: v.category })
    await this.price.fill(String(v.price))
    await this.stock.fill(String(v.stock))
  }
}
