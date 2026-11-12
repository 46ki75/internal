import { cleanup, render, waitFor } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/solid-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ GET: vi.fn(), POST: vi.fn() }));
const auth = vi.hoisted(() => ({ accessToken: vi.fn(), refresh: vi.fn() }));
const exercises = [
  { id: "first", text: "cat", url: "https://app.notion.com/p/first-sentence" },
  {
    id: "second",
    text: "dog",
    url: "https://app.notion.com/p/second-sentence",
  },
].map((exercise) => ({
  ...exercise,
  description: `Description ${exercise.id}`,
  tts: `https://example.com/${exercise.id}.mp3`,
  surface: {
    root: "root",
    components: {
      root: { id: "root", component: "Paragraph", children: [exercise.id] },
      [exercise.id]: {
        id: exercise.id,
        component: "RichText",
        text: exercise.text,
        decoration: ["bold"],
      },
    },
  },
}));
vi.mock("~/openapi/client", () => ({ openApiClient: api }));
vi.mock("~/context/auth-context", () => ({ useAuth: () => auth }));
// Exercise the real Typing/audio integration; external Node imports cannot load token CSS.
vi.mock("@elmethis/core/tokens.css", () => ({}));

import { TypingContainer } from "./typing-container";

beforeEach(() => {
  vi.spyOn(Math, "random").mockReturnValue(0.99);
  auth.accessToken.mockReturnValue("access-token");
  auth.refresh.mockResolvedValue(undefined);
  api.GET.mockResolvedValue({ data: exercises });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});

function renderContainer() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(() => (
    <QueryClientProvider client={client}>
      <TypingContainer />
    </QueryClientProvider>
  ));
}

it("links to the current sentence's Notion page and updates the link when advancing", async () => {
  const user = userEvent.setup();
  const result = renderContainer();
  await user.click(await result.findByRole("switch", { name: "Typing mode" }));
  expect(
    result.getByRole("region", { name: exercises[0].description }),
  ).toBeInTheDocument();
  expect(
    result
      .getByRole("region", { name: "Reference text" })
      .querySelector("strong"),
  ).toHaveTextContent("cat");
  expect(result.queryByRole("table")).not.toBeInTheDocument();
  expect(result.queryByText("Saved exercises")).not.toBeInTheDocument();
  const link = () =>
    result.getByRole("link", { name: "Open sentence in Notion" });
  expect(link()).toHaveAttribute("href", exercises[0].url);
  expect(link()).toHaveAttribute("target", "_blank");
  expect(link()).toHaveAttribute("rel", "noopener noreferrer");

  await user.type(result.getByRole("textbox", { name: "Your typing" }), "cat");
  expect(result.getByText("Text to type: dog")).toBeInTheDocument();
  expect(
    result.getByRole("region", { name: exercises[1].description }),
  ).toBeInTheDocument();
  expect(
    result
      .getByRole("region", { name: "Reference text" })
      .querySelector("strong"),
  ).toHaveTextContent("dog");
  expect(link()).toHaveAttribute("href", exercises[1].url);
  await user.click(result.getByRole("button", { name: "Next exercise" }));
  expect(result.getByText("Text to type: cat")).toBeInTheDocument();
  expect(link()).toHaveAttribute("href", exercises[0].url);
  expect(api.GET).toHaveBeenCalledExactlyOnceWith(
    "/api/v1/typing",
    expect.objectContaining({
      params: { header: { Authorization: "Bearer access-token" } },
    }),
  );
  expect(auth.refresh).toHaveBeenCalledOnce();
  expect(api.POST).not.toHaveBeenCalled();
});

