// @vitest-environment happy-dom

import { cleanup, fireEvent, render } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { createSignal, Show, type JSX, type ParentProps } from "solid-js";
import { afterEach, expect, it, vi } from "vitest";

vi.mock("@elmethis/solid", () => ({
  ElmA2ui: (props: { messages: object[] }) => (
    <pre aria-label="Rendered A2UI">{JSON.stringify(props.messages)}</pre>
  ),
  notionBlockCatalog: {},
  ElmButton: (
    props: ParentProps<{
      onClick?: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
      primary?: boolean;
      type?: "button" | "submit" | "reset";
    }>,
  ) => (
    <button type={props.type} onClick={(event) => props.onClick?.(event)}>
      {props.children}
    </button>
  ),
  ElmHeading: (props: ParentProps<{ id?: string; level: number }>) => (
    <h1 id={props.id}>{props.children}</h1>
  ),
  ElmInlineText: (
    props: ParentProps<{ class?: string; color?: string; size?: string }>,
  ) => <span class={props.class}>{props.children}</span>,
  ElmTextArea: (
    props: JSX.TextareaHTMLAttributes<HTMLTextAreaElement> & {
      label: string;
      ref?: (element: HTMLTextAreaElement) => void;
    },
  ) => (
    <label>
      {props.label}
      <textarea
        ref={props.ref}
        id={props.id}
        rows={props.rows}
        aria-label={props["aria-label"]}
        aria-describedby={props["aria-describedby"]}
        autocomplete={props.autocomplete}
        autocapitalize={props.autocapitalize}
        spellcheck={props.spellcheck}
        value={props.value ?? ""}
        onInput={(event) => {
          if (typeof props.onInput === "function") {
            props.onInput(event);
          } else if (props.onInput) {
            props.onInput[0](props.onInput[1], event);
          }
        }}
      />
    </label>
  ),
}));

import { Typing } from "./typing";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it("defaults typing mode to off and hides typing UI while showing the reference", () => {
  const onNext = vi.fn();
  const result = render(() => <Typing text="cat" onNext={onNext} />);

  expect(result.queryByRole("textbox")).not.toBeInTheDocument();
  expect(result.queryByText("Text to type: cat")).not.toBeInTheDocument();
  expect(result.queryByLabelText("Typing statistics")).not.toBeInTheDocument();
  expect(result.queryByText("3 glyphs")).not.toBeInTheDocument();
  expect(
    result.queryByText("Correct each mistake to finish the exercise."),
  ).not.toBeInTheDocument();
  expect(
    result.queryByRole("button", { name: "Reset line" }),
  ).not.toBeInTheDocument();
  expect(result.queryByRole("status")).not.toBeInTheDocument();
  expect(result.getByRole("switch", { name: "Typing mode" })).not.toBeChecked();
  expect(
    result.queryByRole("switch", { name: "Autofocus" }),
  ).not.toBeInTheDocument();
  expect(
    result.getByRole("region", { name: "Reference text" }),
  ).toHaveTextContent("cat");
  expect(
    result.getByRole("button", { name: "Next exercise" }),
  ).toBeInTheDocument();
});

it.each(["d", "l", "ArrowRight"])(
  "advances on %s only while typing mode is off and removes the shortcut on unmount",
  (key) => {
    const onNext = vi.fn();
    const [typingMode, setTypingMode] = createSignal(false);
    const result = render(() => (
      <Typing text="cat" typingMode={typingMode()} onNext={onNext} />
    ));

    expect(fireEvent.keyDown(document.body, { key })).toBe(false);
    expect(onNext).toHaveBeenCalledOnce();

    setTypingMode(true);
    expect(fireEvent.keyDown(document.body, { key })).toBe(true);
    expect(onNext).toHaveBeenCalledOnce();

    setTypingMode(false);
    expect(fireEvent.keyDown(document.body, { key })).toBe(false);
    expect(onNext).toHaveBeenCalledTimes(2);

    result.unmount();
    expect(fireEvent.keyDown(document.body, { key })).toBe(true);
    expect(onNext).toHaveBeenCalledTimes(2);
  },
);

