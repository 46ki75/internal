import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import type { JSX, ParentProps } from "solid-js";
import { describe, expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmButton: (
    props: ParentProps<JSX.ButtonHTMLAttributes<HTMLButtonElement>>,
  ) => (
    <button
      type="button"
      onClick={(event) => {
        if (typeof props.onClick === "function") {
          props.onClick(event);
        } else if (props.onClick) {
          props.onClick[0](props.onClick[1], event);
        }
      }}
    >
      {props.children}
    </button>
  ),
  ElmInlineText: (props: ParentProps) => <span>{props.children}</span>,
}));

import { AnkiGradeBar, RATINGS } from "./anki-grade-bar";

describe("AnkiGradeBar", () => {
  it("reveals the answer from its initial action", async () => {
    const user = userEvent.setup();
    const onShowAnswer = vi.fn();
    const result = render(() => (
      <AnkiGradeBar
        isShowingAnswer={false}
        onShowAnswer={onShowAnswer}
        onRate={vi.fn()}
      />
    ));

    expect(result.getAllByRole("button")).toHaveLength(1);
    await user.click(result.getByRole("button", { name: /Show Answer/ }));

    expect(onShowAnswer).toHaveBeenCalledOnce();
  });

  it.each(RATINGS)(
    "maps $label to rating $rating",
    async ({ key, label, rating }) => {
      const user = userEvent.setup();
      const onRate = vi.fn();
      const result = render(() => (
        <AnkiGradeBar isShowingAnswer onShowAnswer={vi.fn()} onRate={onRate} />
      ));

      expect(result.getAllByRole("button")).toHaveLength(RATINGS.length);
      await user.click(
        result.getByRole("button", { name: `${key.toUpperCase()} ${label}` }),
      );

      expect(onRate).toHaveBeenCalledWith(rating);
    },
  );
});
