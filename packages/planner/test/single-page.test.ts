import { describe, expect, it } from "bun:test";
import { BlueprintSchema } from "@repo/contracts";
import { appNeedsDatabase, detectNeeds, planBlueprint, resolveRequirements } from "../src";

const ARBOR_PROMPT =
  "Build a single-page website for Arbor & Oak, a design-led group in Lisbon with four businesses on one page: an architecture studio, a boutique resort with rooms and booking enquiries, an online furniture collection, and a B2B marketing consultancy. Contact: hello@example.com.";

function arborBlueprint() {
  return BlueprintSchema.parse({
    blueprintVersion: 1,
    intent: { type: "business-site", domain: "design group", complexity: "medium" },
    stack: { framework: "next", db: "postgres", orm: "prisma", auth: "authjs", styling: "tailwind" },
    pages: [
      { route: "/", purpose: "Home page showcasing the four business units", components: ["Hero", "Gallery"] },
      { route: "/menu", purpose: "Browse items by category", components: ["ProductGrid"] },
      { route: "/contact", purpose: "Contact details", components: ["ContactDetails"] },
    ],
    entities: [{ name: "Inquiry", fields: [{ name: "email", type: "String", required: true, unique: false }], relations: [] }],
    theme: { preset: "warm", primary: "#b45309" },
  });
}

describe("single-page briefs", () => {
  it("resolve to one page with no database, admin or login", () => {
    const resolved = resolveRequirements({ blueprint: arborBlueprint(), prompt: ARBOR_PROMPT, needs: detectNeeds(ARBOR_PROMPT) });
    expect(resolved.blueprint.pages.map((page) => page.route)).toEqual(["/"]);
    expect(resolved.blueprint.stack.db).toBe("none");
    expect(resolved.blueprint.features).not.toContain("auth");
    expect(resolved.skipped.filter((entry) => entry.kind === "page").map((entry) => entry.name).sort()).toEqual(["/contact", "/menu"]);
    expect(resolved.blueprint.pages[0]?.components).toContain("ContactDetails");
  });

  it("does not add the template contact page, opening hours or map to a single page", () => {
    const draft = BlueprintSchema.parse({ ...arborBlueprint(), pages: [{ route: "/", purpose: "Home page", components: ["Hero"] }] });
    const resolved = resolveRequirements({ blueprint: draft, prompt: ARBOR_PROMPT, needs: detectNeeds(ARBOR_PROMPT) });
    expect(resolved.blueprint.pages).toHaveLength(1);
    expect(resolved.blueprint.pages[0]?.components).not.toContain("OpeningHours");
    expect(resolved.blueprint.pages[0]?.components).not.toContain("MapEmbed");
  });

  it("honours a single-page correction given as an answer, not only in the prompt", () => {
    const prompt = "Build a website for a design group with a resort and a studio, with booking enquiries.";
    const answers = { plan: "One page only: Home. No login, admin, menu or settings pages and no database." };
    const resolved = resolveRequirements({ blueprint: arborBlueprint(), prompt, needs: detectNeeds(prompt), answers });
    expect(resolved.blueprint.pages.map((page) => page.route)).toEqual(["/"]);
    expect(resolved.blueprint.stack.db).toBe("none");
  });

  it("does not require admin when intake options mention pop-ups but the user chose enquiry-only", () => {
    const prompt = [
      ARBOR_PROMPT,
      "1. Ordering — How do customers work with you?",
      "   a) Enquiry-only (contact form for all business units)",
      "   b) Online checkout with modal popups",
      "   c) Pickup orders",
    ].join("\n");
    const answers = {
      "ordering-mode": "Enquiry-only (contact form for all business units)",
      plan: "One page only: Home. No login, admin, menu or settings pages and no database.",
    };
    const resolved = resolveRequirements({
      blueprint: arborBlueprint(),
      prompt,
      needs: detectNeeds(prompt),
      answers,
    });
    expect(resolved.blueprint.pages.map((page) => page.route)).toEqual(["/"]);
    expect(resolved.blueprint.stack.db).toBe("none");
    expect(resolved.blueprint.requirements?.find((requirement) => requirement.area === "admin")?.level).toBe(
      "not-applicable",
    );
    const plan = planBlueprint(resolved.blueprint);
    expect(plan.ok).toBe(true);
  });

  it("keeps multi-page apps that store data unchanged", () => {
    const prompt = "Build a studio site where clients sign up and book appointments.";
    const resolved = resolveRequirements({ blueprint: arborBlueprint(), prompt, needs: detectNeeds(prompt) });
    expect(resolved.blueprint.pages.length).toBeGreaterThan(1);
    expect(resolved.blueprint.stack.db).toBe("mongodb");
  });
});

describe("appNeedsDatabase with explicit limits", () => {
  it("treats 'no database' as an exclusion, not a request", () => {
    expect(appNeedsDatabase("A resort site with bookings and no database")).toBe(false);
  });

  it("stays off for a single-page site that only mentions booking enquiries", () => {
    expect(appNeedsDatabase(ARBOR_PROMPT)).toBe(false);
  });

  it("turns on for a single-page site that asks for accounts", () => {
    expect(appNeedsDatabase("A single-page website where members can log in")).toBe(true);
  });

  it("ignores 'no admin' when deciding on stored data", () => {
    expect(appNeedsDatabase("One page only website. No login, admin or database pages.")).toBe(false);
  });
});