it("uses the current next callback and leaves keys alone when no next exercise is available", () => {
  const firstNext = vi.fn();
  const secondNext = vi.fn();
  const [onNext, setOnNext] = createSignal<(() => void) | undefined>();
  render(() => <Typing text="cat" onNext={onNext()} />);

  expect(fireEvent.keyDown(document.body, { key: "d" })).toBe(true);
  setOnNext(() => firstNext);
  expect(fireEvent.keyDown(document.body, { key: "l" })).toBe(false);
  expect(firstNext).toHaveBeenCalledOnce();

  setOnNext(() => secondNext);
  expect(fireEvent.keyDown(document.body, { key: "ArrowRight" })).toBe(false);
  expect(firstNext).toHaveBeenCalledOnce();
  expect(secondNext).toHaveBeenCalledOnce();

  setOnNext(undefined);
  expect(fireEvent.keyDown(document.body, { key: "d" })).toBe(true);
  expect(secondNext).toHaveBeenCalledOnce();
});

it("ignores modified, repeated, composing, handled, and unrelated key presses", () => {
  const onNext = vi.fn();
  render(() => <Typing text="cat" onNext={onNext} />);
  const ignoredOptions: KeyboardEventInit[] = [
    { altKey: true },
    { ctrlKey: true },
    { metaKey: true },
    { shiftKey: true },
    { repeat: true },
    { isComposing: true },
  ];

  for (const key of ["d", "l", "ArrowRight"]) {
    for (const options of ignoredOptions) {
      expect(fireEvent.keyDown(document.body, { key, ...options })).toBe(true);
    }
    const handled = new KeyboardEvent("keydown", {
      key,
      bubbles: true,
      cancelable: true,
    });
    handled.preventDefault();
    fireEvent(document.body, handled);
  }
  for (const key of ["h", "ArrowLeft", "Enter", " "]) {
    expect(fireEvent.keyDown(document.body, { key })).toBe(true);
  }
  expect(onNext).not.toHaveBeenCalled();
});

it("leaves keystrokes in editors and media controls alone", () => {
  const onNext = vi.fn();
  const result = render(() => (
    <>
      <input aria-label="Shortcut target input" />
      <textarea aria-label="Shortcut target textarea" />
      <select aria-label="Shortcut target select">
        <option>Option</option>
      </select>
      <input type="range" aria-label="Shortcut target range" />
      <div contentEditable tabIndex={0} aria-label="Shortcut target editor">
        <span aria-label="Shortcut target editor child">Editable text</span>
      </div>
      <div
        role="textbox"
        tabIndex={0}
        aria-label="Shortcut target custom textbox"
      />
      <audio controls aria-label="Shortcut target audio" />
      <video controls aria-label="Shortcut target video" />
      <Typing text="cat" onNext={onNext} />
    </>
  ));

  for (const target of result.getAllByLabelText(/^Shortcut target/)) {
    for (const key of ["d", "l", "ArrowRight"]) {
      expect(fireEvent.keyDown(target, { key })).toBe(true);
    }
  }
  expect(onNext).not.toHaveBeenCalled();
});

it("supports keyboard toggling of typing mode and focuses the input when enabled or reset", async () => {
  const user = userEvent.setup();
  const result = render(() => <Typing text="cat" />);
  const toggle = result.getByRole("switch", { name: "Typing mode" });

  toggle.focus();
  await user.keyboard(" ");
  const input = result.getByRole("textbox", { name: "Your typing" });
  expect(toggle).toBeChecked();
  expect(input).toHaveFocus();
  expect(result.getByText("Text to type: cat")).toBeInTheDocument();
  expect(result.getByLabelText("Typing statistics")).toBeInTheDocument();
  expect(result.getByText("3 glyphs")).toBeInTheDocument();

  await user.type(input, "c");
  await user.click(result.getByRole("button", { name: "Reset line" }));
  expect(input).toHaveValue("");
  expect(input).toHaveFocus();
  await user.type(input, "ca");

  toggle.focus();
  await user.keyboard(" ");
  expect(toggle).not.toBeChecked();
  expect(toggle).toHaveFocus();
  expect(input).not.toBeInTheDocument();
  expect(result.queryByLabelText("Typing statistics")).not.toBeInTheDocument();
  expect(
    result.queryByRole("button", { name: "Reset line" }),
  ).not.toBeInTheDocument();

  await user.keyboard(" ");
  const nextInput = result.getByRole("textbox", { name: "Your typing" });
  expect(nextInput).toHaveValue("");
  expect(nextInput).toHaveFocus();
  expect(result.getByLabelText("Typing statistics")).toHaveTextContent(
    "Progress0%",
  );
});

