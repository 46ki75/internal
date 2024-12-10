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
  session: {
    inSession?: boolean
    useId?: string
    username?: string
    accessToken?: string
    accessTokenExpiresAt?: number
    idToken?: string
    idTokenExpiresAt?: number
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
    session: {
      inSession: undefined,
      useId: undefined,
      username: undefined,
      accessToken: undefined,
      accessTokenExpiresAt: undefined,
      idToken: undefined,
      idTokenExpiresAt: undefined,
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
        const session = await fetchAuthSession({ forceRefresh: true })
        this.session.accessToken = session.tokens?.accessToken.toString()
        this.session.accessTokenExpiresAt =
          session.tokens?.accessToken.payload.exp
        this.session.idToken = session.tokens?.idToken?.toString()
        this.session.idTokenExpiresAt = session.tokens?.idToken?.payload.exp

        const response = await getCurrentUser()
        this.session.useId = response.userId
        this.session.username = response.username
        this.session.inSession = true
      } catch {
        this.session.useId = undefined
        this.session.username = undefined
        this.session.error = true
        this.session.inSession = false
      } finally {
        this.session.loading = false
      }
    }
  },
  getters: {
    accessTokenRemainSeconds(): number {
      const expireAt: number | undefined = this.session?.accessTokenExpiresAt
      if (!expireAt) return 0
      return new Date(expireAt).getTime() - Date.now() / 1000
    },
    idTokenRemainSeconds(): number {
      const expireAt: number | undefined = this.session?.idTokenExpiresAt
      if (!expireAt) return 0
      return new Date(expireAt).getTime() - Date.now() / 1000
    }
  }
})
