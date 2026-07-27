// @vitest-environment happy-dom

import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { describe, expect, it, vi } from "vitest";

import { createTypingSession } from "./create-typing-session";

describe("createTypingSession", () => {
  it("tracks character state, progress, and accuracy", () => {
    const { result: session } = renderHook(() =>
      createTypingSession({ text: () => "cat" }),
    );

    session.setValue("cr");

    expect(session.status()).toBe("typing");
    expect(session.progress()).toBe(67);
    expect(session.accuracy()).toBe(50);
    expect(session.characters().map((character) => character.state)).toEqual([
      "correct",
      "incorrect",
      "current",
    ]);
  });

  it("updates elapsed time and WPM while typing", () => {
    let timestamp = 1_000;
    const { result: session } = renderHook(() =>
      createTypingSession({
        text: () => "hello",
        now: () => timestamp,
      }),
    );

    session.setValue("h");
    timestamp = 31_000;
    session.setValue("he");

    expect(session.elapsedMs()).toBe(30_000);
    expect(session.wordsPerMinute()).toBe(1);
  });

  it("keeps corrected mistakes in the accuracy calculation", () => {
    const { result: session } = renderHook(() =>
      createTypingSession({ text: () => "cat" }),
    );

    session.setValue("c");
    session.setValue("cx");
    session.setValue("c");
    session.setValue("ca");
    session.setValue("cat");

    expect(session.accuracy()).toBe(75);
  });

  it("requires mistakes to be corrected before completing", () => {
    const onComplete = vi.fn();
    const { result: session } = renderHook(() =>
      createTypingSession({ text: () => "cat", onComplete }),
    );

    session.setValue("car");

    expect(session.status()).toBe("typing");
    expect(onComplete).not.toHaveBeenCalled();

    session.setValue("cat");

    expect(session.status()).toBe("complete");
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("reports deterministic completion statistics once per attempt", () => {
    let timestamp = 1_000;
    const onComplete = vi.fn();
    const { result: session } = renderHook(() =>
      createTypingSession({
        text: () => "hello",
        now: () => timestamp,
        onComplete,
      }),
    );

    session.setValue("h");
    timestamp = 61_000;
    session.setValue("hello");
    session.setValue("hello");

    expect(session.result()).toEqual({
      accuracy: 100,
      correctCharacters: 5,
      durationMs: 60_000,
      totalCharacters: 5,
      wordsPerMinute: 1,
    });
    expect(onComplete).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith(session.result());
  });

  it("resets when the target text changes", async () => {
    const [text, setText] = createSignal("first");
    const { result: session } = renderHook(() => createTypingSession({ text }));

    session.setValue("fir");
    setText("second");
    await Promise.resolve();

    expect(session.value()).toBe("");
    expect(session.status()).toBe("idle");
    expect(
      session
        .characters()
        .map((character) => character.value)
        .join(""),
    ).toBe("second");
  });

  it("clears an attempt with reset", () => {
    const { result: session } = renderHook(() =>
      createTypingSession({ text: () => "reset" }),
    );

    session.setValue("res");
    session.reset();

    expect(session.value()).toBe("");
    expect(session.progress()).toBe(0);
    expect(session.accuracy()).toBe(100);
  });
});
