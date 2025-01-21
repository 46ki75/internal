<template>
  <transition>
    <div class="fix" v-if="refreshing">
      <ElmDotLoadingIcon /><ElmInlineText text="アクセストークンを更新中" />
    </div>
  </transition>
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
.v-enter-to,
.v-leave-from {
  opacity: 1;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 300ms;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}

.fix {
  margin: 0.5rem;
  position: fixed;
  bottom: 0;
  right: 0;
}
</style>
