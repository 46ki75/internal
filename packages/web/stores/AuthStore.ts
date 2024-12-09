import { defineStore } from 'pinia'

interface AuthState {
  username?: string
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    username: undefined
  }),
  actions: {
    setUsername(username: string) {
      this.username = username
    }
  }
})
