import { createEffect, createSignal, Match, on, Show, Switch } from "solid-js";
import { createQuery, useQueryClient } from "@tanstack/solid-query";

import { TypingItemTable } from "~/components/typing/typing-item-table";
import { Typing } from "~/components/typing/typing";
import { useAuth } from "~/context/auth-context";
import { openApiClient } from "~/openapi/client";
import { queryKeys } from "~/query-client";
import styles from "./typing-container.module.css";
import {
  createTypingQueue,
  createTypingRepository,
  type TypingItem,
} from "./typing-model";

export const TypingContainer = () => {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const repository = createTypingRepository();
  const queue = createTypingQueue(repository);
  const [completionError, setCompletionError] = createSignal<string | null>(
    null,
  );

  const exercisesQuery = createQuery(() => ({
    queryKey: queryKeys.typing,
    enabled: Boolean(auth.accessToken()),
    queryFn: async ({ signal }) => {
      await auth.refresh();
      const accessToken = auth.accessToken();
      if (!accessToken) throw new Error("Access token is not available");

      const { data, error, response } = await openApiClient.GET(
        "/api/v1/typing",
        {
          params: {
            header: { Authorization: `Bearer ${accessToken}` },
          },
          signal,
        },
      );
      if (!data) {
        throw new Error(
          `Failed to fetch typing exercises (${response.status}): ${JSON.stringify(error)}`,
        );
      }
      return data;
    },
  }));

  createEffect(
    on(
      () => exercisesQuery.data,
      (fetchedItems) => {
        if (!fetchedItems) return;

        repository.replace(fetchedItems);
        queue.refillIfEmpty();
      },
    ),
  );

  const next = () => {
    setCompletionError(null);
    queue.advance();
  };

  const complete = async (exercise: TypingItem) => {
    setCompletionError(null);
    queue.advance(exercise.id);

    try {
      await auth.refresh();
      const accessToken = auth.accessToken();
      if (!accessToken) throw new Error("Access token is not available");

      const { data, error, response } = await openApiClient.POST(
        "/api/v1/typing/{id}/completion",
        {
          params: {
            header: { Authorization: `Bearer ${accessToken}` },
            path: { id: exercise.id },
          },
        },
      );
      if (!data) {
        throw new Error(
          `Failed to record typing completion (${response.status}): ${JSON.stringify(error)}`,
        );
      }

      repository.update(data);
      queryClient.setQueryData<TypingItem[]>(queryKeys.typing, (current = []) =>
        current.map((item) =>
          item.id === data.id && item.completion_count < data.completion_count
            ? data
            : item,
        ),
      );
    } catch (error) {
      setCompletionError(
        error instanceof Error ? error.message : String(error),
      );
    }
  };

  return (
    <div class={styles.container}>
      <Switch>
        <Match when={!auth.accessToken()}>
          <p class={styles.notice}>Sign in to load typing exercises.</p>
        </Match>
        <Match when={exercisesQuery.error} keyed>
          {(error) => (
            <p class={`${styles.notice} ${styles.error}`} role="alert">
              {error.message}
            </p>
          )}
        </Match>
        <Match when={exercisesQuery.isPending || !repository.initialized()}>
          <p class={styles.notice}>Loading typing exercises...</p>
        </Match>
        <Match when={repository.items().length === 0}>
          <p class={styles.notice}>No typing exercises are available.</p>
        </Match>
        <Match when={queue.current()} keyed>
          {(exercise) => (
            <div class={styles.content}>
              <Typing
                text={exercise.text}
                description={exercise.description}
                onComplete={() => void complete(exercise)}
                onNext={repository.items().length > 1 ? next : undefined}
              />
              <Show when={completionError()} keyed>
                {(error) => (
                  <p class={`${styles.notice} ${styles.error}`} role="alert">
                    {error}
                  </p>
                )}
              </Show>
              <TypingItemTable items={repository.items()} />
            </div>
          )}
        </Match>
      </Switch>
    </div>
  );
};
