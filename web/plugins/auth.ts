import { defineNuxtPlugin } from '#app'
import axios from 'axios'

export default defineNuxtPlugin({
  hooks: {
    'page:loading:end': async () => {
      const { setIsLoading, setIsLogin } = useAuthStore()
      const route = useRoute()
      const router = useRouter()
      try {
        setIsLoading(true)
        await axios.get('/api/auth/verify')
        setIsLogin(true)
      } catch {
        setIsLogin(false)
        if (route.fullPath !== '/login') router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }
  }
})
