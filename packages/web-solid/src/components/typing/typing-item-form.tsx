import { createSignal, createUniqueId, Show, type JSX } from "solid-js";
import {
  ElmButton,
  ElmHeading,
  ElmTextArea,
  ElmTextField,
} from "@elmethis/solid";
import { createForm } from "@tanstack/solid-form";

import styles from "./typing-item-form.module.css";

export interface TypingItemInput {
  description: string;
  id?: string;
  text: string;
}

export interface TypingItemFormProps {
  submit: (input: TypingItemInput) => Promise<void>;
}

const required =
  (label: string) =>
  ({ value }: { value: string }) =>
    value.trim() === "" ? `${label} is required` : undefined;

export const TypingItemForm = (props: TypingItemFormProps) => {
  const titleId = createUniqueId();
  const [submissionError, setSubmissionError] = createSignal<string>();
  const form = createForm(() => ({
    defaultValues: {
      id: "",
      description: "",
      text: "",
    },
    onSubmit: async ({ value }) => {
      setSubmissionError(undefined);

      try {
        const id = value.id.trim();
        await props.submit({
          id: id === "" ? undefined : id,
          description: value.description.trim(),
          text: value.text,
        });
        form.reset();
      } catch (cause) {
        setSubmissionError(
          cause instanceof Error ? cause.message : String(cause),
        );
      }
    },
  }));

  const handleSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (
    event,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    void form.handleSubmit();
  };

  return (
    <section class={styles.section} aria-labelledby={titleId}>
      <header class={styles.header}>
        <ElmHeading level={2} id={titleId}>
          Save an exercise
        </ElmHeading>
        <p>
          Leave the ID empty to create an item, or provide one to replace it.
        </p>
      </header>

      <form class={styles.form} onSubmit={handleSubmit}>
        <form.Field
          name="id"
          children={(field) => (
            <div class={styles.field}>
              <ElmTextField
                name={field().name}
                label="ID (optional)"
                value={field().state.value}
                placeholder="Generated automatically"
                onBlur={field().handleBlur}
                onInput={(event) =>
                  field().handleChange(event.currentTarget.value)
                }
              />
            </div>
          )}
        />

        <form.Field
          name="description"
          validators={{
            onChange: required("Description"),
            onSubmit: required("Description"),
          }}
          children={(field) => (
            <div class={styles.field}>
              <ElmTextField
                name={field().name}
                label="Description"
                value={field().state.value}
                required
                aria-invalid={!field().state.meta.isValid}
                onBlur={field().handleBlur}
                onInput={(event) =>
                  field().handleChange(event.currentTarget.value)
                }
              />
              <Show
                when={
                  field().state.meta.isTouched &&
                  field().state.meta.errors.length > 0
                }
              >
                <p class={styles.fieldError} role="alert">
                  {field().state.meta.errors.join(", ")}
                </p>
              </Show>
            </div>
          )}
        />

        <form.Field
          name="text"
          validators={{
            onChange: required("Practice text"),
            onSubmit: required("Practice text"),
          }}
          children={(field) => (
            <div class={`${styles.field} ${styles.text}`}>
              <ElmTextArea
                name={field().name}
                label="Practice text"
                value={field().state.value}
                rows={4}
                required
                aria-invalid={!field().state.meta.isValid}
                onBlur={field().handleBlur}
                onInput={(event) =>
                  field().handleChange(event.currentTarget.value)
                }
              />
              <Show
                when={
                  field().state.meta.isTouched &&
                  field().state.meta.errors.length > 0
                }
              >
                <p class={styles.fieldError} role="alert">
                  {field().state.meta.errors.join(", ")}
                </p>
              </Show>
            </div>
          )}
        />

        <div class={styles.footer}>
          <Show when={submissionError()} keyed>
            {(message) => (
              <p class={styles.submissionError} role="alert">
                {message}
              </p>
            )}
          </Show>
          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              description: state.values.description,
              isSubmitting: state.isSubmitting,
              text: state.values.text,
            })}
            children={(state) => (
              <ElmButton
                type="submit"
                primary
                isLoading={state().isSubmitting}
                disabled={
                  !state().canSubmit ||
                  state().description.trim() === "" ||
                  state().text.trim() === ""
                }
              >
                Save exercise
              </ElmButton>
            )}
          />
        </div>
      </form>
    </section>
  );
};
