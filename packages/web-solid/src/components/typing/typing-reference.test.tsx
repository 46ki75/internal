import { render, within } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

// Keep the real renderer; external Node imports in Vitest cannot load token CSS.
vi.mock("@elmethis/core/tokens.css", () => ({}));

import { Typing } from "./typing";

it("shows the rich reference without the Notion title when typing mode is off", async () => {
  const user = userEvent.setup();
  const result = render(() => (
    <Typing
      description="A Notion description"
      text="Type this link."
      surface={{
        root: "root",
        components: {
          root: { id: "root", component: "Column", children: ["sentence"] },
          sentence: {
            id: "sentence",
            component: "Paragraph",
            children: ["bold", "link"],
          },
          bold: {
            id: "bold",
            component: "RichText",
            text: "Type this ",
            decoration: ["bold"],
          },
          link: {
            id: "link",
            component: "LinkText",
            text: "link.",
            href: "https://example.com",
          },
        },
      }}
    />
  ));

  const reference = within(
    result.getByRole("region", { name: "Reference text" }),
  );
  expect(
    (await reference.findByText("Type this")).closest("strong"),
  ).not.toBeNull();
  const link = await reference.findByRole("link", { name: "link." });
  expect(link).toHaveAttribute("href", "https://example.com");
  expect(result.queryByText("A Notion description")).not.toBeInTheDocument();
  expect(
    result.queryByText("Text to type: Type this link."),
  ).not.toBeInTheDocument();
  expect(result.queryByRole("textbox")).not.toBeInTheDocument();
  const toggle = result.getByRole("switch", { name: "Typing mode" });
  expect(toggle).not.toBeChecked();

  await user.click(toggle);
  expect(result.getByText("A Notion description")).toBeVisible();
  expect(reference.getByRole("link", { name: "link." })).toBe(link);

  await user.click(toggle);
  expect(result.queryByText("A Notion description")).not.toBeInTheDocument();
  expect(reference.getByRole("link", { name: "link." })).toBe(link);
});
