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

  inSession?: boolean
  isCheckSessionLoading: boolean
  isCheckSessionError: boolean

  isSignInLoading: boolean
  isSingInError: boolean
  signInStep?: string

  isSignOutLoading: boolean
  isSignOutError: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    useId: undefined,
    username: undefined,

    isCheckSessionLoading: false,
    isCheckSessionError: false,

    isSignInLoading: false,
    isSingInError: false,
    signInStep: undefined,

    inSession: undefined,
    isSignOutLoading: false,
    isSignOutError: false
  }),
  actions: {
    async signin({
      username,
      password
    }: {
      username: string
      password: string
    }) {
      this.isSignInLoading = true
      this.isSingInError = false
      try {
        configure()
        const response = await signIn({ username, password })
        this.signInStep = response.nextStep.signInStep
      } catch (e: any) {
        this.isSingInError = true
        throw new Error(e)
      } finally {
        this.isSignInLoading = false
      }
      await this.checkSession()
    },
    async signout() {
      this.isSignOutLoading = true
      this.isSignOutError = false
      configure()
      try {
        await signOut()
      } catch {
        this.isSignOutError = true
      } finally {
        this.isSignOutLoading = false
      }
      await this.checkSession()
    },
    async checkSession() {
      this.isCheckSessionLoading = true
      this.isCheckSessionError = false
      configure()

      try {
        await fetchAuthSession({ forceRefresh: true })
        const response = await getCurrentUser()
        this.useId = response.userId
        this.username = response.username
        this.inSession = true
      } catch {
        this.useId = undefined
        this.username = undefined
        this.isCheckSessionError = true
        this.inSession = false
      } finally {
        this.isCheckSessionLoading = false
      }
    }
  }
})
