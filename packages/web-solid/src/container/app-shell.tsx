import { createModal } from "@elmethis/solid";
import {
  mdiCertificate,
  mdiCreation,
  mdiFaceMan,
  mdiHome,
  mdiLightbulbOnOutline,
  mdiPaletteSwatch,
  mdiTag,
  mdiTextBoxCheckOutline,
} from "@mdi/js";
import { Show, type ParentProps } from "solid-js";

import { Header } from "~/components/common/header";
import { Signin } from "~/components/common/signin";
import { useAuth } from "~/context/auth-context";
import styles from "~/routes/root-layout.module.css";

const links = [
  { d: mdiHome, href: "/", label: "Home" },
  { d: mdiTag, href: "/anki", label: "Anki" },
  { d: mdiLightbulbOnOutline, href: "/trivia", label: "Trivia" },
  { d: mdiPaletteSwatch, href: "/swatch", label: "Swatches" },
  { d: mdiFaceMan, href: "/icon", label: "Icons" },
  {
    d: mdiTextBoxCheckOutline,
    href: "/writing-assessments",
    label: "Writing assessments",
  },
  { d: mdiCreation, href: "/chat", label: "Chat" },
  {
    d: mdiCertificate,
    href: "/practical_test_en.html",
    label: "Practical test",
    native: true,
  },
];

export const AppShell = (props: ParentProps) => {
  const auth = useAuth();
  const { Modal, show } = createModal();

  return (
    <>
      <Header
        links={links}
        state={auth.sessionState()}
        onSignOut={() => void auth.signOut()}
        onSignIn={show}
      />
      <main class={styles["layout-slot"]}>{props.children}</main>
      <Modal>
        <Signin
          isLoading={
            auth.sessionState() === "pending" || auth.signingInProgress()
          }
          isDisabled={auth.sessionState() === "login"}
          error={auth.errors()[0]}
          onSubmit={auth.signIn}
        />
        <Show when={auth.sessionState() === "login"}>Signed in</Show>
      </Modal>
    </>
  );
};
