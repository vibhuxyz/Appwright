import { describe, expect, test } from "bun:test";
import type { AssetSlot } from "@repo/contracts";
import { heroStandIn, photoSearchQuery } from "../src/assets/social-fallback";

const SOCIAL_ALT =
  "social image on /: RK Home Planner landing page with hero, services, portfolio gallery, about, process, service area, and contact/enquiry form";

function slot(overrides: Partial<AssetSlot> & Pick<AssetSlot, "id" | "purpose">): AssetSlot {
  return {
    pageRoute: "/",
    componentName: "Hero",
    altText: "hero image on /: home page",
    suggestedPrompt: "Generate a wide hero banner image",
    status: "RESOLVED",
    finalPath: "https://images.unsplash.com/photo-hero",
    ...overrides,
    required: overrides.required ?? false,
  };
}

describe("photoSearchQuery", () => {
  test("searches the page subject for a social preview instead of the generation instruction", () => {
    const query = photoSearchQuery({
      purpose: "social",
      altText: SOCIAL_ALT,
      suggestedPrompt:
        "Generate a 1200x630 social sharing preview image for a home-planning for the OpenGraphImage on /.",
    });
    expect(query.startsWith("RK Home Planner")).toBe(true);
    expect(query).toContain("wide photograph");
    expect(query).not.toContain("1200x630");
    expect(query.length).toBeLessThanOrEqual(120);
  });

  test("keeps the suggested prompt for other slots", () => {
    expect(
      photoSearchQuery({
        purpose: "hero",
        altText: "hero image on /: landing",
        suggestedPrompt: "Generate a wide hero banner image",
      }),
    ).toBe("Generate a wide hero banner image");
  });
});

describe("heroStandIn", () => {
  test("uses the resolved hero on the same page", () => {
    const hero = slot({ id: "/:hero:0", purpose: "hero", assetId: "hero-asset" });
    const social = slot({
      id: "/:OpenGraphImage:13",
      purpose: "social",
      status: "FAILED",
      componentName: "OpenGraphImage",
      altText: SOCIAL_ALT,
      finalPath: undefined,
    });
    expect(heroStandIn([hero, social], social.id)?.assetId).toBe("hero-asset");
  });

  test("does not stand in for a non-social slot", () => {
    const hero = slot({ id: "/:hero:0", purpose: "hero" });
    const photo = slot({ id: "/:photo:1", purpose: "photo", status: "FAILED", finalPath: undefined });
    expect(heroStandIn([hero, photo], photo.id)).toBeUndefined();
  });
});
