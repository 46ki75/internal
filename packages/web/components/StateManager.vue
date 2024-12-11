<template>
  <div class="fix" v-if="refreshing">
    <ElmDotLoadingIcon /> <ElmInlineText text="アクセストークンを更新中" />
  </div>
</template>

<script setup lang="ts">
import { ElmDotLoadingIcon, ElmInlineText } from '@elmethis/core'

const router = useRouter()
const authStore = useAuthStore()

const refreshing = ref(false)

onMounted(() => {
  window.setInterval(async () => {
    try {
      refreshing.value = true
      await authStore.refreshAccessToken()
      console.log('Access token refreshed.')
    } catch {
      window.alert('Session expired. Please sign in again.')
      router.push('/login')
    } finally {
      refreshing.value = false
    }
  }, 1000 * 60)
})
</script>

<style scoped lang="scss">
.fix {
  margin: 0.5rem;
  position: fixed;
  bottom: 0;
  right: 0;
}
</style>
