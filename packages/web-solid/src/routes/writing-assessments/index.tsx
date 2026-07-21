import { Meta, Title } from "@solidjs/meta";
import {
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
  type JSX,
} from "solid-js";
import {
  ElmButton,
  ElmInlineText,
  ElmMdiIcon,
  ElmTextArea,
  createModal,
} from "@elmethis/solid";
import {
  mdiDeleteOutline,
  mdiHistory,
  mdiSend,
  mdiTextBoxCheckOutline,
} from "@mdi/js";

import { WritingAssesments } from "~/components/writing-assessments/writing-assesments";
import { WritingAssessmentsFeedbackContainer } from "~/components/writing-assessments/writing-assessments-feedback-container";
import { useAuth } from "~/context/auth-context";
import { openApiClient } from "~/openapi/client";
import type { components } from "~/openapi/schema";

import styles from "./writing-assessments.module.css";
import { WritingAssessmentsScore } from "~/components/writing-assessments/writing-assessments-score";

type Assessment = components["schemas"]["Assessment"];
type Score = 1 | 2 | 3 | 4 | 5;

export interface WritingAssessmentsRouteProps {
  class?: string;
  style?: JSX.CSSProperties;
}

const formatCreatedAt = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString();
};

const score = (value: number): Score => {
  if (value >= 1 && value <= 5) return value as Score;
  return 1;
};

