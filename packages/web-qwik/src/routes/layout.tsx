import { $, component$, Slot, useContext } from "@qwik.dev/core";
import { DocumentHead, useNavigate } from "@qwik.dev/router";
import {
  mdiCertificate,
  mdiCreation,
  mdiFaceMan,
  mdiHome,
  mdiLightbulbOnOutline,
  mdiPaletteSwatch,
  mdiTag,
} from "@mdi/js";
import { Header } from "~/components/common/header";

import { useAnkiContextProvider } from "~/context/anki-context";
import { AuthContext, useAuthEffect } from "~/context/auth-context";

import styles from "./root-layout.module.css";
import { useModal } from "@elmethis/qwik";
import { Signin } from "~/components/common/signin";

export default component$(() => {
  // Run the auth bootstrap effect here (NOT in `root.tsx`): Qwik v2's
  // root has no DOM host so its `useVisibleTask$` never fires on the
  // client. The provider itself is still mounted in `root.tsx` so the
  // store is serialized and visible to every route.
  useAuthEffect();
  useAnkiContextProvider();
  const authStore = useContext(AuthContext);

  const navigate = useNavigate();

  const { Modal, show } = useModal({});

  const onSubmit$ = $(async (username: string, password: string) => {
    await authStore.signIn(authStore, username, password);
  });

  return (
    <>
      <Header
        links={[
          {
            d: mdiHome,
            onClick$: $(() => {
              navigate("/");
            }),
          },
          {
            d: mdiTag,
            onClick$: $(() => {
              navigate("/anki");
            }),
          },
          {
            d: mdiLightbulbOnOutline,
            onClick$: $(() => {
              navigate("/trivia");
            }),
          },
          {
            d: mdiPaletteSwatch,
            onClick$: $(() => {
              navigate("/swatch");
            }),
          },
          {
            d: mdiFaceMan,
            onClick$: $(() => {
              navigate("/icon");
            }),
          },
          {
            d: mdiCreation,
            onClick$: $(() => {
              navigate("/chat");
            }),
          },
          {
            d: mdiCertificate,
            onClick$: $(() => {
              navigate("/practical_test_en.html");
            }),
          },
        ]}
        state={authStore.sessionState}
        handleSignOutClick$={$(async () => authStore.signOut(authStore))}
        handleSignInClick$={$(async () => show())}
      />

      <div class={styles["layout-slot"]}>
        <Slot />
      </div>

      <Modal>
        <>
          <Signin
            isLoading={
              authStore.sessionState === "pending" ||
              authStore.signingInProgress
            }
            isDisabled={authStore.sessionState === "login"}
            onSubmit$={onSubmit$}
          />

          {authStore.sessionState}
        </>
      </Modal>
    </>
  );
});

export const head: DocumentHead = {
  title: "Internal",
  meta: [],
};
