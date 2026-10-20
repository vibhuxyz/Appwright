import { BlueprintSchema } from "@repo/contracts";
import { describe, expect, it } from "bun:test";
import { detectAssetSlots } from "./detect-asset-slots";

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

    expect(slots.map((slot) => slot.purpose)).toEqual(["hero", "avatar"]);
    expect(slots[0]?.pageRoute).toBe("/");
    expect(slots[1]?.pageRoute).toBe("/team");
    expect(slots.every((slot) => slot.status === "PENDING")).toBe(true);
  });

  it("returns no slots for pages with no image-worthy content", () => {
    const blueprint = buildFixtureBlueprint([
      { route: "/settings", purpose: "Account settings form", components: ["SettingsForm"] },
    ]);

    expect(detectAssetSlots(blueprint)).toEqual([]);
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
});
