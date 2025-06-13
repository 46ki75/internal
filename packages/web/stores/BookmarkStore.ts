import { defineStore } from "pinia";
import { uniqBy } from "lodash-es";
import { z } from "zod";

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
  bookmarkList: Bookmark[];

  createLoading: boolean;
  createError: string | null;
}

export const useBookmarkStore = defineStore("bookmark", {
  state: (): BookmarkState => ({
    loading: false,
    error: null,
    bookmarkList: [],
    createLoading: false,
    createError: null,
  }),
  actions: {
    async fetch() {
      this.loading = true;
      this.error = null;

      const authStore = useAuthStore();
      await authStore.refreshIfNeed();

      const cache = window.localStorage.getItem("Bookmark");
      if (cache != null) this.bookmarkList = JSON.parse(cache);

      try {
        const result = await $fetch<{
          data: { bookmarkList: Bookmark[] };
        }>("/api/graphql", {
          method: "POST",
          headers: {
            Authorization: authStore.session.accessToken as string,
          },
          body: { query },
        });

        this.bookmarkList = result.data.bookmarkList;

        window.localStorage.setItem(
          "Bookmark",
          JSON.stringify(this.bookmarkList)
        );
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
        const response = await $fetch<{
          data: {
            createBookmark: Bookmark;
          };
        }>("/api/graphql", {
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
      return this.bookmarkList.filter((bookmark) => bookmark.tag?.id === tagId);
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
      return this.bookmarkList.filter((bookmark) => bookmark.tag == null);
    },
  },
});