export default function WritingAssessmentsRoute(
  props: WritingAssessmentsRouteProps,
) {
  const auth = useAuth();
  const [assessments, setAssessments] = createSignal<Assessment[]>([]);
  const [selectedId, setSelectedId] = createSignal<string>();
  const [text, setText] = createSignal("");
  const [japaneseContext, setJapaneseContext] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(true);
  const [isSubmitting, setIsSubmitting] = createSignal(false);
  const [deletingId, setDeletingId] = createSignal<string>();
  const [pendingDelete, setPendingDelete] = createSignal<Assessment>();
  const [deleteError, setDeleteError] = createSignal<string>();
  const [error, setError] = createSignal<string>();
  const {
    Modal: DeleteConfirmationModal,
    show: showDeleteConfirmation,
    hide: hideDeleteConfirmation,
  } = createModal();

  const selectedAssessment = createMemo(() => {
    const items = assessments();
    return (
      items.find((assessment) => assessment.id === selectedId()) ?? items[0]
    );
  });

  const accessToken = async () => {
    await auth.refresh();
    const token = auth.accessToken();
    if (!token) throw new Error("Sign in to use writing assessments");
    return token;
  };

  onMount(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const token = await accessToken();
        const { data, response } = await openApiClient.GET(
          "/api/v1/writing-assessments",
          {
            params: {
              header: { Authorization: `Bearer ${token}` },
            },
            signal: controller.signal,
          },
        );

        if (!data) {
          throw new Error(`Unable to load assessments (${response.status})`);
        }
        if (!controller.signal.aborted) {
          setAssessments(data);
          setSelectedId(data[0]?.id);
        }
      } catch (cause) {
        if (!(cause instanceof Error && cause.name === "AbortError")) {
          setError(cause instanceof Error ? cause.message : String(cause));
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();

    onCleanup(() => controller.abort());
  });

  const submit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (
    event,
  ) => {
    event.preventDefault();
    if (isSubmitting() || text().trim() === "") return;

    setIsSubmitting(true);
    setError(undefined);
    try {
      const token = await accessToken();
      const context = japaneseContext().trim();
      const { data, response } = await openApiClient.POST(
        "/api/v1/writing-assessments",
        {
          params: {
            header: { Authorization: `Bearer ${token}` },
          },
          body: {
            text: text().trim(),
            japanese_context: context === "" ? undefined : context,
          },
        },
      );

      if (!data) {
        throw new Error(`Unable to assess writing (${response.status})`);
      }

      setAssessments((items) => [data, ...items]);
      setSelectedId(data.id);
      setText("");
      setJapaneseContext("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async (assessment: Assessment) => {
    if (deletingId()) return false;

    setDeletingId(assessment.id);
    setDeleteError(undefined);
    try {
      const token = await accessToken();
      const { data, response } = await openApiClient.DELETE(
        "/api/v1/writing-assessments/{id}",
        {
          params: {
            header: { Authorization: `Bearer ${token}` },
            path: { id: assessment.id },
          },
        },
      );

      if (!data) {
        throw new Error(`Unable to delete assessment (${response.status})`);
      }

      setAssessments((items) =>
        items.filter((item) => item.id !== assessment.id),
      );
      if (selectedId() === assessment.id) setSelectedId(undefined);
      return true;
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : String(cause));
      return false;
    } finally {
      setDeletingId(undefined);
    }
  };

  const requestRemoval = (assessment: Assessment) => {
    setPendingDelete(assessment);
    setDeleteError(undefined);
    showDeleteConfirmation();
  };

  const cancelRemoval = () => {
    hideDeleteConfirmation();
    setPendingDelete(undefined);
    setDeleteError(undefined);
  };

  const confirmRemoval = async () => {
    const assessment = pendingDelete();
    if (!assessment || !(await remove(assessment))) return;
    cancelRemoval();
  };

  return (
    <>
      <Title>Writing Assessments | Internal</Title>
      <Meta
        name="description"
        content="Assess English writing and review detailed feedback"
      />

      <div
        class={`${styles["writing-assessments"]} ${props.class ?? ""}`}
        style={props.style}
      >
        <header class={styles["page-header"]}>
          <div class={styles["page-title"]}>
            <ElmMdiIcon d={mdiTextBoxCheckOutline} size="2rem" />
            <h1>
              <ElmInlineText>Writing Assessments</ElmInlineText>
            </h1>
          </div>
          <ElmInlineText>
            Review clarity, naturalness, register, and sentence-level feedback.
          </ElmInlineText>
        </header>

        <div class={styles.workspace}>
          <main class={styles.main}>
            <form class={styles.form} onSubmit={submit}>
              <ElmTextArea
                label="English text"
                value={text()}
                rows={7}
                required
                isLoading={isSubmitting()}
                placeholder="Enter the English text you want to assess..."
                onInput={(event) => setText(event.currentTarget.value)}
              />
              <ElmTextArea
                label="Japanese context (optional)"
                value={japaneseContext()}
                rows={3}
                isLoading={isSubmitting()}
                placeholder="Add the intended meaning or context in Japanese..."
                onInput={(event) =>
                  setJapaneseContext(event.currentTarget.value)
                }
              />
              <ElmButton
                class={styles["submit-button"]}
                type="submit"
                primary
                isLoading={isSubmitting()}
                disabled={text().trim() === ""}
              >
                <ElmMdiIcon d={mdiSend} />
                <span>Assess writing</span>
              </ElmButton>
            </form>

            <Show when={error()} keyed>
              {(message) => (
                <div class={styles.error} role="alert">
                  <ElmInlineText>{message}</ElmInlineText>
                </div>
              )}
            </Show>

            <Show
              when={selectedAssessment()}
              keyed
              fallback={
                <div class={styles.empty}>
                  <ElmMdiIcon d={mdiTextBoxCheckOutline} size="2.5rem" />
                  <ElmInlineText>
                    {isLoading()
                      ? "Loading assessments..."
                      : "Submit some writing to see an assessment."}
                  </ElmInlineText>
                </div>
              }
            >
              {(assessment) => (
                <article class={styles.assessment}>
                  <div class={styles["assessment-header"]}>
                    <div>
                      <h2>
                        <ElmInlineText>Assessment</ElmInlineText>
                      </h2>
                      <ElmInlineText size="0.75rem" color="gray">
                        {formatCreatedAt(assessment.created_at)} ·{" "}
                        {assessment.model}
                      </ElmInlineText>
                    </div>
                    <ElmButton
                      aria-label="Delete assessment"
                      color="#ae6e6e"
                      isLoading={deletingId() === assessment.id}
                      onClick={() => requestRemoval(assessment)}
                    >
                      <ElmMdiIcon d={mdiDeleteOutline} />
                    </ElmButton>
                  </div>

                  <WritingAssesments
                    japanese_context={assessment.japanese_context}
                    original_text={assessment.original_text}
                    revised_text={
                      assessment.revised_text ?? assessment.original_text
                    }
                    justification={assessment.justification}
                    register={assessment.register}
                    score={score(assessment.score)}
                  />

                  <WritingAssessmentsFeedbackContainer
                    feedbacks={assessment.feedback}
                  />
                </article>
              )}
            </Show>
          </main>

          <aside class={styles.history}>
            <div class={styles["history-heading"]}>
              <ElmMdiIcon d={mdiHistory} />
              <h2>
                <ElmInlineText>History</ElmInlineText>
              </h2>
            </div>

            <Show
              when={assessments().length > 0}
              fallback={
                <ElmInlineText color="gray">
                  {isLoading() ? "Loading..." : "No assessments yet"}
                </ElmInlineText>
              }
            >
              <div class={styles["history-list"]}>
                <For each={assessments()}>
                  {(assessment) => (
                    <button
                      type="button"
                      class={styles["history-item"]}
                      classList={{
                        [styles.selected]:
                          selectedAssessment()?.id === assessment.id,
                      }}
                      onClick={() => setSelectedId(assessment.id)}
                    >
                      <ElmInlineText class={styles["history-preview"]}>
                        {assessment.original_text}
                      </ElmInlineText>
                      <ElmInlineText class={styles["history-meta"]}>
                        <WritingAssessmentsScore
                          score={assessment.score as 1 | 2 | 3 | 4 | 5}
                          label={false}
                        />
                        {formatCreatedAt(assessment.created_at)}
                      </ElmInlineText>
                    </button>
                  )}
                </For>
              </div>
            </Show>
          </aside>
        </div>
      </div>

      <DeleteConfirmationModal>
        <div class={styles["delete-dialog"]}>
          <h2>
            <ElmInlineText>Delete assessment?</ElmInlineText>
          </h2>
          <ElmInlineText>
            This permanently deletes the assessment and all of its feedback.
          </ElmInlineText>
          <Show when={pendingDelete()} keyed>
            {(assessment) => (
              <div class={styles["delete-preview"]}>
                {assessment.original_text}
              </div>
            )}
          </Show>
          <Show when={deleteError()} keyed>
            {(message) => (
              <div class={styles["delete-error"]} role="alert">
                <ElmInlineText>{message}</ElmInlineText>
              </div>
            )}
          </Show>
          <div class={styles["delete-actions"]}>
            <ElmButton
              type="button"
              disabled={Boolean(deletingId())}
              onClick={cancelRemoval}
            >
              Cancel
            </ElmButton>
            <ElmButton
              type="button"
              color="#ae6e6e"
              isLoading={Boolean(deletingId())}
              onClick={() => void confirmRemoval()}
            >
              <ElmMdiIcon d={mdiDeleteOutline} />
              <span>Delete</span>
            </ElmButton>
          </div>
        </div>
      </DeleteConfirmationModal>
    </>
  );
}
