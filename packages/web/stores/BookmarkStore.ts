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
  bookmarkList: Bookmark[];

  fuseInstance: Fuse<Bookmark> | null;

  createLoading: boolean;
  createError: string | null;
}

export const useBookmarkStore = defineStore("bookmark", {
  state: (): BookmarkState => {
    const bookmarkListOriginal = useLocalStorage<Bookmark[]>("Bookmark", []);

    return {
      loading: false,
      error: null,

      bookmarkListOriginal,
      bookmarkList: [],

      fuseInstance: null,

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

    async search(keyword: string) {
      if (keyword.trim() === "") {
        this.bookmarkList = this.bookmarkListOriginal;
      } else {
        const result = this.fuseInstance?.search(keyword);
        if (result != null) {
          this.bookmarkList = result.map(({ item }) => item);
        }
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

        this.bookmarkList.push(response.data.createBookmark);

        const { notionUrl } = response.data.createBookmark;

        window.open(notionUrl.replace("https://", "notion://"), "_blank");
      } catch {
        this.createError = "Couldn't create bookmark";
      } finally {
        this.createLoading = false;
      }
    },
    getBookmarkListByTagId(tagId?: string): Bookmark[] {
      const configStore = useConfigStore();

      return this.bookmarkList
        .filter((bookmark) => bookmark.tag?.id === tagId)
        .filter((bookmark) =>
          configStore.inWork ? bookmark.nsfw === false : true
        );
    },
  },
  getters: {
    tags(): Bookmark["tag"][] {
      const tags = this.bookmarkList.flatMap((bookmark) => bookmark.tag);
      const uniqueTags = uniqBy(
        tags.filter((tag) => tag != null),
        (tag) => tag.id
      );
      return uniqueTags;
    },

    getUntaggedBookmarkList(): Bookmark[] {
      const configStore = useConfigStore();

      return this.bookmarkList
        .filter((bookmark) => bookmark.tag == null)
        .filter((bookmark) =>
          configStore.inWork ? bookmark.nsfw === false : true
        );
    },
  },
});
