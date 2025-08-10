import { TypingRepositoryImpl } from "~/repository/TypingRepository";

interface Typing {
  id: string;
  text: string;
  description: string;
}

const typingRepository = new TypingRepositoryImpl();

export const useTypingStore = defineStore("typing", {
  state: () => {
    return {
      typingList: [] as Typing[],
      loading: false,
      error: null as string | null,
      id: "",
      text: "",
      description: "string",
    };
  },

  actions: {
    setId(id: string) {
      this.id = id;
    },

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
        const response = await typingRepository.list({
          accessToken: `${authStore.session.accessToken}`,
        });

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
          id: this.id.trim() === "" ? null : this.id.trim(),
          text: this.text,
          description: this.description,
        });

        await this.fetch();
      } catch (error) {
        this.error = (error as Error)?.message;
      } finally {
        this.loading = false;
      }
    },

    async delete(id: string) {
      this.loading = true;

      const authStore = useAuthStore();
      await authStore.refreshIfNeed();

      try {
        const response = await typingRepository.delete({
          accessToken: `${authStore.session.accessToken}`,
          id,
        });

        await this.fetch();
      } catch (error) {
        this.error = (error as Error)?.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
