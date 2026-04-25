import { $, component$, Slot, useContext } from "@builder.io/qwik";
import { Header } from "~/components/common/header";
import { SigninContainer } from "~/container/signin-container";
import { useAnkiContextProvider } from "~/context/anki-context";
import { AuthContext } from "~/context/auth-context";

export default component$(() => {
  const authStore = useContext(AuthContext);
  useAnkiContextProvider();

  return (
    <>
      <Header
        links={[]}
        state={authStore.sessionState}
        handleSignOutClick$={$(async () => authStore.signOut(authStore))}
        handleSignInClick$={$(async () => authStore.showSignInModal(authStore))}
      />
      <Slot />
      <SigninContainer />
    </>
  );
});
