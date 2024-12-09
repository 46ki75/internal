<template>
  <div>USER</div>
  <div>{{ authStore.username }}</div>
</template>

<script setup lang="ts">
import { useAuthStore } from '#build/imports'

const authStore = useAuthStore()

onMounted(() => {
  authStore.setUsername('SHIRAYUKI')
})
</script>

<style scoped></style>
