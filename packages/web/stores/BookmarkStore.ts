import { defineStore } from "pinia";
import { uniqBy } from "lodash-es";
import { z } from "zod";
import Fuse from "fuse.js";
import { useLocalStorage } from "@vueuse/core";

const query = /* GraphQL */ `
  query BookmarkList {
    bookmarkList {
      id
      name
      url
      favicon
      tag {
        id
        name
        color
      }
      notionUrl
      nsfw
    }
  }
`;

export const bookmarkSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  favicon: z.string().nullable(),
  tag: z
    .object({
      id: z.string(),
      name: z.string(),
      color: z.string(),
    })
    .optional(),
  notionUrl: z.string(),
  nsfw: z.boolean(),
});

export type Bookmark = z.infer<typeof bookmarkSchema>;

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
        const result: {
          data: { bookmarkList: Bookmark[] };
        } = await $fetch("/api/graphql", {
          method: "POST",
          headers: {
            Authorization: authStore.session.accessToken as string,
          },
          body: { query },
        });

        this.bookmarkListOriginal = result.data.bookmarkList;

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
        const response: {
          data: {
            createBookmark: Bookmark;
          };
        } = await $fetch("/api/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${authStore.session.accessToken}`,
          },
          body: {
            query: /* GraphQL */ `
              mutation CreateBookmark($name: String!, $url: String!) {
                createBookmark(input: { name: $name, url: $url }) {
                  id
                  name
                  url
                  favicon
                  tag {
                    id
                    name
                    color
                  }
                  notionUrl
                }
              }
            `,
            variables: { name, url },
          },
        });

        this.bookmarkListOriginal.push(response.data.createBookmark);

        const { notionUrl } = response.data.createBookmark;

        window.open(notionUrl.replace("https://", "notion://"), "_blank");
      } catch {
        this.createError = "Couldn't create bookmark";
      } finally {
        this.createLoading = false;
      }
    },
  },
  getters: {},
});
