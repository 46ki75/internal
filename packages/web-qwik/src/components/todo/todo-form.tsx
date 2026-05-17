import {
  $,
  component$,
  QRL,
  useSignal,
  type CSSProperties,
} from "@qwik.dev/core";

import styles from "./todo-form.module.css";
import {
  ElmButton,
  ElmInlineText,
  ElmMdiIcon,
  ElmSelect,
  ElmTextField,
  type ElmSelectOption,
} from "@elmethis/qwik";
import { components } from "~/openapi/schema";
import { mdiSend } from "@mdi/js";

type Severity = components["schemas"]["ToDoSeverityResponse"];

export interface TodoFormProps {
  class?: string;

  style?: CSSProperties;

  submit$: QRL<
    (t: {
      title: string;
      severity: Severity;
      deadline?: string;
    }) => Promise<void>
  >;
}

export const TodoForm = component$<TodoFormProps>(
  ({ class: className, style, submit$ }) => {
    const options: ElmSelectOption[] = (
      ["UNKNOWN", "DEBUG", "INFO", "WARN", "ERROR"] as const
    ).map((severity) => ({
      id: severity,
      label: severity,
    }));

    const title = useSignal("");
    const selectedSeverity = useSignal<Severity>("INFO");
    const deadline = useSignal<string>("");
    const isLoading = useSignal(false);
    const error = useSignal<string | null>(null);

    const handleSubmit = $(async () => {
      isLoading.value = true;
      error.value = null;

      try {
        await submit$({
          title: title.value,
          severity: selectedSeverity.value,
          deadline: deadline.value === "" ? undefined : deadline.value,
        });
        title.value = "";
        selectedSeverity.value = "INFO";
        deadline.value = "";
      } catch (e) {
        if (e instanceof Error) {
          error.value = e.message;
        } else {
          error.value = String(e);
        }
      } finally {
        isLoading.value = false;
      }
    });

    return (
      <div class={[styles.wrapper, className]} style={style}>
        <div class={[styles["todo-form-kit"], className]} style={style}>
          <ElmSelect
            class={styles["severity-select"]}
            label="Severity"
            options={options}
            selectedOptionId={selectedSeverity}
            loading={isLoading.value}
          />
          <ElmTextField
            class={styles["title-input"]}
            label="Title"
            value={title}
            loading={isLoading.value}
          />
          <input
            class={styles["deadline-input"]}
            type="date"
            value={deadline.value}
            onInput$={(e) =>
              (deadline.value = (e.target as HTMLInputElement).value)
            }
          />
          <ElmButton
            class={styles["submit-button"]}
            onClick$={handleSubmit}
            loading={isLoading.value}
            disabled={title.value.trim() === ""}
          >
            <ElmMdiIcon d={mdiSend} />
          </ElmButton>
        </div>

        <div class={styles["todo-error"]}>
          {error.value && (
            <ElmInlineText color="#c56565">Error: {error.value}</ElmInlineText>
          )}
        </div>
      </div>
    );
  },
);
