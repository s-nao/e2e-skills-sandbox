import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'

import App from './App.vue'
import CartPage from './pages/CartPage.vue'
import OrderCompletePage from './pages/OrderCompletePage.vue'
import OrderHistoryPage from './pages/OrderHistoryPage.vue'
import ProductDetailPage from './pages/ProductDetailPage.vue'
import ProductListPage from './pages/ProductListPage.vue'
import './style.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: ProductListPage },
    { path: '/products/:id', component: ProductDetailPage, props: true },
    { path: '/cart', component: CartPage },
    { path: '/orders/complete/:id', component: OrderCompletePage, props: true },
    { path: '/orders', component: OrderHistoryPage },
  ],
})

createApp(App).use(router).mount('#app')
