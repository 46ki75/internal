import { expect, test } from "@playwright/test";

test("loads a routed page from the deployed application", async ({ page }) => {
  const response = await page.goto("/typing");

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle("Typing | Internal");
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }),
  ).toBeVisible();
});
