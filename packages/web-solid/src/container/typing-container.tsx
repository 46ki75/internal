import { createEffect, createSignal, Match, on, Show, Switch } from "solid-js";
import { createQuery, useQueryClient } from "@tanstack/solid-query";

import { TypingItemTable } from "~/components/typing/typing-item-table";
import {
  TypingItemForm,
  type TypingItemInput,
} from "~/components/typing/typing-item-form";
import { Typing } from "~/components/typing/typing";
import { useAuth } from "~/context/auth-context";
import { openApiClient } from "~/openapi/client";
import { queryKeys } from "~/query-client";
import styles from "./typing-container.module.css";
import {
  createTypingQueue,
  createTypingRepository,
  type TypingItem,
  upsertTypingItem,
} from "./typing-model";
import { ElmDotLoadingIcon } from "@elmethis/solid";

export const TypingContainer = () => {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const repository = createTypingRepository();
  const queue = createTypingQueue(repository);
  const [selectedExercise, setSelectedExercise] = createSignal<TypingItem>();
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

  const saveExercise = async (input: TypingItemInput) => {
    await auth.refresh();
    const accessToken = auth.accessToken();
    if (!accessToken) throw new Error("Access token is not available");

    const { data, error, response } = await openApiClient.POST(
      "/api/v1/typing",
      {
        params: {
          header: { Authorization: `Bearer ${accessToken}` },
        },
        body: input,
      },
    );
    if (!data) {
      throw new Error(
        `Failed to save typing exercise (${response.status}): ${JSON.stringify(error)}`,
      );
    }

    repository.upsert(data);
    queue.reconcile(data);
    queue.refillIfEmpty();
    queryClient.setQueryData<TypingItem[]>(queryKeys.typing, (current = []) =>
      upsertTypingItem(current, data),
    );
    setSelectedExercise(undefined);
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
                <>
                  <Typing
                    text={exercise.text}
                    description={exercise.description}
                    onComplete={() => void complete(exercise)}
                    onNext={repository.items().length > 1 ? next : undefined}
                  />
                  <Show when={completionError()} keyed>
                    {(error) => (
                      <p
                        class={`${styles.notice} ${styles.error}`}
                        role="alert"
                      >
                        {error}
                      </p>
                    )}
                  </Show>
                </>
              )}
            </Show>
            <TypingItemForm
              item={selectedExercise()}
              onCancel={() => setSelectedExercise(undefined)}
              submit={saveExercise}
            />
            <TypingItemTable
              items={repository.items()}
              selectedId={selectedExercise()?.id}
              onSelect={setSelectedExercise}
            />
          </div>
        </Match>
      </Switch>
    </div>
  );
};
