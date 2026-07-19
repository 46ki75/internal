import { Meta, Title } from "@solidjs/meta";
import { createMemo, type JSX } from "solid-js";

import { AnkiReviewer, type AnkiCard } from "~/components/anki/anki-reviewer";
import { useAnki } from "~/context/anki-context";

export interface IndexProps {
  class?: string;
  style?: JSX.CSSProperties;
}

export default function AnkiRoute(props: IndexProps) {
  const anki = useAnki();

  const currentAnki = createMemo(() =>
    anki.state.ankiList.currentIndex != null
      ? anki.state.ankiList.data[anki.state.ankiList.currentIndex]
      : null,
  );

  const card = createMemo<AnkiCard | null>(() => {
    const item = currentAnki();
    if (!item) return null;
    return {
      pageId: item.metadata.page_id,
      url: item.metadata.url,
      isReviewRequired: item.metadata.is_review_required,
      loading: item.loading,
      block: item.block,
    };
  });

  const queueCount = createMemo(() => anki.state.ankiList.data.length);

  const shouldLearnCount = createMemo(() => {
    const now = new Date();
    return anki.state.ankiList.data.reduce(
      (acc, { metadata }) =>
        new Date(metadata.next_review_at) <= now ? acc + 1 : acc,
      0,
    );
  });

  const open = () => {
    const url = currentAnki()?.metadata.url;
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  };

  const rate = (rating: number) => {
    const pageId = currentAnki()?.metadata.page_id;
    if (pageId) return anki.updateByRating(pageId, rating);
  };

  return (
    <>
      <Title>Anki | Internal</Title>
      <Meta name="description" content="Review and manage Anki cards" />
      <AnkiReviewer
        class={props.class}
        style={props.style}
        card={card()}
        queueCount={queueCount()}
        shouldLearnCount={shouldLearnCount()}
        createLoading={anki.state.create.loading}
        reviewLoading={anki.state.review.loading}
        onEdit={open}
        onCreate={anki.create}
        onReview={anki.review}
        onRefresh={() =>
          anki.fetchBlock(currentAnki()?.metadata.page_id, undefined, true)
        }
        onRate={rate}
      />
    </>
  );
}
