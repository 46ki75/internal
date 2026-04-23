import { component$, $, useContext, useTask$ } from "@builder.io/qwik";
import { useModal } from "@elmethis/qwik";
import { Signin } from "~/components/common/signin";

import { AuthContext } from "~/context/auth-context";

export const SigninContainer = component$(() => {
  const authStore = useContext(AuthContext);

  const { Modal, show, hide } = useModal({});

  useTask$(async ({ track }) => {
    const isSignInModalOpen = track(() => authStore.isSignInModalOpen);

    if (isSignInModalOpen) {
      show();
    } else {
      hide();
    }
  });

  const onSubmit$ = $(async (username: string, password: string) => {
    await authStore.signIn(authStore, username, password);
  });

  return (
    <>
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
