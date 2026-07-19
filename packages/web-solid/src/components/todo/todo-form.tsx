import { createSignal, Show, type JSX } from "solid-js";

import styles from "./todo-form.module.css";
import {
  ElmButton,
  ElmInlineText,
  ElmMdiIcon,
  ElmSelect,
  ElmTextField,
  type ElmSelectOption,
} from "@elmethis/solid";
import { components } from "~/openapi/schema";
import { mdiSend } from "@mdi/js";

type Severity = components["schemas"]["ToDoSeverityResponse"];
const SEVERITIES = ["UNKNOWN", "DEBUG", "INFO", "WARN", "ERROR"] as const;
const OPTIONS: ElmSelectOption[] = SEVERITIES.map((severity) => ({
  id: severity,
  label: severity,
}));

export interface TodoFormProps {
  class?: string;

  style?: JSX.CSSProperties;

  submit: (todo: {
    title: string;
    severity: Severity;
    deadline?: string;
  }) => Promise<void>;
}

export const TodoForm = (props: TodoFormProps) => {
  const [title, setTitle] = createSignal("");
  const [selectedSeverity, setSelectedSeverity] =
    createSignal<Severity>("INFO");
  const [deadline, setDeadline] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const handleSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = async (
    event,
  ) => {
    event.preventDefault();
    if (isLoading()) return;
    setIsLoading(true);
    setError(null);

    try {
      await props.submit({
        title: title(),
        severity: selectedSeverity(),
        deadline: deadline() === "" ? undefined : deadline(),
      });
      setTitle("");
      setSelectedSeverity("INFO");
      setDeadline("");
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(String(e));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div class={`${styles.wrapper} ${props.class ?? ""}`} style={props.style}>
      <form
        class={`${styles["todo-form-kit"]} ${props.class ?? ""}`}
        style={props.style}
        onSubmit={handleSubmit}
      >
        <ElmSelect
          class={styles["severity-select"]}
          label="Severity"
          options={OPTIONS}
          selectedOptionId={selectedSeverity()}
          onSelectedOptionIdChange={(value) => {
            if (SEVERITIES.includes(value as Severity)) {
              setSelectedSeverity(value as Severity);
            }
          }}
          isLoading={isLoading()}
        />
        <ElmTextField
          class={styles["title-input"]}
          label="Title"
          value={title()}
          onInput={(event) => setTitle(event.currentTarget.value)}
          isLoading={isLoading()}
        />
        <input
          class={styles["deadline-input"]}
          type="date"
          aria-label="Deadline"
          value={deadline()}
          onInput={(event) => setDeadline(event.currentTarget.value)}
        />
        <ElmButton
          type="submit"
          class={styles["submit-button"]}
          aria-label="Create todo"
          isLoading={isLoading()}
          disabled={title().trim() === ""}
        >
          <ElmMdiIcon d={mdiSend} />
        </ElmButton>
      </form>

      <div class={styles["todo-error"]}>
        <Show when={error()} keyed>
          {(message) => (
            <ElmInlineText color="#c56565">Error: {message}</ElmInlineText>
          )}
        </Show>
      </div>
    </div>
  );
};
