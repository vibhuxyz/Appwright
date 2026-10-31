import { describe, expect, it } from "bun:test";
import type { AssetSlot, Blueprint } from "@repo/contracts";
import { BuildBlueprintError } from "@repo/blueprint";
import { planFailure, planRequestText, summarizePlan } from "../src/plan-preview";

describe("planFailure", () => {
  it("shows the provider notice instead of the raw 402 body when the AI provider is out of credits", () => {
    const raw = 'OpenAI request failed: 402 [{ "error": { "code": 402, "message": "Your prepayment credits are depleted.", "status": "RESOURCE_EXHAUSTED" } } ]';
    const result = planFailure(new BuildBlueprintError("CONTENT_FAILED", raw));
    expect(result).toMatchObject({ status: 503, code: "PROVIDER_UNAVAILABLE", isProviderCreditsDepleted: true });
    expect(result.message).not.toContain("402");
    expect(result.message).not.toContain("ai.studio");
  });

  it("keeps clear planner messages but hides raw content failures", () => {
    expect(planFailure(new BuildBlueprintError("TIMEOUT", "Timed out while planning the app"))).toMatchObject({
      status: 503,
      message: "Timed out while planning the app",
    });
    expect(planFailure(new BuildBlueprintError("CONTENT_FAILED", "Unexpected token < in JSON")).message).toBe(
      "Could not plan the app. Try again.",
    );
  });
});

const blueprint = {
  pages: [
    { route: "/", purpose: "Welcome visitors", components: ["Carousel", "Testimonials"] },
    { route: "/menu", purpose: "Show breads, cakes and pastries", components: ["MenuGrid"] },
  ],
  features: [],
  entities: [{ name: "Product", fields: [{ name: "name", type: "String", required: true, unique: false }], relations: [] }],
} as unknown as Blueprint;

function slot(pageRoute: string, componentName: string, purpose: AssetSlot["purpose"]): AssetSlot {
  return {
    id: `${pageRoute}-${componentName}`,
    pageRoute,
    componentName,
    purpose,
    altText: "alt",
    suggestedPrompt: "prompt",
    status: "PENDING",
    required: true,
  };
}

describe("summarizePlan", () => {
  it("lists every page with its sections and marks which ones need an image", () => {
    const preview = summarizePlan("bp1", blueprint, [slot("/", "Hero", "hero"), slot("/", "Carousel", "gallery")]);
    expect(preview.blueprintId).toBe("bp1");
    expect(preview.pages[0]?.sections).toEqual([
      { name: "Hero", image: "hero" },
      { name: "Carousel", image: "gallery" },
      { name: "Testimonials" },
    ]);
    expect(preview.pages[1]?.sections).toEqual([{ name: "Menu Grid" }]);
    expect(preview.entities).toEqual(["Product"]);
  });
});

describe("planRequestText", () => {
  it("plans from the prompt, chosen answers, and the requested changes", () => {
    const text = planRequestText({
      prompt: "bakery site",
      answers: { "site-pages": "Home, Menu, Gallery" },
      questions: [
        {
          need: "site-pages",
          text: "Which pages should the site have?",
          label: "Pages",
          options: ["Home", "Menu", "Gallery"],
          defaultOptionIndex: 0,
          inputType: "multiple",
          importance: "required",
        },
      ],
      feedback: "add a cakes page",
    });
    expect(text).toContain("site-pages: Home, Menu, Gallery");
    expect(text).toContain("Change the plan: add a cakes page");
  });

  it("omits unselected options so keyword detectors cannot treat them as requirements", () => {
    const text = planRequestText({
      prompt: "single-page site for Arbor & Oak",
      answers: { "ordering-mode": "Enquiry-only (contact form for all business units)" },
      questions: [
        {
          need: "ordering-mode",
          text: "How do customers work with you?",
          label: "Ordering",
          options: [
            "Enquiry-only (contact form for all business units)",
            "Online checkout with modal popups",
            "Pickup orders",
          ],
          defaultOptionIndex: 0,
          inputType: "single",
          importance: "required",
        },
      ],
    });
    expect(text).toContain("ordering-mode: Enquiry-only (contact form for all business units)");
    expect(text).not.toContain("modal popups");
    expect(text).not.toContain("Online checkout");
    expect(text).not.toContain("Pickup orders");
    expect(text).not.toContain("How do customers work with you?");
  });
});
