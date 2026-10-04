<script setup lang="ts">
import { useRouter } from 'vue-router'

import { useAuth } from './auth'
import { useCart } from './cart'

const router = useRouter()
const { count } = useCart()
const auth = useAuth()

async function logout() {
  await auth.logout()
  router.push('/')
}
</script>

<template>
  <header class="header">
    <RouterLink to="/" class="logo">Sample Shop</RouterLink>
    <nav>
      <RouterLink to="/orders">注文履歴</RouterLink>
      <RouterLink to="/cart" data-testid="cart-link">
        カート <span class="badge" data-testid="cart-count">{{ count }}</span>
      </RouterLink>
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
