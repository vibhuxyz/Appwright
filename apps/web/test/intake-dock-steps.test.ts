import { describe, expect, it } from "bun:test";
import type { AssetRequestResponse } from "@repo/contracts";
import type { IntakeGate } from "../src/features/agent/intake";
import { intakeLanded } from "../src/features/agent/intake/chat-echo";
import { groupIntakeSteps } from "../src/features/agent/intake/intake-progress";
import { pageTitle } from "../src/features/agent/questions/step-views/plan-labels";
import { layoutBlocks } from "../src/features/agent/questions/step-views/wireframe-layout";
import { humanizeSectionName, summarizePlan } from "../src/features/agent/questions/step-views/plan-summary";
import { intakeReply } from "../src/features/agent/intake/intake-transcript";
import { pickLiveGroup } from "../src/features/agent/questions/chat-dock/pick-live-group";
import { buildImageSteps, firstOpenStepIndex } from "../src/features/agent/questions/image-dock/image-steps";
import { INITIAL_INTAKE_DOCK_STATE, intakeDockReducer } from "../src/features/agent/questions/intake-dock/intake-dock-state";
import {
  buildIntakeSteps,
  intakeAnswers,
  intakeAutoAnswer,
  validateIntakeStep,
} from "../src/features/agent/questions/intake-dock/intake-steps";

const language = {
  need: "language",
  text: "What should the website use?",
  label: "Language",
  options: ["English", "Hindi"],
  defaultOptionIndex: 0,
  inputType: "single" as const,
  importance: "required" as const,
};
const businessName = { ...language, need: "business-name", label: "Name", text: "What is the business called?", options: [], inputType: "short-text" as const };

function gate(fields: Partial<IntakeGate>): IntakeGate {
  return { prompt: "Build a site", status: "asking", questions: [language, businessName], asked: [], answers: {}, error: null, afterSeq: 4, ...fields };
}

describe("intake dock steps", () => {
  it("makes one step per question while asking", () => {
    expect(buildIntakeSteps(gate({})).map((step) => step.id)).toEqual(["intake:language", "intake:business-name"]);
    expect(buildIntakeSteps(gate({ status: "choosing-theme" })).map((step) => step.kind)).toEqual(["theme"]);
  });

  it("requires an answer for required questions and collects answers", () => {
    const steps = buildIntakeSteps(gate({}));
    const [choice, text] = steps;
    if (!choice || !text) throw new Error("missing steps");
    expect(validateIntakeStep(text, INITIAL_INTAKE_DOCK_STATE, false)).toEqual({ "intake:business-name": "Write an answer, or use Auto-answer" });
    const auto = intakeAutoAnswer(choice, undefined);
    if (!auto) throw new Error("no auto-answer");
    const answered = intakeDockReducer(intakeDockReducer(INITIAL_INTAKE_DOCK_STATE, auto), { type: "set-answer", stepId: text.id, value: " RK Home " });
    expect(intakeAnswers(steps, answered)).toEqual({ language: "English", "business-name": "RK Home" });
  });

  it("marks a fully skipped round as skipped and fills defaults", () => {
    const reply = intakeReply([language], { language: "skip" });
    expect(reply.outcome).toBe("skipped");
    expect(reply.items[0]?.answer).toBe("English (default)");
  });

  it("treats intake as landed once its reply is in the chat", () => {
    const turn = { prompt: "Build a site", questions: [language], afterSeq: 4 };
    const prompt = { seq: 5, role: "user", content: "Build a site" };
    expect(intakeLanded([prompt], turn)).toBe(false);
    expect(intakeLanded([prompt, { seq: 7, role: "user", content: "x", data: { questionReply: { kind: "intake" } } }], turn)).toBe(true);
  });
});

