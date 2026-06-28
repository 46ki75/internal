import {
  $,
  component$,
  useComputed$,
  useContext,
  type CSSProperties,
} from "@qwik.dev/core";

import { AnkiContext, useAnkiActions } from "~/context/anki-context";
import { AnkiReviewer, type AnkiCard } from "~/components/anki/anki-reviewer";

export interface IndexProps {
  class?: string;

  style?: CSSProperties;
}

export default component$<IndexProps>(({ class: className, style }) => {
  const ankiStore = useContext(AnkiContext);
  const { updateByRating, create, review, fetchBlock } = useAnkiActions();

  const currentAnki = useComputed$(() =>
    ankiStore.ankiList.currentIndex != null
      ? ankiStore.ankiList.data[ankiStore.ankiList.currentIndex]
      : null,
  );

  // Project the store item onto the display component's card shape. Reading the
  // nested fields here subscribes this computed to them, so the reviewer
  // re-renders when the block loads or the review flag toggles.
  const card = useComputed$<AnkiCard | null>(() => {
    const item = currentAnki.value;
    if (!item) return null;
    return {
      pageId: item.metadata.page_id,
      url: item.metadata.url,
      isReviewRequired: item.metadata.is_review_required,
      loading: item.loading,
      block: item.block,
    };
  });

  const queueCount = useComputed$(() => ankiStore.ankiList.data.length);

  const shouldLearnCount = useComputed$(() => {
    const now = new Date();
    return ankiStore.ankiList.data.reduce(
      (acc, { metadata }) =>
        new Date(metadata.next_review_at) <= now ? acc + 1 : acc,
      0,
    );
  });

  const open = $(() => {
    const url = currentAnki.value?.metadata.url;
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  });

  const rate = $((rating: number) => {
    const pageId = currentAnki.value?.metadata.page_id;
    if (pageId) updateByRating(pageId, rating);
  });

  return (
    <AnkiReviewer
      class={className}
      style={style}
      card={card.value}
      queueCount={queueCount.value}
      shouldLearnCount={shouldLearnCount.value}
      createLoading={ankiStore.create.loading}
      reviewLoading={ankiStore.review.loading}
      onEdit$={open}
      onCreate$={$(() => create())}
      onReview$={$(() => review())}
      onRefresh$={$(() => fetchBlock(currentAnki.value?.metadata.page_id))}
      onRate$={rate}
    />
  );
});
