<template>
  <nuxt-link to="/login">Login</nuxt-link>
  <button @click="handleSignOut">Sign Out</button>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const router = useRouter()
const handleSignOut = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<style scoped></style>
