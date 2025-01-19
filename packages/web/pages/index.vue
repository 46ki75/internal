<template>
  <main class="main">
    <div class="center">
      <div>
        <Bookmark />
      </div>

      <div>
        <ToDo />
        <Routine />
      </div>
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
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  flex-wrap: wrap;
  width: 100%;
  margin-block-end: 20rem;
  gap: 0.5rem;

  @media screen and (max-width: 1200px) {
    flex-direction: column;
  }

  div {
    flex: 1;
  }
}
</style>
