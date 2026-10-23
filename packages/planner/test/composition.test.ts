import { describe, expect, it } from "bun:test";
import { planBlueprint, scopeFollowUp } from "../src";

const LOCAL = {
  blueprintVersion: 1,
  intent: { type: "new-app", domain: "bakery", complexity: "simple" as const },
  stack: { framework: "next" as const, db: "none" as const, orm: "none" as const, auth: "authjs" as const, styling: "tailwind" as const },
  entities: [],
  pages: [
    { route: "/", purpose: "Bakery home with hero photos", components: ["Hero"] },
    { route: "/contact", purpose: "Contact details and opening hours", components: [] },
  ],
  features: [],
  theme: { preset: "default", primary: "#111827" },
};

describe("section composition on the plan", () => {
  it("stores section ids on the blueprint and limits a follow-up to the edited page", () => {
    const plan = planBlueprint(LOCAL);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    const home = plan.value.blueprint.pages.find((page) => page.route === "/");
    const contact = plan.value.blueprint.pages.find((page) => page.route === "/contact");
    expect(home?.sections?.map((section) => section.sectionId)).toContain("hero.split-image");
    expect(contact?.sections?.map((section) => section.sectionId)).toContain("contact.split");
    expect(plan.value.tasks.find((task) => task.id === "page-home")?.title).toContain("hero.split-image");
    expect(plan.value.tasks.find((task) => task.type === "app-shell")?.title).toContain("nav.top-bar");

    const again = planBlueprint(LOCAL);
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.value.tasks.find((task) => task.id === "page-home")?.title).toBe(
      plan.value.tasks.find((task) => task.id === "page-home")?.title,
    );

    const edited = planBlueprint({
      ...LOCAL,
      pages: [LOCAL.pages[0], { route: "/contact", purpose: "Gallery of cakes", components: [] }],
    });
    expect(edited.ok).toBe(true);
    if (!edited.ok) return;
    const scope = scopeFollowUp(plan.value.blueprint, edited.value.blueprint);
    expect(scope.affectedTaskIds).toContain("page-contact");
    expect(scope.affectedTaskIds).toContain("visual-verification");
    expect(scope.affectedTaskIds).not.toContain("page-home");
    expect(scope.untouchedTaskIds).toContain("page-home");
  });
});
