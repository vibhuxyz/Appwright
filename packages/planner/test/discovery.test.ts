import { describe, expect, it } from "bun:test";
import {
  advanceDiscovery,
  selectDiscoveryQuestions,
  workflowsFrom,
  extractFacts,
} from "../src/discovery";

const BAKERY_FULL =
  "Build a bakery application where customers can place standard pickup orders and custom cake or event requests. The business has a storefront and pop-up locations.";

const BAKERY_BROWSE =
  "Build a bakery website to browse the menu. Catalog only, no online ordering.";

const BAKERY_PICKUP = "Build a bakery where customers can place standard pickup orders.";

const BAKERY_ADMIN =
  "Build a bakery where customers can place standard pickup orders. We already have an admin dashboard.";

function needsOf(prompt: string, answers: Record<string, string> = {}): string[] {
  return selectDiscoveryQuestions(prompt, answers).map((question) => question.need);
}

const BUSINESS_IDENTITY = ["business-name", "business-contacts"] as const;

function answerFor(question: { need: string; inputType: string; options: readonly string[] }): string {
  if (question.inputType === "short-text" || question.inputType === "contacts") {
    return `answer-for-${question.need}`;
  }
  return question.options[0] ?? "yes";
}

function answerAll(prompt: string, extra: Record<string, string> = {}): Record<string, string> {
  const answers: Record<string, string> = { ...extra };
  for (let round = 0; round < 6; round++) {
    const questions = selectDiscoveryQuestions(prompt, answers);
    if (questions.length === 0) break;
    for (const question of questions) {
      answers[question.need] = answerFor(question);
    }
  }
  return answers;
}

