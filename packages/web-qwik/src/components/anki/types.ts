/** The three A2UI surfaces that make up a card. */
export interface AnkiBlockData {
  front: unknown;
  back: unknown;
  explanation: unknown;
}

/** The card currently under review. */
export interface AnkiCard {
  pageId: string;
  url?: string | null;
  isReviewRequired: boolean;
  /** The card's block is being (re)fetched. */
  loading: boolean;
  /** `null` until the block has loaded. */
  block: AnkiBlockData | null;
}
