import { $, component$, Slot, useContext } from "@builder.io/qwik";
import { DocumentHead, useNavigate } from "@builder.io/qwik-city";
import {
  mdiCreation,
  mdiFaceMan,
  mdiHome,
  mdiPaletteSwatch,
  mdiTag,
} from "@mdi/js";
import { Header } from "~/components/common/header";

import { useAnkiContextProvider } from "~/context/anki-context";
import { AuthContext } from "~/context/auth-context";

import styles from "./root-layout.module.css";
import { useModal } from "@elmethis/qwik";
import { Signin } from "~/components/common/signin";

export default component$(() => {
  const authStore = useContext(AuthContext);
  useAnkiContextProvider();

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
