import { ApolloClient, InMemoryCache } from '@apollo/client/core'

export const apolloClient = new ApolloClient({
  uri: 'http://localhost:20000/api/graphql',
  cache: new InMemoryCache()
})
