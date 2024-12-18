interface Typing {
  id: String
  text: String
  description: String
}

export const useTypingStore = defineStore('typing', {
  state: () => {
    return {
      typingList: [] as Typing[],
      loading: false,
      error: null as string | null
    }
  },

  actions: {
    async fetch() {
      this.loading = true

      const authStore = useAuthStore()

      try {
        const response = await $fetch<{ data: { typingList: Typing[] } }>(
          '/api/graphql',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authStore.session.idToken}`
            },
            body: JSON.stringify({
              query: /* GraphQL */ `
                query ListTyping {
                  typingList {
                    id
                    text
                    description
                  }
                }
              `
            })
          }
        )

        this.typingList = response.data.typingList
      } catch (error) {
        this.error = (error as Error)?.message
      } finally {
        this.loading = false
      }
    }
  }
})
