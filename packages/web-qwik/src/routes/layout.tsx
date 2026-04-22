import { component$, Slot } from "@builder.io/qwik";
import { Header } from "~/components/common/header";

export default component$(() => {
  return (
    <div>
      <Header links={[]} />
      <Slot />
    </div>
  );
});
