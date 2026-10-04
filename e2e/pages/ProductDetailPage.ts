import type { Page } from '@playwright/test'

export class ProductDetailPage {
  constructor(private readonly page: Page) {}

  get name() {
    return this.page.getByTestId('product-name')
  }
  get price() {
    return this.page.getByTestId('product-price')
  }
  get stock() {
    return this.page.getByTestId('product-stock')
  }
  get quantityInput() {
    return this.page.getByTestId('quantity-input')
  }
  get addToCartButton() {
    return this.page.getByTestId('add-to-cart')
  }
  get addedMessage() {
    return this.page.getByTestId('added-message')
  }
  get soldOutBadge() {
    return this.page.getByTestId('sold-out-badge')
  }
  get errorMessage() {
    return this.page.getByTestId('error-message')
  }

  async goto(id: number) {
    await this.page.goto(`/products/${id}`)
  }

  async addToCart(quantity: number) {
    await this.quantityInput.fill(String(quantity))
    await this.addToCartButton.click()
  }
}
