<script setup lang="ts">
defineProps<{ id: string }>()
</script>

<template>
  <h1>ご注文ありがとうございました</h1>
  <p data-testid="order-number">注文番号: {{ id }}</p>
  <RouterLink to="/orders" data-testid="to-history">注文履歴を見る</RouterLink>
</template>
