import {
  component$,
  Slot,
  useContextProvider,
  useStore,
} from "@builder.io/qwik";
import { Header } from "~/components/common/header";
import { AuthContext, AuthStore } from "~/context/auth-context";

export default component$(() => {
  const authStore = useStore<AuthStore>({ state: "pending" });

  useContextProvider(AuthContext, authStore);

  return (
    <div>
      <Header links={[]} state={authStore.state} />
      <Slot />
    </div>
  );
});
