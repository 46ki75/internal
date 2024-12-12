import { useQuery } from '@vue/apollo-composable'
import gql from 'graphql-tag'

export const useGreetStore = defineStore('greet', {
  state: () => {
    const GET_HELLO = gql`
      query SampleQuery {
        greet
      }
    ` as unknown as any

    const { result } = useQuery(GET_HELLO)

    return { result }
  },
  actions: {}
})
