import { describe, expect, it } from "bun:test";
import { UnsplashPhoto } from "@repo/contracts";
import { BlueprintSchema } from "@repo/contracts";
import { detectAssetSlots } from "@repo/media";
import { photoSearchQuery } from "../src/assets/social-fallback";
import { stockSearchQuery, stockSearchWords } from "../src/assets/stock-query";
import { pickUnusedPhoto } from "../src/assets/unsplash/pick-unused-photo";

function arborSlots() {
  const blueprint = BlueprintSchema.parse({
    blueprintVersion: 1,
    intent: { type: "business-site", domain: "design group", complexity: "medium" },
    stack: { framework: "next", db: "none", orm: "none", auth: "authjs", styling: "tailwind" },
    pages: [
      {
        route: "/",
        purpose: "Single-page landing site for Arbor & Oak architecture, resort, furniture, and consultancy",
        components: ["Hero", "Gallery"],
      },
    ],
    theme: { preset: "warm", primary: "#b45309" },
  });
  return detectAssetSlots(blueprint);
}

function slot(purpose: "hero" | "gallery") {
  const found = arborSlots().find((entry) => entry.purpose === purpose);
  if (!found) throw new Error(`no ${purpose} slot`);
  return found;
}

function hubSlots() {
  const blueprint = BlueprintSchema.parse({
    blueprintVersion: 1,
    intent: { type: "business-site", domain: "design group", complexity: "medium" },
    stack: { framework: "next", db: "none", orm: "none", auth: "authjs", styling: "tailwind" },
    pages: [{ route: "/", purpose: "Single-page hub for all four business units", components: ["TopBanner", "StorySticky", "ArchitectureSection", "ResortSection", "ShopSection", "ConsultancySection", "Gallery"] }],
    theme: { preset: "warm", primary: "#b45309" },
  });
  return detectAssetSlots(blueprint);
}

describe("stockSearchQuery for a vague page purpose", () => {
  it("falls back on the page's component topics so the query is not just 'hub four units'", () => {
    const query = stockSearchQuery(hubSlots().find((entry) => entry.purpose === "gallery") ?? hubSlots()[0]!);
    for (const word of ["architecture", "resort", "shop", "consultancy"]) expect(query).toContain(word);
    for (const noise of ["hub", "units", "four", "topbanner", "section"]) expect(query).not.toContain(noise);
  });
});

describe("stockSearchQuery", () => {
  it("turns the image-generation prompt into topical keywords, not instructions", () => {
    const query = stockSearchQuery(slot("hero"));
    for (const word of ["architecture", "resort", "furniture", "consultancy"]) expect(query).toContain(word);
    for (const noise of ["generate", "primary", "style", "overlay", "#b45309", "arbor", "oak", "group", "single"]) expect(query.toLowerCase()).not.toContain(noise);
    expect(query.endsWith("wide photograph")).toBe(true);
    expect(query.length).toBeLessThanOrEqual(120);
  });

  it("is what photoSearchQuery sends for non-social slots, and falls back to the prompt when nothing topical is left", () => {
    expect(photoSearchQuery(slot("gallery"))).toBe(stockSearchQuery(slot("gallery")));
    const bare = { purpose: "hero" as const, suggestedPrompt: "Generate a thing", altText: "x" };
    expect(photoSearchQuery(bare)).toBe("Generate a thing");
  });

  it("keeps at most eight distinct words", () => {
    expect(stockSearchWords(slot("hero")).length).toBeLessThanOrEqual(8);
  });
});

function photo(id: string, slug: string, description: string | null) {
  return UnsplashPhoto.parse({
    id,
    description,
    width: 4000,
    height: 2667,
    smallUrl: `https://images.unsplash.com/photo-${id}?w=400`,
    regularUrl: `https://images.unsplash.com/photo-${id}?w=1080`,
    downloadLocation: `https://api.unsplash.com/photos/${id}/download?ixid=1`,
    attribution: {
      photographerName: "Ada Baker",
      photographerUrl: "https://unsplash.com/@adabaker?utm_source=appwright&utm_medium=referral",
      photoUrl: `https://unsplash.com/photos/${slug}?utm_source=appwright&utm_medium=referral`,
    },
  });
}

describe("pickUnusedPhoto relevance", () => {
  const words = ["architecture", "resort", "furniture"];
  it("prefers the clean photo that shares the most words with the query", () => {
    const offTopic = photo("b1", "a-man-on-a-bench-Aa1Bb2Cc3Dd", "A man on a bench");
    const onTopic = photo("b2", "modern-architecture-and-furniture-Ee4Ff5Gg6Hh", "Modern architecture and furniture");
    expect(pickUnusedPhoto([offTopic, onTopic], new Set(), words)?.id).toBe("b2");
  });

  it("still rejects text-bearing photos even when they match the query", () => {
    const laptop = photo("b3", "laptop-showing-furniture-Ii7Jj8Kk9Ll", "Laptop showing furniture");
    const plain = photo("b4", "a-quiet-room-Mm1Nn2Oo3Pp", "A quiet room");
    expect(pickUnusedPhoto([laptop, plain], new Set(), ["furniture"])?.id).toBe("b4");
  });

  it("keeps the search order when no query words are given", () => {
    const first = photo("b5", "red-chair-Qq4Rr5Ss6Tt", "Red chair");
    const second = photo("b6", "blue-sofa-Uu7Vv8Ww9Xx", "Blue sofa");
    expect(pickUnusedPhoto([first, second], new Set())?.id).toBe("b5");
  });
});
