<template>
  <h1>店舗管理</h1>
  <nav class="tabs">
    <RouterLink to="/products" data-testid="admin-tab-products">商品</RouterLink>
    <RouterLink to="/products/import" data-testid="admin-tab-import">CSV 一括登録</RouterLink>
    <RouterLink to="/sales" data-testid="admin-tab-sales">売り上げ</RouterLink>
  </nav>
  <RouterView />
</template>
