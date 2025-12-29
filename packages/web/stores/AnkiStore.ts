import { openApiClient } from "~/openapi/client";
import { type paths } from "~/openapi/schema";
import { type ElmJsonComponentRendererProps } from "@elmethis/vue";

interface AnkiStoreState {
  currentIndex: number;
  isShowAnswer: boolean;

  fetchAnkiListState: {
    loading: boolean;
    error: string | null;
    results: paths["/api/v1/anki"]["get"]["responses"]["200"]["content"]["application/json"];
  };

  fetchAnkiBlocksState: {
    [ankiId: string]: {
      loading: boolean;
      error: string | null;
      result?: {
        back: ElmJsonComponentRendererProps["jsonComponents"];
        explanation: ElmJsonComponentRendererProps["jsonComponents"];
        front: ElmJsonComponentRendererProps["jsonComponents"];
      };
    };
  };

  createAnkiState: {
    loading: boolean;
    error: string | null;
  };

  updateAnkiState: {
    loading: boolean;
    error: string | null;
  };
}

export const useAnkiStore = defineStore("anki", {
  state: (): AnkiStoreState => ({
    currentIndex: 0,
    isShowAnswer: false,

    fetchAnkiListState: {
      loading: false,
      error: null,
      results: [],
    },

    fetchAnkiBlocksState: {},

    createAnkiState: {
      loading: false,
      error: null,
    },

    updateAnkiState: {
      loading: false,
      error: null,
    },
  }),
  actions: {
    setIsShowAnswer(isShow: boolean) {
      this.isShowAnswer = isShow;
    },

    async fetchAnkiList() {
      this.fetchAnkiListState.loading = true;
      this.fetchAnkiListState.error = null;

      const authStore = useAuthStore();
      await authStore.refreshIfNeed();

      try {
        const { data } = await openApiClient.GET("/api/v1/anki", {
          params: {
            header: { Authorization: authStore.session.accessToken! },
          },
        });

        if (data == null) {
          throw new Error("No data received");
        } else {
          this.fetchAnkiListState.results.push(...data);
        }
      } catch (e: unknown) {
        this.fetchAnkiListState.error = String(e);
      } finally {
        this.fetchAnkiListState.loading = false;
      }
    },

    async fetchAnkiBlocks({
      ankiId,
      forceUpdate,
    }: {
      ankiId: string;
      forceUpdate: boolean;
    }) {
      if (this.fetchAnkiBlocksState[ankiId] == null) {
        this.fetchAnkiBlocksState[ankiId] = {
          loading: false,
          error: null,
          result: undefined,
        };
      }

      this.fetchAnkiBlocksState[ankiId].loading = true;
      this.fetchAnkiBlocksState[ankiId].error = null;

      const authStore = useAuthStore();
      await authStore.refreshIfNeed();

      try {
        if (this.fetchAnkiBlocksState[ankiId].result == null || forceUpdate) {
          const { data } = await openApiClient.GET(
            "/api/v1/anki/block/{page_id}",
            {
              params: {
                header: { Authorization: authStore.session.accessToken! },
                path: { page_id: ankiId },
              },
            }
          );

          if (data == null) {
            throw new Error("No data received");
          } else {
            this.fetchAnkiBlocksState[ankiId].result = data as any;
          }
        }
      } catch (e: unknown) {
        this.fetchAnkiBlocksState[ankiId].error = String(e);
      } finally {
        this.fetchAnkiBlocksState[ankiId].loading = false;
      }
    },

    async createAnki() {
      // TODO: implement createAnki
    },

    async updateAnki({
      pageId,
      body,
    }: {
      pageId: string;
      body: paths["/api/v1/anki/{page_id}"]["put"]["requestBody"]["content"]["application/json"];
    }) {
      this.updateAnkiState.loading = true;
      this.updateAnkiState.error = null;

      const authStore = useAuthStore();
      await authStore.refreshIfNeed();

      try {
        await openApiClient.PUT("/api/v1/anki/{page_id}", {
          params: {
            header: { Authorization: authStore.session.accessToken! },
            path: { page_id: pageId },
          },
          body,
        });
      } catch (e: unknown) {
        this.updateAnkiState.error = String(e);
      } finally {
        this.updateAnkiState.loading = false;
      }
    },

    async updateAnkiByPerformanceRating(performanceRating: number) {
      if (this.getCurrentAnki == null) {
        throw new Error("No current learn");
      } else {
        const maxInterval = 365 / 4;
        const minInterval = 0.5;

        const currentAnki = this.getCurrentAnki;

        if (performanceRating < 3) {
          currentAnki.ease_factor = Math.max(
            1.3,
            currentAnki.ease_factor * 0.85
          );
          currentAnki.repetition_count = 0;
        } else {
          currentAnki.ease_factor +=
            0.1 -
            (5 - performanceRating) * (0.08 + (5 - performanceRating) * 0.02);
          currentAnki.repetition_count += 1;
        }

        let newInterval;
        if (performanceRating === 0) {
          newInterval = minInterval;
        } else if (performanceRating === 1) {
          newInterval = minInterval;
        } else if (performanceRating === 2) {
          newInterval = Math.max(minInterval, currentAnki.repetition_count);
        } else {
          let multiplier = 1;
          if (performanceRating === 3) {
            multiplier = 1;
          } else if (performanceRating === 4) {
            multiplier = 1.5;
          } else if (performanceRating === 5) {
            multiplier = 2;
          }
          newInterval = Math.min(
            maxInterval,
            Math.pow(currentAnki.ease_factor, currentAnki.repetition_count) *
              multiplier
          );
        }

        currentAnki.next_review_at = new Date(
          Date.now() + newInterval * 24 * 60 * 60 * 1000
        ).toISOString();

        this.updateAnki({
          pageId: currentAnki.page_id,
          body: {
            ease_factor: currentAnki.ease_factor,
            repetition_count: currentAnki.repetition_count,
            next_review_at: currentAnki.next_review_at,
          },
        });

        this.isShowAnswer = false;
        this.currentIndex += 1;

        this.idempotentFetch();
      }
    },

    async toggleCurrentAnkiReviewRequired() {
      const currentAnki = this.getCurrentAnki;

      if (currentAnki == null) {
        this.updateAnkiState.error = "No current Anki";
      } else {
        this.updateAnkiState.loading = true;
        this.updateAnkiState.error = null;

        const authStore = useAuthStore();
        await authStore.refreshIfNeed();

        try {
          await this.updateAnki({
            pageId: currentAnki.page_id,
            body: {
              is_review_required: currentAnki.is_review_required,
            },
          });
        } catch (e: unknown) {
          this.updateAnkiState.error = String(e);
        } finally {
          this.updateAnkiState.loading = false;
        }
      }
    },

    async idempotentFetch() {
      if (
        this.fetchAnkiListState.results.length < 50 &&
        !this.fetchAnkiListState.loading
      ) {
        await this.fetchAnkiList();
      }

      const currentAnki = this.getCurrentAnki;
      const nextAnki = this.fetchAnkiListState.results[this.currentIndex + 1];

      if (
        currentAnki != null &&
        !(this.fetchAnkiBlocksState[currentAnki.page_id]?.loading === true)
      ) {
        await this.fetchAnkiBlocks({
          ankiId: currentAnki.page_id,
          forceUpdate: false,
        });
      }

      if (
        nextAnki != null &&
        !(this.fetchAnkiBlocksState[nextAnki.page_id]?.loading === true)
      ) {
        await this.fetchAnkiBlocks({
          ankiId: nextAnki.page_id,
          forceUpdate: false,
        });
      }
    },
  },

  getters: {
    getCurrentAnki(state) {
      return state.fetchAnkiListState.results[state.currentIndex];
    },

    getCurrnetAnkiBlocks(state) {
      const currentAnki = state.fetchAnkiListState.results[state.currentIndex];
      if (currentAnki == null) {
        return null;
      }

      return state.fetchAnkiBlocksState[currentAnki.page_id]?.result ?? null;
    },

    getShouldLearnCount(): number {
      const nextReviewAtList = this.fetchAnkiListState.results.map((anki) =>
        new Date(anki.next_review_at).getTime()
      );
      const now = new Date().getTime();

      return nextReviewAtList.filter((nextReviewAt) => nextReviewAt < now)
        .length;
    },
  },
});
