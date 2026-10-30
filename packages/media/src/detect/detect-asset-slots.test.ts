import { BlueprintSchema } from "@repo/contracts";
import { describe, expect, it } from "bun:test";
import { detectAssetSlots } from "./detect-asset-slots";

function planned(sectionId: string, purpose: string, asset: string, aspect: string) {
  return {
    sectionId,
    variantId: "default",
    purpose,
    reason: "Fixture section for slot detection.",
    layoutPattern: "split",
    surface: "canvas",
    width: "content",
    spacing: "comfortable",
    imageAspect: aspect,
    assetPurposes: [asset],
    contentFields: ["headline"],
    interactions: ["Primary action is a link"],
    responsive: "Stacks on small screens.",
  };
}

function buildFixtureBlueprint(pages: { route: string; purpose: string; components: string[] }[]) {
  return BlueprintSchema.parse({
    blueprintVersion: 1,
    intent: { type: "new-app", domain: "portfolio", complexity: "simple" },
    stack: { framework: "next", db: "postgres", orm: "prisma", auth: "authjs", styling: "tailwind" },
    pages,
    theme: { preset: "minimal", primary: "#111827" },
  });
}

describe("detectAssetSlots", () => {
  it("detects a hero slot from a page purpose and an avatar slot from a component name", () => {
    const blueprint = buildFixtureBlueprint([
      { route: "/", purpose: "Landing page with a hero banner", components: ["HeroSection"] },
      { route: "/team", purpose: "Meet the team", components: ["AvatarGrid", "TeamBio"] },
    ]);

    const slots = detectAssetSlots(blueprint);

    expect(slots.map((slot) => slot.purpose)).toEqual(["hero", "avatar", "logo"]);
    expect(slots[0]?.pageRoute).toBe("/");
    expect(slots[1]?.pageRoute).toBe("/team");
    expect(slots[0]?.suggestedPrompt).toContain("/");
    expect(slots[0]?.suggestedPrompt).toContain("HeroSection");
    expect(slots[0]?.altText).toContain("/");
    expect(slots.every((slot) => slot.status === "PENDING")).toBe(true);
  });

  it("returns no slots for private settings pages", () => {
    const blueprint = buildFixtureBlueprint([
      { route: "/settings", purpose: "Account settings form", components: ["SettingsForm"] },
    ]);

    expect(detectAssetSlots(blueprint)).toEqual([]);
  });

  it("asks for a section image on about even when the copy never says photo", () => {
    const blueprint = buildFixtureBlueprint([
      { route: "/about", purpose: "Our story and the people behind the bakery", components: ["Story"] },
    ]);
    const slots = detectAssetSlots(blueprint);
    expect(slots.some((slot) => slot.pageRoute === "/about" && slot.purpose === "photo")).toBe(true);
    expect(slots[0]?.suggestedPrompt.toLowerCase()).toContain("portfolio");
  });

  it("asks for a home hero even when the page never uses the word hero", () => {
    const blueprint = buildFixtureBlueprint([{ route: "/", purpose: "Welcome to the shop", components: [] }]);
    const purposes = detectAssetSlots(blueprint).map((slot) => slot.purpose);
    expect(purposes).toContain("hero");
    expect(purposes).toContain("logo");
  });

  it("asks for a photo on contact and menu pages", () => {
    const blueprint = buildFixtureBlueprint([
      { route: "/contact", purpose: "Find us", components: ["ContactForm"] },
      { route: "/menu", purpose: "What we serve", components: ["MenuList"] },
    ]);
    const slots = detectAssetSlots(blueprint);
    expect(slots.some((slot) => slot.pageRoute === "/contact" && slot.purpose === "photo")).toBe(true);
    expect(slots.some((slot) => slot.pageRoute === "/menu" && slot.purpose === "photo")).toBe(true);
  });

  it("is deterministic across repeated calls on the same blueprint", () => {
    const blueprint = buildFixtureBlueprint([
      { route: "/", purpose: "Landing page with a hero banner and a logo", components: ["HeroSection", "Logo"] },
    ]);

    const first = detectAssetSlots(blueprint);
    const second = detectAssetSlots(blueprint);

    expect(first).toEqual(second);
    expect(new Set(first.map((slot) => slot.id)).size).toBe(first.length);
  });

  it("marks hero and logo slots required and records aspect ratios", () => {
    const blueprint = buildFixtureBlueprint([
      { route: "/", purpose: "Landing page", components: ["HeroSection", "Logo", "PhotoGallery"] },
    ]);

    const byPurpose = new Map(detectAssetSlots(blueprint).map((slot) => [slot.purpose, slot]));

    expect(byPurpose.get("hero")).toMatchObject({ required: true, aspectRatio: "16:9" });
    expect(byPurpose.get("logo")).toMatchObject({ required: true, aspectRatio: "1:1" });
    expect(byPurpose.get("gallery")).toMatchObject({ required: false, aspectRatio: "4:3" });
  });

  it("asks for one logo for the whole site instead of one per page", () => {
    const blueprint = buildFixtureBlueprint([
      { route: "/", purpose: "Home", components: ["Logo"] },
      { route: "/about", purpose: "About us", components: ["Logo"] },
    ]);

    const logos = detectAssetSlots(blueprint).filter((slot) => slot.purpose === "logo");

    expect(logos.map((slot) => slot.pageRoute)).toEqual(["/"]);
  });

  it("asks for a logo even when no component is named logo", () => {
    const slots = detectAssetSlots(
      buildFixtureBlueprint([{ route: "/", purpose: "Welcome", components: ["HeroSection"] }]),
    );
    expect(slots.some((slot) => slot.purpose === "logo" && slot.required)).toBe(true);
  });

  it("creates one slot per planned section asset instead of collapsing them by purpose", () => {
    const blueprint = BlueprintSchema.parse({
      ...buildFixtureBlueprint([{ route: "/", purpose: "Bakery home", components: ["Hero"] }]),
      pages: [
        {
          route: "/",
          purpose: "Bakery home",
          components: ["Hero"],
          sections: [
            planned("hero.split-image", "hero", "hero", "16:9"),
            planned("brand.intro", "brand", "photo", "4:3"),
            planned("gallery.row", "gallery", "gallery", "4:3"),
          ],
        },
      ],
    });
    const slots = detectAssetSlots(blueprint);
    expect(slots.map((slot) => `${slot.purpose}:${slot.componentName}`)).toEqual([
      "hero:hero.split-image",
      "photo:brand.intro",
      "gallery:gallery.row",
      "logo:Logo",
    ]);
    expect(slots[0]?.aspectRatio).toBe("16:9");
    expect(slots[1]?.aspectRatio).toBe("4:3");
  });

  it("adds an optional social preview slot only when SEO is required and images exist", () => {
    const pages = [{ route: "/", purpose: "Landing page", components: ["HeroSection"] }];
    const withSeo = BlueprintSchema.parse({
      ...buildFixtureBlueprint(pages),
      requirements: [{ id: "seo", area: "seo", level: "required", reason: "public pages" }],
    });

    const social = detectAssetSlots(withSeo).find((slot) => slot.purpose === "social");

    expect(social).toMatchObject({ required: false, aspectRatio: "1.91:1", pageRoute: "/" });
    expect(detectAssetSlots(buildFixtureBlueprint(pages)).some((slot) => slot.purpose === "social")).toBe(
      false,
    );
  });
});

describe("suggested prompt topics", () => {
  it("lists the page's topical component names and drops layout words", () => {
    const blueprint = BlueprintSchema.parse({
      blueprintVersion: 1,
      intent: { type: "business-site", domain: "design group", complexity: "medium" },
      stack: { framework: "next", db: "none", orm: "none", auth: "authjs", styling: "tailwind" },
      pages: [{ route: "/", purpose: "Single-page hub", components: ["HeroBanner", "ArchitectureSection", "ResortSection", "BentoGrid"] }],
      theme: { preset: "warm", primary: "#b45309" },
    });
    const prompt = detectAssetSlots(blueprint)[0]?.suggestedPrompt ?? "";
    expect(prompt).toContain("Topics: architecture, resort");
    expect(prompt).not.toContain("Topics: hero");
  });
});
