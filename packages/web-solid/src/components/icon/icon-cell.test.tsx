import { render } from "@solidjs/testing-library";
import type { ParentProps } from "solid-js";
import { expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmInlineText: (props: ParentProps<{ code?: boolean }>) => (
    <span>{props.code ? <code>{props.children}</code> : props.children}</span>
  ),
}));

import { IconCell } from "./icon-cell";

it("renders the icon metadata", () => {
  const result = render(() => (
    <IconCell
      src="https://example.com/favicon.svg"
      name="Example icon"
      mimeType="image/svg+xml"
    />
  ));
  const image = result.getByRole("img", { name: "Example icon" });

  expect(image).toHaveAttribute("src", "https://example.com/favicon.svg");
  expect(image).toHaveAttribute("width", "48");
  expect(image).toHaveAttribute("height", "48");
  expect(result.getByText("Example icon")).toBeVisible();
  expect(result.getByText("image/svg+xml")).toBeInstanceOf(HTMLElement);
  expect(result.getByText("image/svg+xml").tagName).toBe("CODE");
});

it("does not render missing MIME metadata as text", () => {
  const result = render(() => (
    <IconCell src="https://example.com/favicon.ico" name="Example icon" />
  ));

  expect(result.queryByText("undefined")).not.toBeInTheDocument();
});
