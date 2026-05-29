<template>
  <div class="bottom-nav">
    <router-link to="/student/schedule" :class="{ active: $route.path === '/student/schedule' }">
      <span class="nav-icon">📅</span>
      <span class="nav-label">课表</span>
    </router-link>
    <router-link to="/student/records" :class="{ active: $route.path === '/student/records' }">
      <span class="nav-icon">📝</span>
      <span class="nav-label">记录</span>
    </router-link>
    <router-link to="/student/fees" :class="{ active: $route.path === '/student/fees' }">
      <span class="nav-icon">💰</span>
      <span class="nav-label">费用</span>
    </router-link>
  </div>
</template>
