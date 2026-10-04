<script setup lang="ts">
import { useRouter } from 'vue-router'

import { useAuth } from './auth'

const router = useRouter()
const auth = useAuth()

async function logout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <header class="header">
    <RouterLink to="/" class="logo">Sample Shop 店舗管理</RouterLink>
    <nav>
      <template v-if="auth.state.user">
        <span class="muted" data-testid="user-name">{{ auth.state.user.name }} さん</span>
        <button class="link-button" data-testid="logout-button" @click="logout">ログアウト</button>
      </template>
      <RouterLink v-else-if="auth.state.loaded" to="/login" data-testid="login-link">ログイン</RouterLink>
    </nav>
  </header>
  <main class="main">
    <RouterView />
  </main>
</template>
