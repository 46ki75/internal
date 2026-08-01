import { render } from "@solidjs/testing-library";
import { expect, it, vi } from "vitest";
import { page } from "vitest/browser";

import { Signin } from "~/components/common/signin";

it("submits credentials through the real browser controls", async () => {
  const onSubmit = vi.fn();
  const { baseElement } = render(() => (
    <Signin isLoading={false} isDisabled={false} onSubmit={onSubmit} />
  ));
  const screen = page.elementLocator(baseElement);

  await screen.getByLabelText("username").fill("browser-user");
  await screen.getByRole("textbox", { name: /^password/ }).fill("secret");
  await screen.getByRole("button", { name: "Sign In" }).click();

  expect(onSubmit).toHaveBeenCalledWith("browser-user", "secret");
});
