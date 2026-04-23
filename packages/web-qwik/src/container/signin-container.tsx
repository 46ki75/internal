import { component$, useVisibleTask$, $, useContext } from "@builder.io/qwik";
import { useModal } from "@elmethis/qwik";
import { Signin } from "~/components/common/signin";

import { AuthContext } from "~/context/auth-context";

export const SigninContainer = component$(() => {
  const authStore = useContext(AuthContext);

  const { Modal, toggle, show, hide } = useModal({});

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    const sessionState = track(() => authStore.sessionState);

    if (sessionState === "logout") {
      show();
    } else if (sessionState === "login") {
      hide();
    }
  });

  const onSubmit$ = $(async (username: string, password: string) => {
    await authStore.signIn(authStore, username, password);
  });

  return (
    <>
      {authStore.sessionState}

      <button onClick$={toggle}>toggle</button>

      <Modal>
        <Signin
          isLoading={
            authStore.sessionState === "pending" || authStore.signingInProgress
          }
          isDisabled={authStore.sessionState === "login"}
          onSubmit$={onSubmit$}
        />
      </Modal>
    </>
  );
});
