import type { ApolloError, ApolloQueryResult } from '@apollo/client'
import { useQuery } from '@vue/apollo-composable'
import { graphql } from '~/graphql'

import { SourceLang, TargetLang, type TranslateQuery } from '~/graphql/graphql'

const TRANSLATE = graphql(`
  query Translate(
    $text: String!
    $sourceLang: SourceLang!
    $targetLang: TargetLang!
  ) {
    translate(
      input: { text: $text, sourceLang: $sourceLang, targetLang: $targetLang }
    )
  }
`)

export const useTranslateStore = defineStore('translate', {
  state: () => {
    const { result, loading, error, refetch } = useQuery(
      TRANSLATE,
      {
        text: '',
        sourceLang: SourceLang.Ja,
        targetLang: TargetLang.En
      },
      {
        prefetch: false
      }
    )

    return {
      input: undefined as string | undefined,
      translateLoading: loading,
      translateResponse: result,
      translateError: error,
      _translate: refetch
    }
  },
  actions: {
    setInput(input: string) {
      this.input = input
    },
    async translate() {
      this._translate({
        text: this.input ?? '',
        sourceLang: SourceLang.Ja,
        targetLang: TargetLang.En
      })
    }
  }
})
