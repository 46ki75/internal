import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isLogin: false,
    isLoading: true
  }),
  actions: {
    setIsLogin(flag: boolean) {
      this.isLogin = flag
    },
    setIsLoading(flag: boolean) {
      this.isLoading = flag
    }
  }
})
