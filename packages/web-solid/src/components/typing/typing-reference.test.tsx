import { render, within } from "@solidjs/testing-library";
import { expect, it, vi } from "vitest";

// Keep the real renderer; external Node imports in Vitest cannot load token CSS.
vi.mock("@elmethis/core/tokens.css", () => ({}));

import { Typing } from "./typing";

it("renders the A2UI reference with the real Notion catalog", async () => {
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
  expect(await reference.findByRole("link", { name: "link." })).toHaveAttribute(
    "href",
    "https://example.com",
  );
  expect(
    result.getByRole("region", { name: "A Notion description" }),
  ).toBeInTheDocument();
  expect(result.getByText("Text to type: Type this link.")).toBeInTheDocument();
});
