import { render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import type { ParentProps } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmInlineText: (props: ParentProps) => <span>{props.children}</span>,
  ElmMdiIcon: () => <span aria-hidden="true" />,
}));

import { Bookmark } from "./bookmark";

const bookmark = {
  id: "bookmark-1",
  icon: "https://example.com/favicon.svg",
  label: "Example",
  favorite: true,
  url: "https://example.com",
  editUrl: "https://www.notion.so/bookmark-1",
  tag: { id: "tag-1", name: "Reference", color: "blue" },
};

it("renders its destinations and forwards link actions", async () => {
  const user = userEvent.setup();
  const onOpen = vi.fn();
  const onEdit = vi.fn();
  const result = render(() => (
    <Bookmark {...bookmark} onOpen={onOpen} onEdit={onEdit} />
  ));
  const openLink = result.getByRole("link", { name: "Open Example" });
  const editLink = result.getByRole("link", { name: "Edit Example" });

  expect(openLink).toHaveAttribute("href", "https://example.com");
  expect(editLink).toHaveAttribute("href", "https://www.notion.so/bookmark-1");
  expect(result.container.querySelector("img")).toHaveAttribute(
    "src",
    "https://example.com/favicon.svg",
  );

  await user.click(openLink);
  await user.click(editLink);

  expect(onOpen).toHaveBeenCalledWith("https://example.com");
  expect(onEdit).toHaveBeenCalledWith("https://www.notion.so/bookmark-1");
});

it("omits the decorative image when no icon is supplied", () => {
  const result = render(() => (
    <Bookmark {...{ ...bookmark, icon: undefined }} />
  ));

  expect(result.container.querySelector("img")).not.toBeInTheDocument();
  expect(result.getByText("Example")).toBeVisible();
});
