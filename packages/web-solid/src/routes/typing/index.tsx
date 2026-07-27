import { Meta, Title } from "@solidjs/meta";

import { TypingContainer } from "~/container/typing-container";

export default function TypingRoute() {
  return (
    <>
      <Title>Typing | Internal</Title>
      <Meta name="description" content="Practice saved typing exercises" />
      <TypingContainer />
    </>
  );
}
