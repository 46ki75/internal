<template>
  <main class="main">
    <div class="center">
      <ToDo />
      <Bookmark />
      <BookmarkCreate />
    </div>
  </main>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const router = useRouter()

onMounted(async () => {
  await authStore.refreshAccessToken()

  if (!authStore.session.inSession) {
    router.push('/login')
  }
})
</script>

<style scoped lang="scss">
.main {
  display: flex;
  justify-content: center;
}

.center {
  width: 100%;
  max-width: 1000px;
}
</style>
