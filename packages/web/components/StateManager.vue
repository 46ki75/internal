<script setup lang="ts">
const router = useRouter()
const authStore = useAuthStore()

onMounted(() => {
  window.setInterval(async () => {
    try {
      await authStore.refreshAccessToken()
      console.log('Access token refreshed.')
    } catch {
      window.alert('Session expired. Please sign in again.')
      router.push('/login')
    }
  }, 1000 * 60)
})
</script>

<style scoped lang="scss"></style>