it("defaults typing mode to off while keeping reference text, audio, and navigation available", async () => {
  const user = userEvent.setup();
  const result = renderContainer();
  const toggle = await result.findByRole("switch", { name: "Typing mode" });

  expect(toggle).not.toBeChecked();
  expect(result.queryByRole("textbox")).not.toBeInTheDocument();
  expect(result.queryByLabelText("Typing statistics")).not.toBeInTheDocument();
  expect(
    result.queryByRole("button", { name: "Reset line" }),
  ).not.toBeInTheDocument();
  expect(
    result.getByRole("region", { name: "Reference text" }),
  ).toHaveTextContent("cat");
  expect(result.getByLabelText("Sentence audio")).toBeInTheDocument();
  expect(
    result.getByRole("link", { name: "Open sentence in Notion" }),
  ).toBeInTheDocument();

  await user.click(result.getByRole("button", { name: "Next exercise" }));
  expect(
    result.getByRole("region", { name: "Reference text" }),
  ).toHaveTextContent("dog");
  expect(result.getByRole("switch", { name: "Typing mode" })).not.toBeChecked();
  expect(result.queryByRole("textbox")).not.toBeInTheDocument();
  expect(result.queryByText("Text to type: dog")).not.toBeInTheDocument();
  expect(
    result.getByRole("link", { name: "Open sentence in Notion" }),
  ).toHaveAttribute("href", exercises[1].url);
});

it("advances one card per d, l, or Right Arrow press only when typing mode is off", async () => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  const user = userEvent.setup();
  const result = renderContainer();
  await user.click(await result.findByRole("switch", { name: "Autoplay TTS" }));
  const nextButton = () =>
    result.getByRole("button", { name: "Next exercise" });
  const reference = () =>
    result.getByRole("region", { name: "Reference text" });

  expect(nextButton()).toHaveAttribute("aria-keyshortcuts", "d l ArrowRight");
  expect(reference()).toHaveTextContent("cat");
  for (const [key, text] of [
    ["d", "dog"],
    ["l", "cat"],
    ["{ArrowRight}", "dog"],
  ]) {
    await user.keyboard(key);
    expect(reference()).toHaveTextContent(text);
    expect(result.queryByRole("textbox")).not.toBeInTheDocument();
    expect(result.getByRole("switch", { name: "Autoplay TTS" })).toBeChecked();
    expect(
      result.getByLabelText<HTMLAudioElement>("Sentence audio").autoplay,
    ).toBe(true);
  }

  await user.click(result.getByRole("switch", { name: "Typing mode" }));
  expect(nextButton()).not.toHaveAttribute("aria-keyshortcuts");
  await user.keyboard("dl{ArrowRight}");
  expect(reference()).toHaveTextContent("dog");
  expect(result.getByRole("textbox", { name: "Your typing" })).toHaveValue(
    "dl",
  );

  await user.click(result.getByRole("switch", { name: "Typing mode" }));
  await user.keyboard("{ArrowRight}");
  expect(reference()).toHaveTextContent("cat");
  expect(result.queryByRole("textbox")).not.toBeInTheDocument();
});

it("replays the current exercise on h or a without advancing or enabling autoplay", async () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  const user = userEvent.setup();
  const result = renderContainer();
  await result.findByRole("switch", { name: "Typing mode" });

  for (const [index, key] of ["h", "a"].entries()) {
    const audio = result.getByLabelText<HTMLAudioElement>("Sentence audio");
    expect(audio.src).toBe(exercises[index].tts);
    audio.currentTime = 5;
    await user.keyboard(key);
    expect(audio.currentTime).toBe(0);
    expect(play).toHaveBeenCalledTimes(index + 1);
    expect(play.mock.contexts[index]).toBe(audio);
    expect(
      result.getByRole("region", { name: "Reference text" }),
    ).toHaveTextContent(exercises[index].text);
    expect(
      result.getByRole("switch", { name: "Autoplay TTS" }),
    ).not.toBeChecked();
    if (index === 0) {
      await user.click(result.getByRole("button", { name: "Next exercise" }));
    }
  }

  await user.click(result.getByRole("switch", { name: "Typing mode" }));
  await user.keyboard("ha");
  expect(result.getByRole("textbox", { name: "Your typing" })).toHaveValue(
    "ha",
  );
  expect(play).toHaveBeenCalledTimes(2);

  await user.click(result.getByRole("switch", { name: "Typing mode" }));
  await user.keyboard("h");
  expect(play).toHaveBeenCalledTimes(3);
  expect(play.mock.contexts[2]).toBe(result.getByLabelText("Sentence audio"));
});