describe("bakery discovery", () => {
  it("asks about menu, hours and pages once the site is browse-only", () => {
    const needs = needsOf("build full stack app for my bakery business", {
      "business-name": "vibhuBakery wallha",
      "ordering-mode": "Browse only",
    });
    expect(needs).toEqual(expect.arrayContaining(["menu-structure", "opening-hours", "site-pages"]));
    expect(needs).not.toContain("payment-method");
  });

  it("asks required business identity before product decisions", () => {
    const needs = needsOf("build full stack app for my bakery business");
    expect(needs.slice(0, 2)).toEqual([...BUSINESS_IDENTITY]);
    expect(needs).toContain("ordering-mode");
    expect(needs).not.toContain("section-images");
    expect(needs).not.toContain("brand-assets");
    const contacts = selectDiscoveryQuestions("build full stack app for my bakery business").find(
      (question) => question.need === "business-contacts",
    );
    expect(contacts?.inputType).toBe("contacts");
    expect(contacts?.text.toLowerCase()).not.toContain("paste");
    expect(contacts?.options).toEqual([
      "Instagram",
      "Facebook",
      "TikTok",
      "Website",
      "Phone",
      "WhatsApp",
      "Email",
      "Support",
      "Address",
    ]);
  });

  it("asks more than three material questions for pickup plus custom plus pop-ups", () => {
    const questions = selectDiscoveryQuestions(BAKERY_FULL);
    expect(questions.length).toBeGreaterThan(3);
    expect(needsOf(BAKERY_FULL)).toEqual(expect.arrayContaining([
      "business-name",
      "business-contacts",
      "payment-method",
      "guest-checkout",
      "custom-workflow",
      "popup-menus",
      "pickup-scheduling",
    ]));
    expect(needsOf(BAKERY_FULL)).not.toContain("ordering-mode");
    expect(needsOf(BAKERY_FULL)).not.toContain("section-images");
    const afterFirst = Object.fromEntries(
      selectDiscoveryQuestions(BAKERY_FULL).map((question) => [
        question.need,
        question.inputType === "short-text" || question.inputType === "contacts"
          ? `answer-for-${question.need}`
          : (question.options[0] ?? "yes"),
      ]),
    );
    expect(needsOf(BAKERY_FULL, afterFirst)).not.toEqual(
      expect.arrayContaining(["business-name", "business-contacts"]),
    );
  });

  it("does not ask ordering or payment questions for a browse-only bakery", () => {
    const needs = needsOf(BAKERY_BROWSE);
    expect(needs).not.toContain("payment-method");
    expect(needs).not.toContain("pickup-scheduling");
    expect(needs).not.toContain("custom-workflow");
    const workflows = workflowsFrom(extractFacts(BAKERY_BROWSE));
    expect(workflows.find((workflow) => workflow.kind === "pickup-order")?.inScope).toBe(false);
    expect(workflows.find((workflow) => workflow.kind === "browse-catalog")?.inScope).toBe(true);
  });

  it("asks payment for pickup orders when payment is unresolved", () => {
    expect(needsOf(BAKERY_PICKUP)).toContain("payment-method");
    expect(needsOf(BAKERY_PICKUP)).not.toContain("custom-workflow");
    expect(needsOf(BAKERY_PICKUP)).not.toContain("popup-menus");
  });

  it("keeps custom and pop-up workflows in scope for the full bakery request", () => {
    const workflows = workflowsFrom(extractFacts(BAKERY_FULL));
    expect(workflows.filter((workflow) => workflow.inScope).map((workflow) => workflow.kind)).toEqual(
      expect.arrayContaining(["pickup-order", "custom-request", "pop-up-locations", "admin-operations"]),
    );
  });

  it("does not re-ask a payment decision that was already answered", () => {
    expect(needsOf(BAKERY_FULL, { "payment-method": "Pay at pickup" })).not.toContain("payment-method");
  });

  it("records skipped optional topics as assumptions instead of inventing extra rounds", () => {
    const first = advanceDiscovery(BAKERY_FULL);
    const answers = Object.fromEntries(
      first.questions.map((question) => [question.need, question.options[question.defaultOptionIndex] ?? "skip"]),
    );
    const second = advanceDiscovery(BAKERY_FULL, answers);
    expect(second.questions.every((question) => question.importance === "required")).toBe(true);
    expect(second.assumptions.length).toBeGreaterThan(0);
  });

  it("does not ask staff-role questions when an admin dashboard already exists", () => {
    expect(needsOf(BAKERY_ADMIN)).not.toContain("staff-roles");
    expect(needsOf(BAKERY_ADMIN)).not.toContain("dashboard-priority");
  });

  it("does not re-ask topics the prompt already decided", () => {
    const prompt = `${BAKERY_FULL} Pay at pickup. Guest checkout is fine.`;
    expect(needsOf(prompt)).not.toContain("payment-method");
    expect(needsOf(prompt)).not.toContain("guest-checkout");
  });

  it("asks due dates and sharing for a todo app, not bakery payments", () => {
    const needs = needsOf("build a todo app");
    expect(needs).toEqual(expect.arrayContaining(["sharing", "due-dates"]));
    expect(needs).not.toContain("payment-method");
  });

  it("asks nothing for a small visual edit", () => {
    expect(selectDiscoveryQuestions("make the button blue")).toEqual([]);
  });

  it("asks payment when pickup orders are in scope and payment is unresolved", () => {
    const questions = selectDiscoveryQuestions(BAKERY_PICKUP);
    expect(questions.map((question) => question.need)).toContain("payment-method");
    expect(questions.find((question) => question.need === "payment-method")?.why).toMatch(/payment/i);
  });

  it("leaves image uploads out of intake so they wait for plan and theme", () => {
    const afterIdentityAndProduct = answerAll(BAKERY_PICKUP);
    const leftover = selectDiscoveryQuestions(BAKERY_PICKUP, afterIdentityAndProduct);
    expect(leftover).toEqual([]);
    expect(needsOf(BAKERY_PICKUP)).not.toContain("section-images");
  });

  it("does not treat an email in the prompt as a reason to skip the other business fields", () => {
    const needs = needsOf(`${BAKERY_PICKUP} Reach us at hello@riseandflour.test`);
    expect(needs).not.toContain("business-email");
    expect(needs).toEqual(expect.arrayContaining(["business-name", "business-contacts"]));
    const contacts = selectDiscoveryQuestions(`${BAKERY_PICKUP} Reach us at hello@riseandflour.test`).find(
      (question) => question.need === "business-contacts",
    );
    expect(contacts?.prefill?.Email).toBe("hello@riseandflour.test");
  });

  it("does not turn a home-planning landing page into a bakery shop", () => {
    const prompt = [
      "Create a landing page for RK Home Planner, a home planning and design service in Ranchi.",
      "Work/portfolio gallery of floor plans.",
      "Process: enquiry, measurement, design and delivery.",
      "Do not invent project counts, testimonials, client names, prices, ratings, or achievements.",
    ].join(" ");
    const workflows = workflowsFrom(extractFacts(prompt));
    const inScope = workflows.filter((workflow) => workflow.inScope).map((workflow) => workflow.kind);
    expect(inScope).not.toContain("browse-catalog");
    expect(inScope).not.toContain("delivery-order");
    expect(inScope).not.toContain("pickup-order");
    expect(inScope).not.toContain("inventory");
  });

  it("keeps food delivery in scope without calling every business a catalog", () => {
    const workflows = workflowsFrom(extractFacts("build me a food delivery app"));
    expect(workflows.find((workflow) => workflow.kind === "delivery-order")?.inScope).toBe(true);
    expect(workflows.find((workflow) => workflow.kind === "browse-catalog")?.inScope).toBe(false);
  });

  it("does not ask bakery ordering questions for a service landing page", () => {
    const needs = needsOf(
      "Create a website for my home planning business in Ranchi. Visitors enquire by phone.",
    );
    expect(needs).toEqual(expect.arrayContaining(["business-name", "business-contacts"]));
    expect(needs).not.toContain("ordering-mode");
    expect(needs).not.toContain("payment-method");
    expect(needs).not.toContain("menu-structure");
  });

  it("does not re-ask a topic after a previous batch answered it", () => {
    const first = selectDiscoveryQuestions(BAKERY_FULL);
    expect(first.length).toBeGreaterThan(0);
    const answers = Object.fromEntries(
      first.map((question) => [question.need, question.options[question.defaultOptionIndex] ?? ""]),
    );
    const second = selectDiscoveryQuestions(BAKERY_FULL, answers);
    expect(second.every((question) => !answers[question.need])).toBe(true);
  });
});
