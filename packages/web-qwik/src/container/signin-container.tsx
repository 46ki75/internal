import {
  component$,
  useStore,
  useContextProvider,
  useVisibleTask$,
  $,
} from "@builder.io/qwik";
import { ElmModal } from "@elmethis/qwik";

import { AuthContext, AuthStore } from "~/context/auth-context";

export const SigninContainer = component$(() => {
  const authStore = useStore<AuthStore>({ state: "pending" });
  useContextProvider(AuthContext, authStore);

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {});

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const onClose = $((event: Event, element: HTMLDialogElement) => {
    alert("close");
  });

  return (
    <ElmModal
      style={{ width: "100%", height: "100%" }}
      isOpen={true}
      onClose$={onClose}
    >
      asfdafdas
    </ElmModal>
  );
});