it("preserves typing mode across exercises and hides typing UI when disabled", async () => {
  const user = userEvent.setup();
  const result = renderContainer();
  await result.findByRole("switch", { name: "Typing mode" });
  const input = () => result.getByRole("textbox", { name: "Your typing" });
  const toggle = () => result.getByRole("switch", { name: "Typing mode" });

  await user.click(toggle());
  expect(toggle()).toBeChecked();
  expect(input()).toHaveFocus();
  expect(
    result.getByRole("switch", { name: "Autoplay TTS" }),
  ).not.toBeChecked();

  await user.keyboard("cat");
  expect(result.getByText("Text to type: dog")).toBeInTheDocument();
  expect(toggle()).toBeChecked();
  expect(input()).toHaveFocus();

  await user.click(result.getByRole("button", { name: "Next exercise" }));
  expect(result.getByText("Text to type: cat")).toBeInTheDocument();
  expect(toggle()).toBeChecked();
  expect(input()).toHaveFocus();
  const audio = result.getByLabelText("Sentence audio");

  await user.click(toggle());
  expect(toggle()).not.toBeChecked();
  expect(result.queryByRole("textbox")).not.toBeInTheDocument();
  expect(result.queryByText("Text to type: cat")).not.toBeInTheDocument();
  expect(result.getByLabelText("Sentence audio")).toBe(audio);

  await user.click(result.getByRole("button", { name: "Next exercise" }));
  expect(
    result.getByRole("region", { name: "Reference text" }),
  ).toHaveTextContent("dog");
  expect(toggle()).not.toBeChecked();
  expect(result.queryByRole("textbox")).not.toBeInTheDocument();

  await user.click(toggle());
  expect(result.getByText("Text to type: dog")).toBeInTheDocument();
  expect(input()).toHaveValue("");
  expect(input()).toHaveFocus();
});

it("resets typing mode to off when the page is reopened", async () => {
  const user = userEvent.setup();
  const result = renderContainer();
  await user.click(await result.findByRole("switch", { name: "Typing mode" }));
  expect(result.getByRole("switch", { name: "Typing mode" })).toBeChecked();

  result.unmount();
  const reopened = renderContainer();
  expect(
    await reopened.findByRole("switch", { name: "Typing mode" }),
  ).not.toBeChecked();
  expect(reopened.queryByRole("textbox")).not.toBeInTheDocument();
});

it("defaults TTS autoplay to off while keeping manual playback available", async () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  const user = userEvent.setup();
  const result = renderContainer();
  const toggle = await result.findByRole("switch", { name: "Autoplay TTS" });
  const audio = result.getByLabelText<HTMLAudioElement>("Sentence audio");
  const practice = result.getByRole("region", {
    name: exercises[0].description,
  });

  expect(practice).toContainElement(toggle);
  expect(practice).toContainElement(audio);
  expect(toggle).not.toBeChecked();
  expect(audio.src).toBe(exercises[0].tts);
  expect(audio.autoplay).toBe(false);
  expect(audio.controls).toBe(true);
  expect(audio.muted).toBe(false);
  expect(play).not.toHaveBeenCalled();

  await user.click(result.getByRole("button", { name: "Next exercise" }));
  expect(
    result.getByRole("switch", { name: "Autoplay TTS" }),
  ).not.toBeChecked();
  expect(
    result.getByLabelText<HTMLAudioElement>("Sentence audio").autoplay,
  ).toBe(false);
  expect(play).not.toHaveBeenCalled();
});

