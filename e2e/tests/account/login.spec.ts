// 生成元: e2e/specs/account/login.md（e2e-run スキル）
import fixtures from '../../data/login.fixtures.json'
import { Header } from '../../pages/Header'
import { LoginPage } from '../../pages/LoginPage'
import { queryValue } from '../../support/db'
import { expect, test } from '../../support/fixtures'

const { D1, D2, D3, D4 } = fixtures.data
const LOGIN_FAILED = 'メールアドレスまたはパスワードが正しくありません'

const sessionCount = (userId: number) => Number(queryValue(`SELECT count(*) FROM sessions WHERE user_id = ${userId}`))

test.describe('ログイン・ログアウト', () => {
  test.describe('ログイン画面（未ログイン）', () => {
    test('S1: 正しいメールアドレスとパスワードでログインできる', { tag: '@smoke' }, async ({ page }) => {
      const login = new LoginPage(page)
      const header = new Header(page)
      const before = sessionCount(D1.id)

      await login.goto()
      await login.login(D1)

      await expect(page).toHaveURL(/\/$/)
      await header.expectLoggedInAs(D1.name)
      await expect(header.logoutButton).toBeVisible()
      await expect(header.loginLink).toHaveCount(0)
      expect(sessionCount(D1.id)).toBe(before + 1)
    })

    test('S2: パスワードを間違えるとエラーが表示され、ログインできない', async ({ page }) => {
      const login = new LoginPage(page)
      const header = new Header(page)
      const before = sessionCount(D1.id)

      await login.goto()
      await login.login({ email: D1.email, password: 'wrong-password' })

      await expect(login.error).toHaveText(LOGIN_FAILED)
      await expect(page).toHaveURL(/\/login$/)
      await expect(login.password).toHaveValue('')
      await header.expectLoggedOut()
      expect(sessionCount(D1.id)).toBe(before)
    })

    test('S3: 存在しないメールアドレスでは、パスワード誤りと同じエラーになる', async ({ page }) => {
      expect(D4.exists, 'D4 は存在しないユーザーのはずが、DB に行がある（seed をやり直す）').toBe(false)
      const login = new LoginPage(page)

      await login.goto()
      await login.login(D4)

      await expect(login.error).toHaveText(LOGIN_FAILED)
    })

    test('S4: 停止中のユーザーは、正しいパスワードでもログインできない', async ({ page }) => {
      const login = new LoginPage(page)

      await login.goto()
      await login.login(D2)

      await expect(login.error).toHaveText(LOGIN_FAILED)
      expect(sessionCount(D2.id)).toBe(0)
    })

    test('S5: ログインが必要な画面を未ログインで開くとログイン画面に移り、ログイン後に元の画面へ戻る', async ({ page }) => {
      const login = new LoginPage(page)

      await page.goto('/orders')
      await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)orders$/)
      await expect(login.requiredMessage).toHaveText('続けるにはログインしてください')

      await login.login(D1)
      await expect(page).toHaveURL(/\/orders$/)
      await expect(page.getByTestId('history-empty')).toHaveText('注文はありません')
    })

    test('S8: ログイン後の戻り先に外部サイトを指定されても、サイトの外へは移らない', async ({ page, baseURL }) => {
      const login = new LoginPage(page)

      await login.goto('//evil.example.com/')
      await login.login(D1)

      await expect(page).toHaveURL(new URL('/', baseURL).href)
      await new Header(page).expectLoggedInAs(D1.name)
    })
  })

  test.describe('ログイン済み（D1）', () => {
    test.use({ loginAs: D1 })

    test('S6: ログイン済みでログイン画面を開くと、トップページに移る', async ({ page }) => {
      await page.goto('/login')

      await expect(page).toHaveURL(/\/$/)
      await new Header(page).expectLoggedInAs(D1.name)
      await expect(page.getByTestId('login-form')).toHaveCount(0)
    })

    test('S9: ログインした状態は、ページを再読み込みしても保たれる', async ({ page }) => {
      const header = new Header(page)

      await page.goto('/')
      await header.expectLoggedInAs(D1.name)
      await page.reload()
      await header.expectLoggedInAs(D1.name)
    })
  })

  test.describe('ログアウト（D3 専用。セッションが消えるので他と共有しない）', () => {
    test.use({ loginAs: D3 })

    test('S7: ログアウトすると未ログインの状態に戻り、ログインが必要な画面は開けなくなる', async ({ page }) => {
      const header = new Header(page)

      await page.goto('/')
      await header.expectLoggedInAs(D3.name)
      const before = sessionCount(D3.id)

      await expect(header.logoutButton).toBeVisible()
      await header.logoutButton.click()
      await expect(page).toHaveURL(/\/$/)
      await header.expectLoggedOut()

      await page.goto('/orders')
      await expect(page).toHaveURL(/\/login\?redirect=(%2F|\/)orders$/)
      expect(sessionCount(D3.id)).toBe(before - 1)
    })
  })
})
