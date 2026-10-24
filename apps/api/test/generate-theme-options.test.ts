import { describe, expect, test } from "bun:test";
import { FakeProvider, type Provider, type ProviderChunk } from "@repo/agent-core";
import { THEME_OPTION_COUNT, ThemeOptionsResponse } from "@repo/contracts";
import { generateThemeOptions } from "../src/themes";

const HANGING_PROVIDER_TIMEOUT_MS = 20;

function hangingProvider(): Provider {
  return {
    model: "fake-model",
    stream(_messages, _tools, { signal }): AsyncIterable<ProviderChunk> {
      return {
        [Symbol.asyncIterator]: () => ({
          next: () =>
            new Promise((_resolve, reject) => {
              if (signal.aborted) {
                reject(signal.reason);
                return;
              }
              signal.addEventListener("abort", () => reject(signal.reason), { once: true });
            }),
        }),
      };
    },
  };
}

function rejectingProvider(error: unknown): Provider {
  return {
    model: "fake-model",
    async *stream(): AsyncIterable<ProviderChunk> {
      throw error;
    },
  };
}

function validTheme(
  name: string,
  extras: { style?: string; density?: string; voice?: string; summary?: string; dos?: string[]; donts?: string[] } = {},
) {
  return {
    name,
    tagline: "Warm and welcoming",
    mood: "light",
    style: extras.style ?? "warm bakery",
    density: extras.density ?? "spacious",
    voice: extras.voice ?? "Friendly and local.",
    summary: extras.summary ?? "A warm bakery system with cream grounds and one brand orange.",
    dos: extras.dos ?? ["Ink on cream for body copy.", "One hero number per screen."],
    donts: extras.donts ?? ["No white body copy on orange.", "No second typeface."],
    palette: {
      background: "#fffaf5",
      foreground: "#2b1a10",
      card: "#ffffff",
      primary: "#c2410c",
      primaryForeground: "#ffffff",
      secondary: "#fdebd8",
      secondaryForeground: "#2b1a10",
      accent: "#15803d",
      accentForeground: "#ffffff",
      muted: "#f6ece1",
      mutedForeground: "#6b5646",
      border: "#e8d9c8",
    },
    fonts: { heading: "Playfair Display", body: "Lato" },
    radius: "md",
  };
}

describe("generateThemeOptions", () => {
  test("returns AI design systems built from the prompt and answers", async () => {
    const names = ["Warm Loaf", "Dawn Counter", "Flour Dust", "Night Oven", "Paper Menu"];
    const provider = new FakeProvider([
      {
        kind: "text",
        text: JSON.stringify({ themes: names.map((name) => validTheme(name)) }),
      },
    ]);
    const result = await generateThemeOptions(
      {
        prompt: "a neighbourhood bakery with pickup orders",
        answers: { Ordering: "Pickup orders", Payment: "Pay at pickup" },
        questions: [
          { need: "ordering-mode", text: "How do customers order?", label: "Ordering" },
          { need: "payment-method", text: "How do they pay?", label: "Payment" },
        ],
      },
      provider,
    );
    expect(result.source).toBe("ai");
    expect(result.themes).toHaveLength(THEME_OPTION_COUNT);
    expect(result.themes[0]?.name).toBe("Warm Loaf");
    expect(result.themes[0]?.style).toBe("warm bakery");
    expect(result.themes[0]?.density).toBe("spacious");
    expect(result.themes[0]?.summary).toContain("cream grounds");
    expect(result.themes[0]?.dos?.[0]).toContain("Ink on cream");
    expect(result.themes[0]?.donts?.[0]).toContain("white body copy");
  });

  test("falls back to preset design systems when the model times out", async () => {
    const result = await generateThemeOptions(
      { prompt: "an ecommerce store for handmade jewellery" },
      hangingProvider(),
      AbortSignal.timeout(HANGING_PROVIDER_TIMEOUT_MS),
    );
    const parsed = ThemeOptionsResponse.parse(result);
    expect(parsed.source).toBe("preset");
    expect(parsed.themes).toHaveLength(THEME_OPTION_COUNT);
  });

  test("falls back to preset design systems when the model throws a timeout", async () => {
    const result = await generateThemeOptions(
      { prompt: "a home planning studio in Ranchi" },
      rejectingProvider(new DOMException("The operation timed out.", "TimeoutError")),
    );
    expect(ThemeOptionsResponse.parse(result).source).toBe("preset");
  });
});
