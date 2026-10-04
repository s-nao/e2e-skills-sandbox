import { test as base, expect } from '@playwright/test'

type ApiTiming = { method: string; url: string; status: number; ms: number }

/**
 * 全テスト共通のフィクスチャ。
 * - API (/api/*) の応答時間を記録し、テスト結果に `api-timings` として添付する
 * - ページのナビゲーション時間（TTFB / DOMContentLoaded / load）を `nav-timings` として添付する
 * - console.error を拾い、あれば `console-errors` として添付する
 * e2e-run スキルはこの添付を読んでレポートにまとめる。
 */
export const test = base.extend<{ perf: void }>({
  perf: [
    async ({ page }, use, testInfo) => {
      const apiTimings: ApiTiming[] = []
      const consoleErrors: string[] = []

      page.on('requestfinished', async (request) => {
        if (!request.url().includes('/api/')) return
        const response = await request.response()
        const t = request.timing()
        apiTimings.push({
          method: request.method(),
          url: new URL(request.url()).pathname + new URL(request.url()).search,
          status: response?.status() ?? 0,
          ms: Math.round(t.responseEnd - t.requestStart),
        })
      })
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text())
      })

      await use()

      const nav = await page
        .evaluate(() => {
          const [e] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
          return e
            ? {
                ttfb: Math.round(e.responseStart),
                domContentLoaded: Math.round(e.domContentLoadedEventEnd),
                load: Math.round(e.loadEventEnd),
              }
            : null
        })
        .catch(() => null)

      await testInfo.attach('api-timings', { body: JSON.stringify(apiTimings), contentType: 'application/json' })
      if (nav) await testInfo.attach('nav-timings', { body: JSON.stringify(nav), contentType: 'application/json' })
      if (consoleErrors.length)
        await testInfo.attach('console-errors', { body: JSON.stringify(consoleErrors), contentType: 'application/json' })
    },
    { auto: true },
  ],
})

export { expect }