it("uses the parent-owned typing mode and handles text changes while it is off", () => {
  const [typingMode, setTypingMode] = createSignal(true);
  const [text, setText] = createSignal("cat");
  const result = render(() => (
    <Typing text={text()} typingMode={typingMode()} />
  ));
  const input = result.getByRole("textbox", { name: "Your typing" });
  const toggle = result.getByRole("switch", { name: "Typing mode" });

  expect(toggle).toBeChecked();
  expect(input).toHaveFocus();

  setTypingMode(false);
  expect(toggle).not.toBeChecked();
  expect(input).not.toBeInTheDocument();
  setText("dog");
  expect(
    result.getByRole("region", { name: "Reference text" }),
  ).toHaveTextContent("dog");
  expect(result.queryByRole("textbox")).not.toBeInTheDocument();

  setTypingMode(true);
  expect(toggle).toBeChecked();
  expect(result.getByText("Text to type: dog")).toBeInTheDocument();
  expect(result.getByRole("textbox", { name: "Your typing" })).toHaveValue("");
  expect(result.getByRole("textbox", { name: "Your typing" })).toHaveFocus();
});

it("clears completion feedback when leaving typing mode", async () => {
  const user = userEvent.setup();
  const onComplete = vi.fn();
  const result = render(() => <Typing text="cat" onComplete={onComplete} />);
  const toggle = result.getByRole("switch", { name: "Typing mode" });

  await user.click(toggle);
  await user.keyboard("cat");
  expect(result.getByRole("status")).toHaveTextContent("Line complete.");
  expect(onComplete).toHaveBeenCalledOnce();

  await user.click(toggle);
  expect(result.queryByRole("status")).not.toBeInTheDocument();
  await user.click(toggle);
  expect(result.queryByRole("status")).not.toBeInTheDocument();
  expect(result.getByRole("textbox", { name: "Your typing" })).toHaveValue("");
  expect(onComplete).toHaveBeenCalledOnce();
});

it("renders sentence audio and its default-off autoplay control inside typing practice", () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  const result = render(() => (
    <Typing text="cat" audioSrc="https://example.com/cat.mp3" />
  ));
  const practice = result.getByRole("region", { name: "Typing practice" });
  const toggle = result.getByRole("switch", { name: "Autoplay TTS" });
  const audio = result.getByLabelText<HTMLAudioElement>("Sentence audio");

  expect(practice).toContainElement(toggle);
  expect(practice).toContainElement(audio);
  expect(toggle).not.toBeChecked();
  expect(audio.src).toBe("https://example.com/cat.mp3");
  expect(audio.autoplay).toBe(false);
  expect(audio.controls).toBe(true);
  expect(audio.muted).toBe(false);
  expect(audio.preload).toBe("none");
  expect(play).not.toHaveBeenCalled();
});

it("starts audio on opt-in and pauses it when autoplay is switched off with the keyboard", async () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  const pause = vi.spyOn(HTMLMediaElement.prototype, "pause");
  const user = userEvent.setup();
  const result = render(() => (
    <Typing text="cat" audioSrc="https://example.com/cat.mp3" />
  ));
  const toggle = result.getByRole("switch", { name: "Autoplay TTS" });
  const audio = result.getByLabelText<HTMLAudioElement>("Sentence audio");

  await user.click(toggle);
  expect(toggle).toBeChecked();
  expect(audio.autoplay).toBe(true);
  expect(play).toHaveBeenCalledOnce();
  expect(play.mock.contexts[0]).toBe(audio);

  toggle.focus();
  await user.keyboard(" ");
  expect(toggle).not.toBeChecked();
  expect(audio.autoplay).toBe(false);
  expect(pause.mock.contexts).toContain(audio);

  result.unmount();
  expect(pause.mock.contexts).toContain(audio);
});

