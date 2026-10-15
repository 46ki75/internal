import { createEffect, Match, on, Show, Switch } from "solid-js";
import { createQuery } from "@tanstack/solid-query";
import { ElmDotLoadingIcon } from "@elmethis/solid";

import { TypingItemTable } from "~/components/typing/typing-item-table";
import { Typing } from "~/components/typing/typing";
import { useAuth } from "~/context/auth-context";
import { openApiClient } from "~/openapi/client";
import { queryKeys } from "~/query-client";
import styles from "./typing-container.module.css";
import { createTypingQueue, createTypingRepository } from "./typing-model";

export const TypingContainer = () => {
  const auth = useAuth();
  const repository = createTypingRepository();
  const queue = createTypingQueue(repository);

  const exercisesQuery = createQuery(() => ({
    queryKey: queryKeys.typing,
    enabled: Boolean(auth.accessToken()),
    queryFn: async ({ signal }) => {
      await auth.refresh();
      const accessToken = auth.accessToken();
      if (!accessToken) {
        throw new Error("Access token is not available");
      }

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
        if (!fetchedItems) {
          return;
        }

        repository.replace(fetchedItems);
        queue.refillIfEmpty();
      },
    ),
  );

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
          <div class={styles.fallback}>
            <ElmDotLoadingIcon />
          </div>
        </Match>
        <Match when={repository.initialized()}>
          <div class={styles.content}>
            <Show
              when={queue.current()}
              keyed
              fallback={
                <p class={styles.notice}>No typing exercises are available.</p>
              }
            >
              {(exercise) => (
                <Typing
                  text={exercise.text}
                  onComplete={() => queue.advance(exercise.id)}
                  onNext={
                    repository.items().length > 1
                      ? () => queue.advance()
                      : undefined
                  }
                />
              )}
            </Show>
            <TypingItemTable items={repository.items()} />
          </div>
        </Match>
      </Switch>
    </div>
  );
};
