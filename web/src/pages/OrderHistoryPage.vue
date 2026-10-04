<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { api, yen, type Order } from '../api'

const route = useRoute()
const router = useRouter()

const email = ref('')
const orders = ref<Order[] | null>(null)

watch(
  () => route.query.email,
  async (value) => {
    email.value = (value as string) ?? ''
    orders.value = email.value ? await api.orders(email.value) : null
  },
  { immediate: true },
)
</script>

<template>
  <h1>注文履歴</h1>
  <form class="row" @submit.prevent="router.push({ query: { email } })">
    <input v-model="email" type="email" required placeholder="メールアドレス" data-testid="history-email-input" />
    <button type="submit" data-testid="history-search">表示</button>
  </form>

  <p v-if="orders && orders.length === 0" data-testid="history-empty">注文はありません</p>
  <ul v-else-if="orders" class="orders" data-testid="order-list">
    <li v-for="o in orders" :key="o.id" class="card" data-testid="order-item" :data-order-id="o.id">
      <p><strong>注文番号 {{ o.id }}</strong> <span class="muted">{{ new Date(o.created_at).toLocaleString('ja-JP') }}</span></p>
      <ul>
        <li v-for="i in o.items" :key="i.product_id">{{ i.product_name }} × {{ i.quantity }}</li>
      </ul>
      <p class="price" data-testid="order-total">{{ yen(o.total) }}</p>
    </li>
  </ul>
</template>
