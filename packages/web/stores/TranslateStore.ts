const query = `#graphql
    query Translate($text: String!, $sourceLang: SourceLang!, $targetLang: TargetLang!) {
        translate(
            input: {text: $text, sourceLang: $sourceLang, targetLang: $targetLang}
        )
    }
`

const usageQuery = `#graphql
    query Translate {
        translateUsage {
            characterCount
            characterLimit
        }
    }
`

interface TranslateStoreState {
  input: string
  translateLoading: boolean
  translateResponse?: string

  usageLoading: boolean
  characterCount?: number
  characterLimit?: number
}

export const transleteStore = defineStore('translate', {
  state: (): TranslateStoreState => ({
    input: '',
    translateLoading: false,
    translateResponse: undefined,

    usageLoading: false,
    characterCount: undefined,
    characterLimit: undefined
  }),
  actions: {
    setInput(input: string) {
      this.input = input
    },
    async translate() {
      this.translateLoading = true
      const authStore = useAuthStore()

      const response = await $fetch<{ data: { translate: string } }>(
        'https://api.funtranslations.com/translate/yoda.json',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `${authStore.session.accessToken}`
          },
          body: {
            query,
            variables: { text: this.input, sourceLang: 'EN', targetLang: 'JA' }
          }
        }
      )

      this.translateResponse = response.data.translate
      this.translateLoading = false
    },
    async fetchUsage() {
      this.usageLoading = true
      const authStore = useAuthStore()

      const response = await $fetch<{
        data: {
          translateUsage: { characterCount: number; characterLimit: number }
        }
      }>('https://api.funtranslations.com/translate/yoda.json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${authStore.session.accessToken}`
        },
        body: { query: usageQuery }
      })

      this.characterCount = response.data.translateUsage.characterCount
      this.characterLimit = response.data.translateUsage.characterLimit
      this.usageLoading = false
    }
  }
})
