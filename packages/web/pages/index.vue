<template>
  <nuxt-link to="/login">Login</nuxt-link>

  <div>
    <button @click="handleSignOut">Sign Out</button>
    <p>user id: {{ authStore.session.useId }}</p>
    <p>username: {{ authStore.session.username }}</p>
  </div>
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
