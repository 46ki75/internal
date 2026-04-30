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
import { SigninContainer } from "~/container/signin-container";
import { useAnkiContextProvider } from "~/context/anki-context";
import { AuthContext } from "~/context/auth-context";

import styles from "./root-layout.module.css";

export default component$(() => {
  const authStore = useContext(AuthContext);
  useAnkiContextProvider();

  const navigate = useNavigate();

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
        handleSignInClick$={$(async () => authStore.showSignInModal(authStore))}
      />

      <div class={styles.slot}>
        <Slot />
      </div>
      <SigninContainer />
    </>
  );
});

export const head: DocumentHead = {
  title: "Internal",
  meta: [],
};
