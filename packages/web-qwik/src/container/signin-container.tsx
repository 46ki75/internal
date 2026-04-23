import { component$, useVisibleTask$, $, useContext } from "@builder.io/qwik";
import { useModal } from "@elmethis/qwik";
import { Signin } from "~/components/common/signin";

import { AuthContext } from "~/context/auth-context";

// AWS Amplify
import { Amplify } from "aws-amplify";
import { getCurrentUser, signIn } from "aws-amplify/auth/cognito";
import { fetchAuthSession } from "aws-amplify/auth";

const configure = () => {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: "ap-northeast-1_BmZKeZeKX",
        userPoolClientId: "4n5l6d5oekst6hrmvt1chndghd",
      },
    },
  });
};

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

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(async () => {
    configure();

    try {
      const { username, userId } = await getCurrentUser();
      if (username && userId) {
        authStore.sessionState = "login";
      } else {
        authStore.sessionState = "logout";
      }
    } catch {
      authStore.sessionState = "logout";
    }
  });

  const onSubmit$ = $(async (username: string, password: string) => {
    authStore.signingInProgress = true;

    try {
      configure();

      const result = await signIn({
        username: username,
        password: password,
      });

      if (result.isSignedIn) {
        authStore.sessionState = "login";

        const session = await fetchAuthSession({ forceRefresh: true });
        const accessToken = session.tokens?.accessToken.toString();
        authStore.accessToken = accessToken ?? null;
      }
    } catch {
      authStore.sessionState = "logout";
    } finally {
      authStore.signingInProgress = false;
    }
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
