import { component$, Slot, useContext } from "@builder.io/qwik";
import { Header } from "~/components/common/header";
import { SigninContainer } from "~/container/signin-container";
import { AuthContext } from "~/context/auth-context";

export default component$(() => {
  const authStore = useContext(AuthContext);

  return (
    <>
      <Header
        links={[]}
        state={authStore.sessionState}
        handleSignOutClick$={authStore.signOut}
      />
      <Slot />
      <SigninContainer />
    </>
  );
});
