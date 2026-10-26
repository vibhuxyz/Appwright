import { describe, expect, it } from "bun:test";
import { INTEGRATION_CATALOG, type AgentQuestionResponse, type IntegrationCatalogResponse, type PendingIntegrationRequirement } from "@repo/contracts";
import {
  INITIAL_DOCK_STATE,
  autoAnswerAction,
  buildDockSteps,
  dockReducer,
  planDockSubmission,
  toggleOption,
  toggleOther,
  validateStep,
  EMPTY_CHOICE_DRAFT,
} from "../src/features/agent/questions/steps";
import { lateAnswerMessage, lateSource } from "../src/features/agent/questions/steps";

const question: AgentQuestionResponse = {
  id: "q1",
  sessionId: "s1",
  toolCallId: null,
  status: "PENDING",
  questions: [
    { label: "Payment Purpose", text: "What should customers pay for?", options: ["Booking fee", "Advance"], defaultOptionIndex: 0, inputType: "multiple" },
  ],
  answers: null,
  createdAt: "2026-10-25T00:00:00.000Z",
  expiresAt: "2026-10-25T01:00:00.000Z",
};

const requirement: PendingIntegrationRequirement = {
  id: "r1",
  projectId: "p1",
  sessionId: "s1",
  provider: "razorpay",
  reason: "Take booking payments",
  status: "PENDING",
  developmentStatus: "missing",
  credentialMode: null,
  lastError: null,
  createdAt: "2026-10-25T00:00:00.000Z",
};

const catalog: IntegrationCatalogResponse = {
  catalog: INTEGRATION_CATALOG.map((entry) => ({ ...entry, canUseManagedCredentials: entry.provider === "razorpay", fields: [...entry.fields], capabilities: [...entry.capabilities], managedCapabilities: [...entry.managedCapabilities], setupInstructions: [...entry.setupInstructions] })),
  configurations: [],
  quotas: [],
};

describe("buildDockSteps", () => {
  it("puts agent questions first and adds key fields only after choosing your own key", () => {
    const base = buildDockSteps({ questions: [question], requirements: [requirement], catalog, credentialDrafts: {} });
    expect(base.map((step) => step.kind)).toEqual(["question", "integration-choice"]);

    const ownKey = buildDockSteps({
      questions: [question],
      requirements: [requirement],
      catalog,
      credentialDrafts: { r1: { choice: "YOUR_KEY", primaryValues: {}, hasSeparateProductionKey: false, productionValues: {} } },
    });
    expect(ownKey.map((step) => step.kind)).toEqual(["question", "integration-choice", "integration-field", "integration-field", "integration-field"]);
  });
});

describe("choice drafts", () => {
  it("toggles multiple options and clears options when a single question picks something else", () => {
    const multi = toggleOption(toggleOption(EMPTY_CHOICE_DRAFT, 1, "multiple"), 0, "multiple");
    expect(multi.selectedOptionIndexes).toEqual([0, 1]);
    const single = toggleOther(toggleOption(EMPTY_CHOICE_DRAFT, 0, "single"), "single");
    expect(single).toMatchObject({ selectedOptionIndexes: [], isOtherSelected: true });
  });
});

describe("validation, auto-answer and submission", () => {
  const steps = buildDockSteps({ questions: [question], requirements: [requirement], catalog, credentialDrafts: {} });
  const [questionStep, choiceStep] = steps;

  it("requires an answer before moving on", () => {
    if (!questionStep) throw new Error("missing step");
    expect(Object.keys(validateStep(questionStep, INITIAL_DOCK_STATE))).toEqual([questionStep.id]);
  });

  it("auto-answers with the default option and the Appwright test key", () => {
    if (!questionStep || !choiceStep) throw new Error("missing step");
    const afterQuestion = dockReducer(INITIAL_DOCK_STATE, autoAnswerAction(questionStep, INITIAL_DOCK_STATE) ?? { type: "go-to", stepIndex: 0 });
    const action = autoAnswerAction(choiceStep, afterQuestion);
    const answered = action ? dockReducer(afterQuestion, action) : afterQuestion;
    const plan = planDockSubmission({ steps, state: answered, questions: [question] });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.answers).toEqual([{ questionId: "q1", request: { answers: [{ selectedOptionIndexes: [0] }] } }]);
    expect(plan.configurations[0]?.requests.map((item) => item.credentialMode)).toEqual(["APPWRITE_MANAGED", "APPWRITE_MANAGED"]);
  });
});

describe("late answers", () => {
  const late = {
    kind: "agent" as const,
    id: "late:reply-1",
    questions: [{ label: "Recipient", text: "Where should enquiries go?", options: ["Owner email", "Shared inbox"], defaultOptionIndex: 0, inputType: "single" as const }],
  };

  it("turns skipped agent questions back into answerable rows", () => {
    const source = lateSource(late, { projectId: "project-1", sessionId: "session-1" });
    expect(source.questions[0]).toMatchObject({ id: "late:reply-1", status: "PENDING" });
    expect(source.requirements).toEqual([]);
  });

  it("writes the late answers as the next chat message", () => {
    const plan = { ok: true as const, configurations: [], answers: [{ questionId: late.id, request: { answers: [{ selectedOptionIndexes: [1] }] } }] };
    expect(lateAnswerMessage(late, plan)).toBe("Recipient — Where should enquiries go?\nShared inbox");
  });

  it("names the connection mode for a late integration", () => {
    const integration = { kind: "integration" as const, id: "late:reply-2", providers: ["razorpay" as const], reason: "Take payments" };
    const source = lateSource(integration, { projectId: "project-1", sessionId: "session-1" });
    expect(source.requirements[0]).toMatchObject({ provider: "razorpay", developmentStatus: "missing" });
    const plan = {
      ok: true as const,
      answers: [],
      configurations: [{
        choiceStepId: "i:late",
        provider: "razorpay",
        providerName: "Razorpay",
        notice: null,
        requests: [{ provider: "razorpay" as const, credentialMode: "APPWRITE_MANAGED" as const, environment: "development" as const, values: {} }],
      }],
    };
    expect(lateAnswerMessage(integration, plan)).toBe("Razorpay — How should I connect it?\nAppwright test key\n\nIt is connected now. Please continue.");
  });
});
