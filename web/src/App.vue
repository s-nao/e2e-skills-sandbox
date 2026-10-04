<script setup lang="ts">
import { useCart } from './cart'

const { count } = useCart()
</script>

<template>
  <header class="header">
    <RouterLink to="/" class="logo">Sample Shop</RouterLink>
    <nav>
      <RouterLink to="/orders">注文履歴</RouterLink>
      <RouterLink to="/cart" data-testid="cart-link">
        カート <span class="badge" data-testid="cart-count">{{ count }}</span>
      </RouterLink>
    </nav>
  </header>
  <main class="main">
    <RouterView />
  </main>
</template>
