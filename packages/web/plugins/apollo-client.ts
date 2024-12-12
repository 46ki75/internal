import { defineNuxtPlugin } from '#app'
import { provideApolloClient } from '@vue/apollo-composable'
import { apolloClient } from '~/utils/apollo'

export default defineNuxtPlugin((nuxtApp) => {
  // Provide the Apollo Client globally
  provideApolloClient(apolloClient)
})
