import { TypingRepositoryImpl } from "~/repository/TypingRepository";

interface Typing {
  id: String;
  text: String;
  description: String;
}

const typingRepository = new TypingRepositoryImpl();

export const useTypingStore = defineStore("typing", {
  state: () => {
    return {
      typingList: [] as Typing[],
      loading: false,
      error: null as string | null,
      text: "",
      description: "string",
    };
  },

  actions: {
    setText(text: string) {
      this.text = text;
    },

    setDescription(description: string) {
      this.description = description;
    },

    async fetch() {
      this.loading = true;

      const authStore = useAuthStore();
      await authStore.refreshIfNeed();

      try {
        const response = await typingRepository.list();

        this.typingList = response;
      } catch (error) {
        this.error = (error as Error)?.message;
      } finally {
        this.loading = false;
      }
    },

    async upsert() {
      this.loading = true;

      const authStore = useAuthStore();
      await authStore.refreshIfNeed();

      try {
        const response = await typingRepository.upsert({
          accessToken: `${authStore.session.accessToken}`,
          text: this.text,
          description: this.description,
        });

        this.typingList = [...this.typingList, response];
      } catch (error) {
        this.error = (error as Error)?.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
