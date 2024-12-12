import { defineNuxtPlugin } from '#app'
import { provideApolloClient } from '@vue/apollo-composable'
import {
  ApolloClient,
  InMemoryCache,
  createHttpLink
} from '@apollo/client/core'
import { persistCache, LocalStorageWrapper } from 'apollo3-cache-persist'

const cache = new InMemoryCache()

export default defineNuxtPlugin(async (nuxtApp) => {
  if (window?.localStorage != null) {
    await persistCache({
      cache,
      storage: new LocalStorageWrapper(window.localStorage)
    })

    const apolloClient = new ApolloClient({
      link: createHttpLink({
        uri: 'http://localhost:20000/api/graphql'
      }),
      cache
    })

    provideApolloClient(apolloClient)
  }
})