it("uses the parent-owned autoplay preference across audio source changes", async () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  const pause = vi.spyOn(HTMLMediaElement.prototype, "pause");
  const [audioSrc, setAudioSrc] = createSignal<string | null>(
    "https://example.com/cat.mp3",
  );
  const [autoplayTts, setAutoplayTts] = createSignal(false);
  const onAutoplayTtsChange = vi.fn((enabled: boolean) =>
    setAutoplayTts(enabled),
  );
  const user = userEvent.setup();
  const result = render(() => (
    <Typing
      text="cat"
      audioSrc={audioSrc()}
      autoplayTts={autoplayTts()}
      onAutoplayTtsChange={onAutoplayTtsChange}
    />
  ));
  const toggle = result.getByRole("switch", { name: "Autoplay TTS" });
  const firstAudio = result.getByLabelText<HTMLAudioElement>("Sentence audio");

  await user.click(toggle);
  expect(onAutoplayTtsChange).toHaveBeenCalledExactlyOnceWith(true);
  expect(play).toHaveBeenCalledOnce();

  setAudioSrc("https://example.com/dog.mp3");
  const secondAudio = result.getByLabelText<HTMLAudioElement>("Sentence audio");
  expect(secondAudio).not.toBe(firstAudio);
  expect(secondAudio.src).toBe("https://example.com/dog.mp3");
  expect(secondAudio.autoplay).toBe(true);
  expect(pause.mock.contexts).toContain(firstAudio);

  setAudioSrc(null);
  expect(result.queryByLabelText("Sentence audio")).not.toBeInTheDocument();
  expect(toggle).toBeChecked();
  expect(pause.mock.contexts).toContain(secondAudio);

  setAudioSrc("https://example.com/cat.mp3");
  const nextAudio = result.getByLabelText<HTMLAudioElement>("Sentence audio");
  expect(nextAudio.autoplay).toBe(true);

  setAutoplayTts(false);
  expect(toggle).not.toBeChecked();
  expect(nextAudio.autoplay).toBe(false);
  expect(pause.mock.contexts).toContain(nextAudio);
});

it("keeps manual controls and typing usable when audio playback is rejected", async () => {
  const play = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockRejectedValue(
      new DOMException("Playback is blocked", "NotAllowedError"),
    );
  const user = userEvent.setup();
  const result = render(() => (
    <Typing text="cat" audioSrc="https://example.com/cat.mp3" typingMode />
  ));

  await user.click(result.getByRole("switch", { name: "Autoplay TTS" }));
  expect(play).toHaveBeenCalledOnce();
  expect(
    result.getByLabelText<HTMLAudioElement>("Sentence audio").controls,
  ).toBe(true);

  await user.type(result.getByRole("textbox", { name: "Your typing" }), "cat");
  expect(result.getByRole("status")).toHaveTextContent(
    "3 of 3 characters match",
  );
});

it.each([undefined, null, ""])(
  "keeps the autoplay choice available without an audio source (%s)",
  async (audioSrc) => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, "play")
      .mockResolvedValue();
    const user = userEvent.setup();
    const result = render(() => <Typing text="cat" audioSrc={audioSrc} />);
    const toggle = result.getByRole("switch", { name: "Autoplay TTS" });

    expect(toggle).not.toBeChecked();
    expect(result.queryByLabelText("Sentence audio")).not.toBeInTheDocument();
    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(play).not.toHaveBeenCalled();
  },
);

it("renders typing feedback and resets the exercise", async () => {
  const user = userEvent.setup();
  const onComplete = vi.fn();
  const result = render(() => (
    <Typing
      text="cat"
      description="Short words"
      onComplete={onComplete}
      typingMode
    />
  ));
  const input = result.getByRole("textbox", { name: "Your typing" });

  await user.type(input, "car");

  expect(input).toHaveValue("car");
  expect(
    result.container.querySelectorAll('[data-state="incorrect"]'),
  ).toHaveLength(1);
  expect(result.getByText("67%")).toBeInTheDocument();
  expect(result.queryByRole("status")).not.toBeInTheDocument();
  expect(onComplete).not.toHaveBeenCalled();

  await user.type(input, "{Backspace}t");

  expect(result.getByRole("status")).toHaveTextContent(
    "3 of 3 characters match",
  );
  expect(onComplete).toHaveBeenCalledOnce();
  expect(result.getByText("75%")).toBeInTheDocument();

  await user.click(result.getByRole("button", { name: "Reset line" }));

  expect(input).toHaveValue("");
  expect(input).toHaveFocus();
});

