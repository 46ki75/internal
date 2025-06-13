import { useLocalStorage } from "@vueuse/core";

export const useConfigStore = defineStore("Config", {
  state() {
    const inWork = useLocalStorage("InWork", true);
    return { inWork };
  },
  actions: {
    toggleInWork() {
      this.inWork = !this.inWork;
    },
  },
});
