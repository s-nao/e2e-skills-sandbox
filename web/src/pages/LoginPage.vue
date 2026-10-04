<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { ApiError } from '../api'
import { safeRedirect, useAuth } from '../auth'

const route = useRoute()
const router = useRouter()
const auth = useAuth()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const error = ref('')

async function submit() {
  submitting.value = true
  error.value = ''
  try {
    await auth.login(email.value, password.value)
    router.replace(safeRedirect(route.query.redirect))
  } catch (e) {
    error.value = e instanceof ApiError ? e.message : 'ログインに失敗しました'
    password.value = ''
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <h1>ログイン</h1>
  <p v-if="route.query.redirect" class="muted" data-testid="login-required-message">続けるにはログインしてください</p>
  <form class="login-form" data-testid="login-form" @submit.prevent="submit">
    <label>
      メールアドレス
      <input v-model="email" type="email" required autocomplete="username" data-testid="login-email" />
    </label>
    <label>
      パスワード
      <input v-model="password" type="password" required autocomplete="current-password" data-testid="login-password" />
    </label>
    <button type="submit" :disabled="submitting" data-testid="login-submit">ログイン</button>
  </form>
  <p v-if="error" class="error" role="alert" data-testid="login-error">{{ error }}</p>
</template>