describe("pickLiveGroup", () => {
  const request = (status: "RESOLVED" | "PENDING"): AssetRequestResponse => ({
    id: "asset-1",
    sessionId: "s",
    blueprintId: "b",
    status: "PENDING",
    createdAt: "",
    resolvedAt: null,
    slots: [{ id: "slot-1", pageRoute: "/", componentName: "Hero", purpose: "hero", altText: "Hero", suggestedPrompt: "x", status, required: true }],
  });

  it("prefers intake, then agent questions, then images", () => {
    const base = { gate: null, questions: [], requirements: [], assetRequests: [request("PENDING")] };
    expect(pickLiveGroup(base)?.kind).toBe("images");
    expect(pickLiveGroup({ ...base, gate: gate({}) })?.key).toBe("intake:4:asking:language|business-name");
    expect(pickLiveGroup({ ...base, assetRequests: [request("RESOLVED")] })).toBeNull();
  });

  it("starts the image steps at the first open section", () => {
    const steps = buildImageSteps([request("PENDING")]);
    expect(steps.map((step) => step.id)).toEqual(["slot-1"]);
    expect(firstOpenStepIndex(steps)).toBe(0);
  });
});

describe("groupIntakeSteps", () => {
  it("folds steps from the same tool into one row and keeps the latest page list", () => {
    const groups = groupIntakeSteps([
      { tool: "request", detail: "Reading your request", items: [] },
      { tool: "request", detail: "Checking what this project already has", items: [] },
      { tool: "planner", detail: "Planning /", items: ["/ — Hero"] },
      { tool: "planner", detail: "Planning /booking", items: ["/ — Hero", "/booking — Booking Form"] },
    ]);
    expect(groups.map((group) => [group.tool, group.detail])).toEqual([
      ["request", "Checking what this project already has"],
      ["planner", "Planning /booking"],
    ]);
    expect(groups[0]?.doneDetails).toEqual(["Reading your request"]);
    expect(groups[1]?.items).toEqual(["/ — Hero", "/booking — Booking Form"]);
  });
});

describe("plan summary", () => {
  it("reads raw section names and merges duplicates", () => {
    expect(humanizeSectionName("hero.split")).toBe("Hero split");
    expect(humanizeSectionName("CTABanner")).toBe("CTA Banner");
    const overview = summarizePlan({
      blueprintId: "b",
      features: [],
      entities: [],
      pages: [{ route: "/", purpose: "Home", sections: [{ name: "Team" }, { name: "team", image: "hero" }, { name: "Hero" }] }],
    });
    expect(overview.pages[0]?.sections).toEqual([{ label: "Team", hasImage: true }, { label: "Top banner", hasImage: false }]);
    expect(overview).toMatchObject({ sectionCount: 2, imageCount: 1 });
  });

  it("uses plain page names and hides technical parts", () => {
    expect(pageTitle("/")).toBe("Home page");
    expect(pageTitle("/projects")).toBe("Projects");
    expect(pageTitle("/projects/[id]")).toBe("Single project page");
    const overview = summarizePlan({
      blueprintId: "b",
      features: [],
      entities: [],
      pages: [{ route: "/contact", purpose: "Reach us", sections: [{ name: "OpenGraphImage", image: "og" }, { name: "Modal" }, { name: "Carousel" }, { name: "Contact" }] }],
    });
    expect(overview.pages[0]).toMatchObject({ title: "Contact", imageCount: 0, sections: [{ label: "Contact", hasImage: false }] });
  });
});

describe("wireframe layout", () => {
  it("merges photo variants, hides the logo and orders blocks like a page", () => {
    const blocks = layoutBlocks([
      { label: "Contact", hasImage: false },
      { label: "About photo", hasImage: true },
      { label: "Footer", hasImage: false },
      { label: "Logo", hasImage: true },
      { label: "About", hasImage: false },
      { label: "Top banner", hasImage: false },
      { label: "Photo gallery", hasImage: true },
    ]);
    expect(blocks.map((block) => [block.label, block.kind, block.hasImage])).toEqual([
      ["Top banner", "hero", false],
      ["About", "about", true],
      ["Photo gallery", "gallery", true],
      ["Contact", "contact", false],
      ["Footer", "footer", false],
    ]);
  });
});
