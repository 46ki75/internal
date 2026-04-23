import {
  component$,
  Slot,
  useContextProvider,
  useStore,
} from "@builder.io/qwik";
import { Header } from "~/components/common/header";
import { SigninContainer } from "~/container/signin-container";
import { AuthContext, AuthStore } from "~/context/auth-context";

export default component$(() => {
  const authStore = useStore<AuthStore>({
    sessionState: "pending",
    accessToken: null,
    signingInProgress: false,
  });

  useContextProvider(AuthContext, authStore);

  return (
    <div>
      <Header links={[]} state={authStore.sessionState} />
      <Slot />
      <SigninContainer />
    </div>
  );
});
