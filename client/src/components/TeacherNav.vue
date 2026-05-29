<template>
  <div class="bottom-nav">
    <router-link to="/teacher/dashboard" :class="{ active: $route.path === '/teacher/dashboard' }">
      <span class="nav-icon">🏠</span>
      <span class="nav-label">首页</span>
    </router-link>
    <router-link to="/teacher/students" :class="{ active: $route.path.startsWith('/teacher/students') }">
      <span class="nav-icon">👥</span>
      <span class="nav-label">学生</span>
    </router-link>
    <router-link to="/teacher/records" :class="{ active: $route.path === '/teacher/records' }">
      <span class="nav-icon">📝</span>
      <span class="nav-label">记录</span>
    </router-link>
    <router-link to="/teacher/stats" :class="{ active: $route.path === '/teacher/stats' }">
      <span class="nav-icon">📊</span>
      <span class="nav-label">统计</span>
    </router-link>
    <router-link to="/teacher/settings" :class="{ active: $route.path === '/teacher/settings' }">
      <span class="nav-icon">⚙️</span>
      <span class="nav-label">设置</span>
    </router-link>
  </div>
</template>