it("starts TTS when enabled, preserves the choice across exercises, and pauses when disabled", async () => {
  const user = userEvent.setup();
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  const pause = vi.spyOn(HTMLMediaElement.prototype, "pause");
  const result = renderContainer();
  await result.findByRole("switch", { name: "Autoplay TTS" });
  const toggle = () => result.getByRole("switch", { name: "Autoplay TTS" });
  const firstAudio = result.getByLabelText<HTMLAudioElement>("Sentence audio");

  await user.click(toggle());
  expect(toggle()).toBeChecked();
  expect(firstAudio.autoplay).toBe(true);
  expect(firstAudio.muted).toBe(false);
  expect(play).toHaveBeenCalledOnce();
  expect(play.mock.contexts[0]).toBe(firstAudio);

  await user.click(result.getByRole("switch", { name: "Typing mode" }));
  await user.type(result.getByRole("textbox", { name: "Your typing" }), "cat");
  const secondAudio = result.getByLabelText<HTMLAudioElement>("Sentence audio");
  expect(secondAudio).not.toBe(firstAudio);
  expect(secondAudio.src).toBe(exercises[1].tts);
  expect(secondAudio.autoplay).toBe(true);
  expect(toggle()).toBeChecked();
  expect(pause.mock.contexts).toContain(firstAudio);

  await user.click(toggle());
  expect(toggle()).not.toBeChecked();
  expect(secondAudio.autoplay).toBe(false);
  expect(pause.mock.contexts).toContain(secondAudio);

  await user.click(result.getByRole("button", { name: "Next exercise" }));
  const nextAudio = result.getByLabelText<HTMLAudioElement>("Sentence audio");
  expect(nextAudio.autoplay).toBe(false);
  expect(play).toHaveBeenCalledOnce();

  result.unmount();
  expect(pause.mock.contexts).toContain(nextAudio);
});

it("supports keyboard toggling and resets autoplay to off when the page is reopened", async () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  const user = userEvent.setup();
  const result = renderContainer();
  const toggle = await result.findByRole("switch", { name: "Autoplay TTS" });
  toggle.focus();

  await user.keyboard(" ");
  expect(toggle).toBeChecked();
  expect(play).toHaveBeenCalledOnce();

  result.unmount();
  const reopened = renderContainer();
  expect(
    await reopened.findByRole("switch", { name: "Autoplay TTS" }),
  ).not.toBeChecked();
  expect(
    reopened.getByLabelText<HTMLAudioElement>("Sentence audio").autoplay,
  ).toBe(false);
});

it("keeps the autoplay choice when an exercise has no TTS", async () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  const pause = vi.spyOn(HTMLMediaElement.prototype, "pause");
  api.GET.mockResolvedValue({
    data: [{ ...exercises[0], tts: null }, exercises[1]],
  });
  const user = userEvent.setup();
  const result = renderContainer();
  const toggle = await result.findByRole("switch", { name: "Autoplay TTS" });

  await user.click(toggle);
  expect(toggle).toBeChecked();
  expect(play).not.toHaveBeenCalled();
  expect(result.queryByLabelText("Sentence audio")).not.toBeInTheDocument();

  await user.click(result.getByRole("button", { name: "Next exercise" }));
  const audio = result.getByLabelText<HTMLAudioElement>("Sentence audio");
  expect(audio.autoplay).toBe(true);

  await user.click(result.getByRole("button", { name: "Next exercise" }));
  expect(result.queryByLabelText("Sentence audio")).not.toBeInTheDocument();
  expect(pause.mock.contexts).toContain(audio);
  const currentToggle = result.getByRole("switch", { name: "Autoplay TTS" });
  expect(currentToggle).toBeChecked();
  await user.click(currentToggle);
  expect(currentToggle).not.toBeChecked();
});

it("handles rejected autoplay requests without interrupting typing or hiding manual controls", async () => {
  const play = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockRejectedValue(
      new DOMException("Playback is blocked", "NotAllowedError"),
    );
  const user = userEvent.setup();
  const result = renderContainer();
  const toggle = await result.findByRole("switch", { name: "Autoplay TTS" });

  await user.click(toggle);
  expect(play).toHaveBeenCalledOnce();
  expect(
    result.getByLabelText<HTMLAudioElement>("Sentence audio").controls,
  ).toBe(true);
  await user.click(result.getByRole("switch", { name: "Typing mode" }));
  await user.type(result.getByRole("textbox", { name: "Your typing" }), "cat");
  expect(result.getByText("Text to type: dog")).toBeInTheDocument();
});

