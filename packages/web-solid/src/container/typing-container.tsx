import { createMemo, createSignal, Match, Switch } from "solid-js";
import { createQuery } from "@tanstack/solid-query";

import { Typing } from "~/components/typing/typing";
import { useAuth } from "~/context/auth-context";
import { openApiClient } from "~/openapi/client";
import { queryKeys } from "~/query-client";
import styles from "./typing-container.module.css";

export const TypingContainer = () => {
  const auth = useAuth();
  const [currentIndex, setCurrentIndex] = createSignal(0);

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

  const exercises = createMemo(() => exercisesQuery.data ?? []);
  const currentExercise = createMemo(() => {
    const items = exercises();
    return items.length === 0 ? null : items[currentIndex() % items.length];
  });

  const next = () => {
    const length = exercises().length;
    if (length > 0) setCurrentIndex((index) => (index + 1) % length);
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
        <Match when={exercisesQuery.isPending}>
          <p class={styles.notice}>Loading typing exercises...</p>
        </Match>
        <Match when={exercises().length === 0}>
          <p class={styles.notice}>No typing exercises are available.</p>
        </Match>
        <Match when={currentExercise()} keyed>
          {(exercise) => (
            <Typing
              text={exercise.text}
              description={exercise.description}
              onNext={exercises().length > 1 ? next : undefined}
            />
          )}
        </Match>
      </Switch>
    </div>
  );
};
