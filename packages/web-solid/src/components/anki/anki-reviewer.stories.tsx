import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { fn } from "storybook/test";
import {
  AnkiReviewer,
  type AnkiReviewerProps,
  type AnkiCard,
} from "./anki-reviewer";

// A minimal valid A2UI surface — enough for the block chrome to render.
const emptySurface = { root: "root", components: {} };

const sampleCard: AnkiCard = {
  pageId: "demo-page-id",
  url: "https://www.notion.so/demo",
  isReviewRequired: false,
  loading: false,
  block: {
    front: emptySurface,
    back: emptySurface,
    explanation: emptySurface,
  },
};

const meta: Meta<AnkiReviewerProps> = {
  title: "Components/Anki/anki-reviewer",
  component: AnkiReviewer,
  tags: ["autodocs"],
  args: {
    queueCount: 12,
    shouldLearnCount: 3,
    createLoading: false,
    reviewLoading: false,
    onEdit: fn(),
    onCreate: fn(),
    onReview: fn(),
    onRefresh: fn(),
    onRate: fn(),
  },
  argTypes: {
    queueCount: { control: "number" },
    shouldLearnCount: { control: "number" },
    createLoading: { control: "boolean" },
    reviewLoading: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<AnkiReviewerProps>;

/** A card is loaded; press Enter (or "Show Answer") to reveal Back/Explanation. */
export const Primary: Story = {
  args: {
    card: sampleCard,
  },
};

/** Review-required card — the middle control shows the alert icon. */
export const ReviewRequired: Story = {
  args: {
    card: { ...sampleCard, isReviewRequired: true },
  },
};

/** Queue is (re)loading: no current card, controls fall back to loading state. */
export const Loading: Story = {
  args: {
    card: null,
  },
};
