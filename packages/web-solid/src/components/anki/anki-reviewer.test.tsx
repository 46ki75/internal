import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal, type JSX, type ParentProps } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmA2ui: () => <div data-testid="a2ui-surface" />,
  ElmBlockFallback: () => <div role="status">No card</div>,
  ElmButton: (
    props: ParentProps<
      JSX.ButtonHTMLAttributes<HTMLButtonElement> & { isLoading?: boolean }
    >,
  ) => (
    <button
      type="button"
      aria-label={props["aria-label"]}
      disabled={props.disabled || props.isLoading}
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
  ElmMdiIcon: () => <span aria-hidden="true" />,
  notionBlockCatalog: {},
}));

import { AnkiReviewer, type AnkiCard } from "./anki-reviewer";

const card = (pageId = "card-1"): AnkiCard => ({
  pageId,
  isReviewRequired: false,
  loading: false,
  block: {
    front: { root: "front" },
    back: { root: "back" },
    explanation: { root: "explanation" },
  },
});

const renderReviewer = (currentCard: () => AnkiCard | null, onRate = vi.fn()) =>
  render(() => (
    <AnkiReviewer
      card={currentCard()}
      queueCount={5}
      shouldLearnCount={2}
      onEdit={vi.fn()}
      onCreate={vi.fn()}
      onReview={vi.fn()}
      onRefresh={vi.fn()}
      onRate={onRate}
    />
  ));

it("reveals and grades a card with keyboard controls", async () => {
  const user = userEvent.setup();
  const onRate = vi.fn();
  const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  const result = renderReviewer(() => card(), onRate);

  expect(result.getByText("Front")).toBeInTheDocument();
  expect(result.queryByText("Back")).not.toBeInTheDocument();

  await user.keyboard("{Enter}");

  expect(result.getByText("Back")).toBeInTheDocument();
  expect(result.getByText("Explanation")).toBeInTheDocument();

  await user.keyboard("s");

  expect(onRate).toHaveBeenCalledWith(4);
  expect(result.queryByText("Back")).not.toBeInTheDocument();
  expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
});

it("resets a revealed answer when the card changes", async () => {
  const user = userEvent.setup();
  const [currentCard, setCurrentCard] = createSignal<AnkiCard | null>(card());
  const result = render(() => (
    <AnkiReviewer
      card={currentCard()}
      queueCount={5}
      shouldLearnCount={2}
      onEdit={vi.fn()}
      onCreate={vi.fn()}
      onReview={vi.fn()}
      onRefresh={vi.fn()}
      onRate={vi.fn()}
    />
  ));

  await user.click(result.getByRole("button", { name: /Show Answer/ }));
  expect(result.getByText("Back")).toBeInTheDocument();

  setCurrentCard(card("card-2"));

  expect(result.queryByText("Back")).not.toBeInTheDocument();
  expect(result.getByText("Front")).toBeInTheDocument();
});

it("renders a fallback while no card is available", () => {
  const result = renderReviewer(() => null);

  expect(result.getByRole("status")).toHaveTextContent("No card");
  expect(result.queryByText("Front")).not.toBeInTheDocument();
});
