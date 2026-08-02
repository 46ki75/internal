// @vitest-environment happy-dom

import { fireEvent, render } from "@solidjs/testing-library";
import { expect, it, vi } from "vitest";

vi.mock("@solidjs/router", () => ({
  useIsRouting: () => () => false,
}));

import styles from "./loading-indicator.module.css";
import { LoadingIndicator } from "./loading-indicator";

it("activates for same-tab links to another origin", () => {
  const result = render(() => (
    <>
      <LoadingIndicator data-testid="indicator" />
      <a href="https://example.com/resource">External resource</a>
    </>
  ));
  const indicator = result.getByTestId("indicator");
  const preventNavigation = (event: MouseEvent) => event.preventDefault();
  window.addEventListener("click", preventNavigation);

  fireEvent.click(result.getByRole("link", { name: "External resource" }));
  window.removeEventListener("click", preventNavigation);

  expect(indicator).toHaveClass(styles.active);

  window.dispatchEvent(new Event("pageshow"));
  expect(indicator).not.toHaveClass(styles.active);
});

it("ignores links that do not replace the current document", () => {
  const result = render(() => (
    <>
      <LoadingIndicator data-testid="indicator" />
      <a href="https://example.com/resource" target="_blank">
        New tab
      </a>
    </>
  ));

  fireEvent.click(result.getByRole("link", { name: "New tab" }));

  expect(result.getByTestId("indicator")).not.toHaveClass(styles.active);
});
