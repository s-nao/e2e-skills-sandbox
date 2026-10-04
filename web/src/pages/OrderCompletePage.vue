<script setup lang="ts">
import { useRoute } from 'vue-router'

defineProps<{ id: string }>()
const route = useRoute()
</script>

<template>
  <h1>ご注文ありがとうございました</h1>
  <p data-testid="order-number">注文番号: {{ id }}</p>
  <RouterLink :to="{ path: '/orders', query: { email: route.query.email } }" data-testid="to-history">注文履歴を見る</RouterLink>
</template>
