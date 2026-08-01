import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import type { JSX, ParentProps } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@formkit/auto-animate", () => ({
  default: () => ({ destroy: vi.fn() }),
}));

vi.mock("@elmethis/solid", () => ({
  ElmHeading: (props: ParentProps<{ level: number }>) => (
    <h2>{props.children}</h2>
  ),
  ElmInlineText: (props: ParentProps) => <span>{props.children}</span>,
  ElmMdiIcon: () => <span aria-hidden="true" />,
  ElmTextField: (
    props: JSX.InputHTMLAttributes<HTMLInputElement> & { label: string },
  ) => (
    <label>
      {props.label}
      <input
        value={props.value}
        onInput={(event) => {
          if (typeof props.onInput === "function") {
            props.onInput(event);
          } else if (props.onInput) {
            props.onInput[0](props.onInput[1], event);
          }
        }}
        onKeyDown={(event) => {
          if (typeof props.onKeyDown === "function") {
            props.onKeyDown(event);
          } else if (props.onKeyDown) {
            props.onKeyDown[0](props.onKeyDown[1], event);
          }
        }}
      />
    </label>
  ),
}));

import { BookmarkList } from "./bookmark-list";
import type { BookmarkProps } from "./bookmark";

const makeBookmark = (
  id: string,
  label: string,
  overrides: Partial<BookmarkProps> = {},
): BookmarkProps => ({
  id,
  label,
  favorite: false,
  url: `https://${id}.example.com`,
  editUrl: `https://www.notion.so/${id}`,
  tag: { id: "reference", name: "Reference", color: "blue" },
  ...overrides,
});

it("opens the first matching bookmark and clears search", async () => {
  const user = userEvent.setup();
  const onAlphaOpen = vi.fn();
  const onBetaOpen = vi.fn();
  const result = render(() => (
    <BookmarkList
      bookmarks={[
        makeBookmark("alpha", "Alpha", { onOpen: onAlphaOpen }),
        makeBookmark("beta", "Beta docs", { onOpen: onBetaOpen }),
      ]}
    />
  ));
  const search = result.getByRole("textbox", { name: "Search" });

  await user.type(search, "Beta{Enter}");

  expect(onBetaOpen).toHaveBeenCalledWith("https://beta.example.com");
  expect(onAlphaOpen).not.toHaveBeenCalled();
  expect(search).toHaveValue("");
});

it("groups bookmarks and exposes refresh state", async () => {
  const user = userEvent.setup();
  const onRefresh = vi.fn();
  const result = render(() => (
    <BookmarkList
      bookmarks={[
        makeBookmark("alpha", "Alpha", { favorite: true }),
        makeBookmark("beta", "Beta", {
          tag: { id: "tools", name: "Tools", color: "green" },
        }),
      ]}
      onRefresh={onRefresh}
    />
  ));

  expect(result.getByRole("heading", { name: "Favorites" })).toBeVisible();
  expect(result.getByText("Reference")).toBeVisible();
  expect(result.getByText("Tools")).toBeVisible();

  await user.click(result.getByRole("button", { name: "Refresh bookmarks" }));

  expect(onRefresh).toHaveBeenCalledOnce();
});

it("disables refresh while bookmarks are updating", () => {
  const result = render(() => (
    <BookmarkList bookmarks={[]} isRefreshing onRefresh={vi.fn()} />
  ));

  expect(
    result.getByRole("button", { name: "Refresh bookmarks" }),
  ).toBeDisabled();
});
