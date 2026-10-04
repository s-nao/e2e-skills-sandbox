import { computed, reactive, watch } from 'vue'

import type { Product } from './api'

export type CartLine = { product: Product; quantity: number }

const STORAGE_KEY = 'sample-shop-cart'

function load(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

const lines = reactive<CartLine[]>(load())
watch(lines, () => localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)), { deep: true })

export function useCart() {
  return {
    lines,
    count: computed(() => lines.reduce((sum, l) => sum + l.quantity, 0)),
    total: computed(() => lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0)),
    add(product: Product, quantity = 1) {
      const line = lines.find((l) => l.product.id === product.id)
      if (line) line.quantity += quantity
      else lines.push({ product, quantity })
    },
    setQuantity(productId: number, quantity: number) {
      const index = lines.findIndex((l) => l.product.id === productId)
      if (index === -1) return
      if (quantity <= 0) lines.splice(index, 1)
      else lines[index].quantity = quantity
    },
    clear() {
      lines.splice(0)
    },
  }
}
