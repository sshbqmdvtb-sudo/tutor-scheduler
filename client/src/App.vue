<template>
  <router-view />
  <div v-if="toast.show" class="toast" :class="'toast-' + toast.type">{{ toast.message }}</div>
</template>

<script>
import { ref, provide } from 'vue'

export default {
  name: 'App',
  setup() {
    const toast = ref({ show: false, message: '', type: 'success' })
    let timer = null

    function showToast(message, type = 'success') {
      clearTimeout(timer)
      toast.value = { show: true, message, type }
      timer = setTimeout(() => { toast.value.show = false }, 2500)
    }

    provide('toast', showToast)
    return { toast }
  }
}
</script>
