import { defineStore } from "pinia";
import { uniqBy } from "lodash-es";
import { z } from "zod";
import Fuse from "fuse.js";
import { useLocalStorage } from "@vueuse/core";
import type { components } from "~/openapi/schema";
import { openApiClient } from "~/openapi/client";

export type Bookmark = components["schemas"]["BookmarkResponse"];

interface BookmarkState {
  loading: boolean;
  error: string | null;

  bookmarkListOriginal: Ref<Bookmark[]>;
  convertedBookmarkList: Ref<
    Array<{
      tag: Exclude<Bookmark["tag"], undefined>;
      bookmarkList: Bookmark[];
    }>
  >;

  searchKeyword: Ref<string>;
  fuseInstance: Ref<Fuse<Bookmark>>;

  createLoading: boolean;
  createError: string | null;
}

export const useBookmarkStore = defineStore("bookmark", {
  state: (): BookmarkState => {
    const bookmarkListOriginal = useLocalStorage<Bookmark[]>("Bookmark", []);

    const fuseInstance = ref<Fuse<Bookmark>>(
      new Fuse(bookmarkListOriginal.value, {
        keys: ["name"],
        threshold: 0.5,
      })
    );

    const searchKeyword = ref<string>("");

    const convertedBookmarkList = computed<
      Array<{
        tag: Exclude<Bookmark["tag"], undefined>;
        bookmarkList: Bookmark[];
      }>
    >(() => {
      const convert = (
        bookmarkList: Bookmark[]
      ): Array<{
        tag: Exclude<Bookmark["tag"], undefined>;
        bookmarkList: Bookmark[];
      }> => {
        const results: Array<{
          tag: Exclude<Bookmark["tag"], undefined>;
          bookmarkList: Bookmark[];
        }> = [
          ...uniqBy(
            bookmarkList.map(({ tag }) => tag),
            "id"
          ).filter((tag) => tag != null),
          { id: "UNTAGGED", name: "Untagged", color: "#808080" },
        ].map((tag) => ({
          tag,
          bookmarkList: bookmarkList.filter((bookmark) => {
            if (tag.id === "UNTAGGED") {
              return bookmark.tag == null;
            } else {
              return bookmark.tag?.id === tag.id;
            }
          }),
        }));

        return results;
      };

      if (searchKeyword.value.trim() === "") {
        return convert(bookmarkListOriginal.value);
      } else {
        const result = fuseInstance.value?.search(searchKeyword.value);

        if (result != null) {
          return convert(result.map(({ item }) => item));
        }

        return convert(bookmarkListOriginal.value);
      }
    });

    return {
      loading: false,
      error: null,

      bookmarkListOriginal,
      convertedBookmarkList,

      fuseInstance,
      searchKeyword,

      createLoading: false,
      createError: null,
    };
  },
  actions: {
    async fetch() {
      this.loading = true;
      this.error = null;

      const authStore = useAuthStore();
      await authStore.refreshIfNeed();

      try {
        const result = await openApiClient.GET("/api/v1/bookmark", {
          params: {
            header: { Authorization: authStore.session.accessToken! },
          },
        });

        this.bookmarkListOriginal = result.data!;

        this.fuseInstance = new Fuse(this.bookmarkListOriginal, {
          keys: ["name"],
          threshold: 0.5,
        });
      } catch {
        this.error = "Couldn't fetch bookmark list";
      } finally {
        this.loading = false;
      }
    },

    async create({ name, url }: { name: string; url: string }) {
      this.createLoading = true;

      const authStore = useAuthStore();
      await authStore.refreshIfNeed();

      try {
        const response = await openApiClient.POST("/api/v1/bookmark", {
          params: {
            header: { Authorization: authStore.session.accessToken! },
          },
          body: { name, url },
        });

        this.bookmarkListOriginal.push(response.data!);

        const { notion_url } = response.data!;

        window.open(notion_url.replace("https://", "notion://"), "_blank");
      } catch {
        this.createError = "Couldn't create bookmark";
      } finally {
        this.createLoading = false;
      }
    },
  },
  getters: {},
});
