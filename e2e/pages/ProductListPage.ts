import type { Page } from '@playwright/test'

export class ProductListPage {
  constructor(private readonly page: Page) {}

  get searchInput() {
    return this.page.getByTestId('search-input')
  }
  get searchButton() {
    return this.page.getByTestId('search-button')
  }
  get categorySelect() {
    return this.page.getByTestId('category-select')
  }
  get inStockCheckbox() {
    return this.page.getByTestId('in-stock-checkbox')
  }
  get resultCount() {
    return this.page.getByTestId('result-count')
  }
  get cards() {
    return this.page.getByTestId('product-card')
  }

  async goto(query?: string) {
    await this.page.goto(query ? `/?q=${encodeURIComponent(query)}` : '/')
  }

  async search(keyword: string) {
    await this.searchInput.fill(keyword)
    await this.searchButton.click()
  }

  card(sku: string) {
    return this.page.locator(`[data-testid="product-card"][data-sku="${sku}"]`)
  }

  async visibleSkus(): Promise<string[]> {
    const skus = await this.cards.evaluateAll((els) => els.map((e) => e.getAttribute('data-sku') ?? ''))
    return skus.sort()
  }
}
