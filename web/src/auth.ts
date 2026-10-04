import { reactive } from 'vue'

import { api, ApiError, type User } from './api'

// ログイン状態。Cookie は HttpOnly なので JS からは読めず、/api/auth/me で確かめる
const state = reactive<{ user: User | null; loaded: boolean }>({ user: null, loaded: false })
let loading: Promise<void> | null = null

export function useAuth() {
  return {
    state,
    /** 初回だけ /api/auth/me を呼ぶ。ルーターのガードから毎回呼んでよい */
    ensureLoaded(): Promise<void> {
      if (state.loaded) return Promise.resolve()
      loading ??= api
        .me()
        .then((user) => {
          state.user = user
        })
        .catch((e) => {
          if (!(e instanceof ApiError && e.status === 401)) throw e
        })
        .finally(() => {
          state.loaded = true
        })
      return loading
    },
    async login(email: string, password: string) {
      state.user = await api.login(email, password)
    },
    async logout() {
      await api.logout()
      state.user = null
    },
    /** API が 401 を返したとき（セッション切れ）に呼ぶ */
    expire() {
      state.user = null
    },
  }
}

/** ログイン後の戻り先。外部サイトへのリダイレクトに使われないよう、サイト内のパスだけを許す */
export function safeRedirect(value: unknown): string {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/'
}