it.each([undefined, null, ""])(
  "omits the player when the current sentence has tts=%s",
  async (tts) => {
    api.GET.mockResolvedValue({
      data: [{ ...exercises[0], tts }, exercises[1]],
    });
    const user = userEvent.setup();
    const result = renderContainer();
    await result.findByRole("switch", { name: "Typing mode" });
    expect(result.queryByLabelText("Sentence audio")).not.toBeInTheDocument();

    await user.click(result.getByRole("button", { name: "Next exercise" }));
    const audio = result.getByLabelText<HTMLAudioElement>("Sentence audio");
    expect(audio.src).toBe(exercises[1].tts);
    expect(audio.autoplay).toBe(false);
    expect(audio.muted).toBe(false);
  },
);

it("passes straight apostrophes to typing practice without changing API data", async () => {
  const text = "It’s the dog’s toy.";
  const sentence = {
    ...exercises[0],
    text,
    surface: {
      root: "root",
      components: {
        root: {
          id: "root",
          component: "RichText",
          text,
          decoration: ["italic"],
        },
      },
    },
  };
  api.GET.mockResolvedValue({ data: [sentence] });
  const result = renderContainer();
  await userEvent
    .setup()
    .click(await result.findByRole("switch", { name: "Typing mode" }));

  await waitFor(() =>
    expect(
      result.getByText("Text to type: It's the dog's toy."),
    ).toBeInTheDocument(),
  );
  expect(sentence.text).toBe(text);
  expect(
    result.getByRole("region", { name: "Reference text" }),
  ).toHaveTextContent(text);
  expect(sentence.surface.components.root.text).toBe(text);
  expect(
    result.getByRole("link", { name: "Open sentence in Notion" }),
  ).toHaveAttribute("href", sentence.url);
});

it.each([undefined, ""])(
  "keeps the link clickable when an older response has url=%s",
  async (url) => {
    api.GET.mockResolvedValue({
      data: [{ id: "680008c4-d898-4202-8102-137cd9256595", text: "cat", url }],
    });
    const result = renderContainer();
    const link = await result.findByRole("link", {
      name: "Open sentence in Notion",
    });
    expect(link).toHaveAttribute(
      "href",
      "https://www.notion.so/680008c4d89842028102137cd9256595",
    );
    expect(link).toHaveAttribute("target", "_blank");
  },
);

it("does not fetch exercises or show a page link when signed out", () => {
  auth.accessToken.mockReturnValue(undefined);
  const result = renderContainer();
  expect(
    result.getByText("Sign in to load typing exercises."),
  ).toBeInTheDocument();
  expect(result.queryByRole("link")).not.toBeInTheDocument();
  expect(api.GET).not.toHaveBeenCalled();
});

it("does not show a page link when there is no current sentence", async () => {
  api.GET.mockResolvedValue({ data: [] });
  const result = renderContainer();
  expect(
    await result.findByText("No typing exercises are available."),
  ).toBeInTheDocument();
  expect(result.queryByRole("button")).not.toBeInTheDocument();
  expect(result.queryByRole("switch")).not.toBeInTheDocument();
  expect(result.queryByLabelText("Sentence audio")).not.toBeInTheDocument();
  expect(result.queryByRole("link")).not.toBeInTheDocument();
});

it("renders fetch failures without a page link", async () => {
  api.GET.mockRejectedValue(new Error("Notion is unavailable"));
  const result = renderContainer();
  expect(await result.findByRole("alert")).toHaveTextContent(
    "Notion is unavailable",
  );
  expect(result.queryByRole("link")).not.toBeInTheDocument();
});
