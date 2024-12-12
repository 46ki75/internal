import { useQuery } from '@vue/apollo-composable'
// import gql from 'graphql-tag'

import { graphql } from '../graphql'

const GET_HELLO = graphql(`
  query SampleQuery {
    greet
  }
`)

export const useGreetStore = defineStore('greet', {
  state: () => {
    const { result } = useQuery(GET_HELLO)

    return { result }
  },
  actions: {}
})
