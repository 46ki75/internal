import {
  createEffect,
  createMemo,
  createSignal,
  on,
  type Accessor,
} from "solid-js";

export type TypingStatus = "idle" | "typing" | "complete";
export type TypingCharacterState =
  | "pending"
  | "current"
  | "correct"
  | "incorrect";

export interface TypingCharacter {
  index: number;
  value: string;
  state: TypingCharacterState;
}

export interface TypingResult {
  accuracy: number;
  correctCharacters: number;
  durationMs: number;
  totalCharacters: number;
  wordsPerMinute: number;
}

export interface TypingSessionOptions {
  text: Accessor<string>;
  now?: () => number;
  onComplete?: (result: TypingResult) => void;
}

export interface TypingSession {
  accuracy: Accessor<number>;
  characters: Accessor<readonly TypingCharacter[]>;
  elapsedMs: Accessor<number>;
  progress: Accessor<number>;
  result: Accessor<TypingResult>;
  setValue: (value: string) => void;
  status: Accessor<TypingStatus>;
  reset: () => void;
  value: Accessor<string>;
  wordsPerMinute: Accessor<number>;
}

const percentage = (value: number, total: number) =>
  total === 0 ? 0 : Math.round((value / total) * 100);

const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

export const splitTypingCharacters = (text: string) =>
  Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment);

export const createTypingSession = (
  options: TypingSessionOptions,
): TypingSession => {
  const now = options.now ?? Date.now;
  const [value, setValueSignal] = createSignal("");
  const [startedAt, setStartedAt] = createSignal<number | null>(null);
  const [lastInputAt, setLastInputAt] = createSignal<number | null>(null);
  const [completedAt, setCompletedAt] = createSignal<number | null>(null);
  const [attemptCount, setAttemptCount] = createSignal(0);
  const [correctAttemptCount, setCorrectAttemptCount] = createSignal(0);
  let completionNotified = false;

  const targetCharacters = createMemo(() =>
    splitTypingCharacters(options.text()),
  );
  const inputCharacters = createMemo(() => splitTypingCharacters(value()));
  const correctCharacters = createMemo(() => {
    const input = inputCharacters();
    const target = targetCharacters();
    return input.reduce(
      (total, character, index) => total + Number(character === target[index]),
      0,
    );
  });

  const status = createMemo<TypingStatus>(() => {
    const input = inputCharacters();
    const target = targetCharacters();
    if (startedAt() == null || target.length === 0) return "idle";
    if (
      input.length === target.length &&
      input.every((character, index) => character === target[index])
    ) {
      return "complete";
    }
    return "typing";
  });

  const elapsedMs = createMemo(() => {
    const start = startedAt();
    if (start == null) return 0;
    return Math.max(0, (completedAt() ?? lastInputAt() ?? start) - start);
  });

  const accuracy = createMemo(() =>
    attemptCount() === 0
      ? 100
      : percentage(correctAttemptCount(), attemptCount()),
  );

  const wordsPerMinute = createMemo(() => {
    const minutes = elapsedMs() / 60_000;
    if (minutes === 0) return 0;
    return Math.round(correctCharacters() / 5 / minutes);
  });

  const progress = createMemo(() =>
    Math.min(
      100,
      percentage(inputCharacters().length, targetCharacters().length),
    ),
  );

  const result = createMemo<TypingResult>(() => ({
    accuracy: accuracy(),
    correctCharacters: correctCharacters(),
    durationMs: elapsedMs(),
    totalCharacters: targetCharacters().length,
    wordsPerMinute: wordsPerMinute(),
  }));

  const characters = createMemo<readonly TypingCharacter[]>(() => {
    const input = inputCharacters();
    const isComplete = status() === "complete";

    return targetCharacters().map((character, index) => {
      let state: TypingCharacterState = "pending";
      if (index < input.length) {
        state = input[index] === character ? "correct" : "incorrect";
      } else if (index === input.length && !isComplete) {
        state = "current";
      }

      return { index, value: character, state };
    });
  });

  const reset = () => {
    setValueSignal("");
    setStartedAt(null);
    setLastInputAt(null);
    setCompletedAt(null);
    setAttemptCount(0);
    setCorrectAttemptCount(0);
    completionNotified = false;
  };

  const setValue = (nextValue: string) => {
    const normalizedValue = splitTypingCharacters(nextValue)
      .slice(0, targetCharacters().length)
      .join("");
    if (normalizedValue === value()) return;

    const timestamp = now();
    const previousInput = inputCharacters();
    const nextInput = splitTypingCharacters(normalizedValue);
    const target = targetCharacters();
    let prefixLength = 0;
    while (
      prefixLength < previousInput.length &&
      prefixLength < nextInput.length &&
      previousInput[prefixLength] === nextInput[prefixLength]
    ) {
      prefixLength += 1;
    }

    let suffixLength = 0;
    while (
      suffixLength < previousInput.length - prefixLength &&
      suffixLength < nextInput.length - prefixLength &&
      previousInput[previousInput.length - 1 - suffixLength] ===
        nextInput[nextInput.length - 1 - suffixLength]
    ) {
      suffixLength += 1;
    }

    const insertedCharacters = nextInput.slice(
      prefixLength,
      nextInput.length - suffixLength,
    );
    if (insertedCharacters.length > 0) {
      setAttemptCount((count) => count + insertedCharacters.length);
      setCorrectAttemptCount(
        (count) =>
          count +
          insertedCharacters.reduce(
            (total, character, index) =>
              total + Number(character === target[prefixLength + index]),
            0,
          ),
      );
    }

    const start = startedAt() ?? timestamp;
    if (startedAt() == null) setStartedAt(start);
    setLastInputAt(timestamp);
    setValueSignal(normalizedValue);

    const isComplete =
      nextInput.length === target.length &&
      nextInput.every((character, index) => character === target[index]);
    if (isComplete) {
      setCompletedAt(timestamp);
      if (!completionNotified) {
        completionNotified = true;
        options.onComplete?.(result());
      }
    } else {
      setCompletedAt(null);
    }
  };

  createEffect(on(options.text, reset, { defer: true }));

  return {
    accuracy,
    characters,
    elapsedMs,
    progress,
    result,
    setValue,
    status,
    reset,
    value,
    wordsPerMinute,
  };
};
