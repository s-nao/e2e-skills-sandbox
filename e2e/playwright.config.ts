import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  // ファイル（= 機能）同士は並列に流す。テストデータは機能ごとのプレフィックスで分かれているので干渉しない。
  // ファイルの中のテストは書いた順に 1 つのワーカーで流れる（fullyParallel: false）
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    // 要素が出てこないときに、テスト全体の制限時間（30 秒）まで待たずに失敗させる
    actionTimeout: 10_000,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', testIgnore: '**/admin/**', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'admin',
      testMatch: '**/admin/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'], baseURL: process.env.E2E_ADMIN_BASE_URL ?? 'http://localhost:5174' },
    },
  ],
})
