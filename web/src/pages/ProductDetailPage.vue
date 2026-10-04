<script setup lang="ts">
import { ref, watch } from 'vue'

import { api, ApiError, yen, type Product } from '../api'
import { useCart } from '../cart'

const props = defineProps<{ id: string }>()
const cart = useCart()

const product = ref<Product | null>(null)
const quantity = ref(1)
const error = ref('')
const added = ref(false)

watch(
  () => props.id,
  async (id) => {
    error.value = ''
    product.value = null
    try {
      product.value = await api.product(Number(id))
    } catch (e) {
      error.value = e instanceof ApiError && e.status === 404 ? '商品が見つかりません' : '商品の取得に失敗しました'
    }
  },
  { immediate: true },
)

function addToCart() {
  if (!product.value) return
  cart.add(product.value, quantity.value)
  added.value = true
}
</script>

<template>
  <p v-if="error" class="error" role="alert" data-testid="error-message">{{ error }}</p>
  <article v-else-if="product" data-testid="product-detail">
    <h1 data-testid="product-name">{{ product.name }}</h1>
    <p class="muted">{{ product.category.name }} / {{ product.sku }}</p>
    <p>{{ product.description }}</p>
    <p class="price" data-testid="product-price">{{ yen(product.price) }}</p>
    <p data-testid="product-stock">在庫: {{ product.stock }} 点</p>

    <div v-if="product.stock > 0" class="row">
      <input v-model.number="quantity" type="number" min="1" :max="product.stock" data-testid="quantity-input" />
      <button data-testid="add-to-cart" @click="addToCart">カートに入れる</button>
    </div>
    <p v-else class="soldout" data-testid="sold-out-badge">在庫切れ</p>
    <p v-if="added" class="ok" data-testid="added-message">カートに追加しました</p>
  </article>
  <p v-else>読み込み中…</p>
</template>
