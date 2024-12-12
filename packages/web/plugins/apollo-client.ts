import { defineNuxtPlugin } from '#app'
import { provideApolloClient } from '@vue/apollo-composable'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'

export const apolloClient = new ApolloClient({
  uri: 'http://localhost:20000/api/graphql',
  cache: new InMemoryCache()
})

export default defineNuxtPlugin((nuxtApp) => {
  // Provide the Apollo Client globally
  provideApolloClient(apolloClient)
})
