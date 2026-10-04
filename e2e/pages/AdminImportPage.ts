import type { Page } from '@playwright/test'

import { expect } from '../support/fixtures'

/** 管理画面の CSV 一括登録（/products/import） */
export class AdminImportPage {
  constructor(private readonly page: Page) {}

  get preview() {
    return this.page.getByTestId('import-preview')
  }
  get summary() {
    return this.page.getByTestId('import-summary')
  }
  get errorRows() {
    return this.page.getByTestId('import-error-row')
  }
  get apply() {
    return this.page.getByTestId('import-apply')
  }
  get done() {
    return this.page.getByTestId('import-done')
  }

  async goto() {
    await this.page.goto('/products/import')
    await expect(this.page.getByTestId('import-file')).toBeVisible()
  }

  /** CSV（UTF-8 の文字列）を選ぶと、確認結果（dry run）が表示される */
  async chooseCsv(csv: string) {
    await this.page.getByTestId('import-file').setInputFiles({
      name: 'products.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv, 'utf8'),
    })
    await expect(this.preview).toBeVisible()
  }
}
