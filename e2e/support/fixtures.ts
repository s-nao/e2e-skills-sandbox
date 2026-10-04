import { mkdirSync } from 'node:fs'
import path from 'node:path'

import { test as base, expect, request as apiRequest } from '@playwright/test'

type ApiTiming = { method: string; url: string; status: number; ms: number }

/** テストユーザー。fixtures.json の users のデータ（email と password を持つもの）をそのまま渡せる */
export type LoginUser = { email: string; password: string }

const AUTH_DIR = path.resolve(__dirname, '../.auth')

/**
 * 全テスト共通のフィクスチャ。
 *
 * ログイン:
 *   test.use({ loginAs: fixtures.data.D6 }) を書いたテストだけ、ログイン済みの状態で始まる。
 *   書かないテストは未ログイン。ログインは API で行い、ワーカーごとに 1 ユーザー 1 回だけ。
 *   ログイン画面そのものの動きは、loginAs を使わずに画面を操作してテストする。
 *
 * 計測（e2e-run スキルがレポートにまとめる）:
 * - API (/api/*) の応答時間 → `api-timings`
 * - ページのナビゲーション時間（TTFB / DOMContentLoaded / load）→ `nav-timings`
 * - console.error → `console-errors`
 * - /api/auth/me 以外で返った 401 → `auth-errors`（ログイン状態の問題を見つけやすくする）
 */
export const test = base.extend<
  { loginAs: LoginUser | null; perf: void },
  { authStates: Map<string, string> }
>({
  loginAs: [null, { option: true }],

  authStates: [async ({}, use) => use(new Map()), { scope: 'worker' }],

  storageState: async ({ loginAs, authStates, baseURL, storageState }, use, testInfo) => {
    if (!loginAs) return use(storageState)

    let file = authStates.get(loginAs.email)
    if (!file) {
      const api = await apiRequest.newContext({ baseURL })
      const res = await api.post('/api/auth/login', { data: { email: loginAs.email, password: loginAs.password } })
      if (!res.ok()) {
        throw new Error(
          `テストユーザー ${loginAs.email} でログインできません（${res.status()}）。` +
            'e2e-data-seed でユーザーを作成したか、パスワードと is_active を確認してください',
        )
      }
      mkdirSync(AUTH_DIR, { recursive: true })
      file = path.join(AUTH_DIR, `w${testInfo.workerIndex}-${loginAs.email}.json`)
      await api.storageState({ path: file })
      await api.dispose()
      authStates.set(loginAs.email, file)
    }
    await use(file)
  },

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

      // 未ログインかどうかの確認（/api/auth/me）が 401 になるのは正常なので除く
      const authErrors = apiTimings.filter((a) => a.status === 401 && !a.url.startsWith('/api/auth/me'))

      await testInfo.attach('api-timings', { body: JSON.stringify(apiTimings), contentType: 'application/json' })
      if (nav) await testInfo.attach('nav-timings', { body: JSON.stringify(nav), contentType: 'application/json' })
      if (consoleErrors.length)
        await testInfo.attach('console-errors', { body: JSON.stringify(consoleErrors), contentType: 'application/json' })
      if (authErrors.length)
        await testInfo.attach('auth-errors', { body: JSON.stringify(authErrors), contentType: 'application/json' })
    },
    { auto: true },
  ],
})

export { expect }