it("displays the rich reference while using only plaintext for typing", async () => {
  const user = userEvent.setup();
  const surface = {
    root: "root",
    components: {
      root: { id: "root", component: "Column", children: ["reference"] },
      reference: {
        id: "reference",
        component: "Paragraph",
        children: ["word"],
      },
      word: {
        id: "word",
        component: "RichText",
        text: "cat",
        decoration: ["bold"],
      },
    },
  };
  const result = render(() => (
    <Typing text="cat" description="Short words" surface={surface} typingMode />
  ));

  expect(
    result.getByRole("region", { name: "Short words" }),
  ).toBeInTheDocument();
  expect(
    result.getByRole("region", { name: "Reference text" }),
  ).toBeInTheDocument();
  const surfaceId = `${result.getByRole("textbox", { name: "Your typing" }).id}-reference`;
  const messages: unknown = JSON.parse(
    result.getByLabelText("Rendered A2UI").textContent,
  );
  expect(messages).toEqual([
    expect.objectContaining({
      createSurface: expect.objectContaining({ surfaceId }),
    }),
    {
      version: "v0.9",
      updateComponents: {
        surfaceId,
        components: Object.values(surface.components),
      },
    },
  ]);
  expect(result.getByText("3 glyphs")).toBeInTheDocument();

  await user.type(result.getByRole("textbox", { name: "Your typing" }), "cat");
  expect(result.getByRole("status")).toHaveTextContent(
    "3 of 3 characters match",
  );
});

it("updates the description and formatted reference when props change", () => {
  const [word, setWord] = createSignal("cat");
  const result = render(() => (
    <Typing
      text={word()}
      typingMode
      description={`Practice ${word()}`}
      surface={{
        root: "root",
        components: {
          root: { id: "root", component: "RichText", text: word() },
        },
      }}
    />
  ));
  expect(result.getByLabelText("Rendered A2UI")).toHaveTextContent(
    '"text":"cat"',
  );

  setWord("dog");

  expect(
    result.getByRole("region", { name: "Practice dog" }),
  ).toBeInTheDocument();
  expect(result.getByLabelText("Rendered A2UI")).toHaveTextContent(
    '"text":"dog"',
  );
  expect(result.getByRole("textbox", { name: "Your typing" })).toHaveValue("");
});

it("uses graphemes consistently without a UTF-16 input limit", async () => {
  const user = userEvent.setup();
  const result = render(() => (
    <Typing text="👍a" description="Unicode" typingMode />
  ));
  const input = result.getByRole("textbox", {
    name: "Your typing",
  });

  expect(result.getByText("2 glyphs")).toBeInTheDocument();
  expect(input).not.toHaveAttribute("maxlength");

  await user.type(input, "👍a");

  expect(input).toHaveValue("👍a");
  expect(result.getByRole("status")).toHaveTextContent(
    "2 of 2 characters match",
  );

  await user.type(input, "x");

  expect(input).toHaveValue("👍a");
});

it("supports uninterrupted automatic advancement", async () => {
  const user = userEvent.setup();
  const exercises = [
    { description: "First exercise", text: "cat" },
    { description: "Second exercise", text: "dog" },
  ];

  const Sequence = () => {
    const [currentIndex, setCurrentIndex] = createSignal(0);
    const currentExercise = () => exercises[currentIndex()];

    return (
      <Show when={currentExercise()} keyed>
        {(exercise) => (
          <Typing
            text={exercise.text}
            description={exercise.description}
            typingMode
            onComplete={() => setCurrentIndex((index) => index + 1)}
          />
        )}
      </Show>
    );
  };

  const result = render(() => <Sequence />);

  await user.type(result.getByRole("textbox", { name: "Your typing" }), "cat");

  expect(
    result.getByRole("region", { name: "Second exercise" }),
  ).toBeInTheDocument();
  expect(result.getByRole("textbox", { name: "Your typing" })).toHaveValue("");
  expect(result.getByRole("textbox", { name: "Your typing" })).toHaveFocus();
});
