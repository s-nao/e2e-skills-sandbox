<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { api, ApiError, yen } from '../api'
import { useAuth } from '../auth'
import { useCart } from '../cart'

const router = useRouter()
const cart = useCart()
const auth = useAuth()

const submitting = ref(false)
const error = ref('')

async function placeOrder() {
  submitting.value = true
  error.value = ''
  try {
    const order = await api.createOrder(cart.lines.map((l) => ({ product_id: l.product.id, quantity: l.quantity })))
    cart.clear()
    router.push(`/orders/complete/${order.id}`)
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) auth.expire()
    error.value = e instanceof ApiError ? e.message : '注文に失敗しました'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <h1>カート</h1>
  <p v-if="cart.lines.length === 0" data-testid="cart-empty">カートは空です</p>
  <template v-else>
    <table class="table" data-testid="cart-table">
      <thead>
        <tr><th>商品</th><th>単価</th><th>数量</th><th>小計</th></tr>
      </thead>
      <tbody>
        <tr v-for="l in cart.lines" :key="l.product.id" data-testid="cart-line" :data-sku="l.product.sku">
          <td>{{ l.product.name }}</td>
          <td>{{ yen(l.product.price) }}</td>
          <td>
            <input
              type="number"
              min="0"
              :value="l.quantity"
              data-testid="cart-quantity"
              @change="cart.setQuantity(l.product.id, Number(($event.target as HTMLInputElement).value))"
            />
          </td>
          <td>{{ yen(l.product.price * l.quantity) }}</td>
        </tr>
      </tbody>
    </table>
    <p class="price">合計 <span data-testid="cart-total">{{ yen(cart.total.value) }}</span></p>

    <div v-if="auth.state.user" class="row">
      <button :disabled="submitting" data-testid="place-order" @click="placeOrder">注文する</button>
    </div>
    <p v-else class="row">
      <RouterLink :to="{ path: '/login', query: { redirect: '/cart' } }" data-testid="login-to-order">ログインして注文する</RouterLink>
    </p>
    <p v-if="error" class="error" role="alert" data-testid="order-error">{{ error }}</p>
  </template>
</template>
