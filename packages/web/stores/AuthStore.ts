import { defineStore } from 'pinia'

import { Amplify } from 'aws-amplify'
import {
  fetchAuthSession,
  getCurrentUser,
  signIn,
  signOut
} from 'aws-amplify/auth'

const configure = () => {
  const config = useRuntimeConfig()

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.public.USER_POOL_ID,
        userPoolClientId: config.public.USER_POOL_CLIENT_ID
      }
    }
  })
}

interface AuthState {
  useId?: string
  username?: string

  session: {
    inSession?: boolean
    loading: boolean
    error: boolean
  }

  signIn: {
    loading: boolean
    error: boolean
  }

  signOut: {
    loading: boolean
    error: boolean
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    useId: undefined,
    username: undefined,

    session: {
      inSession: undefined,
      loading: false,
      error: false
    },

    signIn: {
      loading: false,
      error: false
    },

    signOut: {
      loading: false,
      error: false
    }
  }),
  actions: {
    async signin({
      username,
      password
    }: {
      username: string
      password: string
    }) {
      this.signIn.loading = true
      this.signIn.error = false
      try {
        configure()
        const _ = await signIn({ username, password })
      } catch (e: any) {
        this.signIn.error = true
        throw new Error(e)
      } finally {
        this.signIn.loading = false
      }
      await this.checkSession()
    },
    async signOut() {
      this.signOut.loading = true
      this.signOut.error = false
      configure()
      try {
        await signOut()
      } catch {
        this.signOut.error = true
      } finally {
        this.signOut.loading = false
      }
      await this.checkSession()
    },
    async checkSession() {
      this.session.loading = true
      this.session.error = false
      configure()

      try {
        await fetchAuthSession({ forceRefresh: true })
        const response = await getCurrentUser()
        this.useId = response.userId
        this.username = response.username
        this.session.inSession = true
      } catch {
        this.useId = undefined
        this.username = undefined
        this.session.error = true
        this.session.inSession = false
      } finally {
        this.session.loading = false
      }
    }
  }
})
