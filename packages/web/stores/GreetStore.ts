import { useQuery } from '@vue/apollo-composable'
// import gql from 'graphql-tag'

import { graphql } from '../graphql'

export const useGreetStore = defineStore('greet', {
  state: () => {
    const GET_HELLO = graphql(`
      query SampleQuery {
        greet
      }
    `)

    const { result } = useQuery(GET_HELLO)

    return { result }
  },
  actions: {}
})
