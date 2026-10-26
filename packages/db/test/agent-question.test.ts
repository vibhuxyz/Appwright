import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { AgentQuestionItem } from "@repo/contracts";
import {
  answerAgentQuestion,
  createAgentQuestion,
  dismissAgentQuestion,
  getAgentQuestionOutcome,
  listPendingAgentQuestions,
  validateAgentQuestionAnswers,
} from "../src/agent-question";
import { prisma } from "../src/lib/prisma";

const HOUR_MS = 3_600_000;
const questions: AgentQuestionItem[] = [
  { label: "Payment Purpose", text: "What should customers pay for?", options: ["Booking fee", "Advance"], defaultOptionIndex: 0, inputType: "multiple" },
  { label: "After Payment", text: "What happens next?", options: ["Show receipt", "Redirect"], defaultOptionIndex: 0, inputType: "single" },
];

describe("validateAgentQuestionAnswers", () => {
  it("accepts one valid answer per question", () => {
    expect(validateAgentQuestionAnswers(questions, [
      { selectedOptionIndexes: [0, 1] },
      { selectedOptionIndexes: [], otherText: "Send a WhatsApp message" },
    ])).toEqual({ ok: true });
  });

  it("rejects missing, out-of-range, and multiple answers to a single-choice question", () => {
    expect(validateAgentQuestionAnswers(questions, [{ selectedOptionIndexes: [0] }]).ok).toBe(false);
    expect(validateAgentQuestionAnswers(questions, [{ selectedOptionIndexes: [5] }, { selectedOptionIndexes: [0] }]).ok).toBe(false);
    expect(validateAgentQuestionAnswers(questions, [{ selectedOptionIndexes: [0] }, { selectedOptionIndexes: [0, 1] }]).ok).toBe(false);
    expect(validateAgentQuestionAnswers(questions, [{ selectedOptionIndexes: [] }, { selectedOptionIndexes: [0] }]).ok).toBe(false);
  });
});

describe("agent question repository", () => {
  let userId = "";
  let sessionId = "";

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { email: `agent-q-${Date.now()}@example.com`, hashPassword: "x" } });
    const project = await prisma.project.create({ data: { name: "Questions", workspacePath: "/tmp/q", userId: user.id } });
    const session = await prisma.session.create({ data: { projectId: project.id } });
    userId = user.id;
    sessionId = session.id;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } });
  });

  it("answers a pending question once and reports the second answer as resolved", async () => {
    const now = new Date();
    const { id } = await createAgentQuestion({ sessionId, toolCallId: "call-1", questions, expiresAt: new Date(now.getTime() + HOUR_MS) });
    const pending = await listPendingAgentQuestions(sessionId, now);
    expect(pending.items.map((item) => item.id)).toContain(id);
    expect(await getAgentQuestionOutcome(id)).toBeNull();

    const answers = [{ selectedOptionIndexes: [1] }, { selectedOptionIndexes: [0] }];
    expect(await answerAgentQuestion({ id, answers, now })).toEqual({ ok: true });
    expect(await answerAgentQuestion({ id, answers, now })).toEqual({ ok: false, reason: "ALREADY_RESOLVED" });
    expect(await getAgentQuestionOutcome(id)).toEqual({ status: "ANSWERED", answers });
  });

  it("hides expired questions and records dismissals", async () => {
    const now = new Date();
    const expired = await createAgentQuestion({ sessionId, toolCallId: null, questions, expiresAt: new Date(now.getTime() - 1) });
    const dismissed = await createAgentQuestion({ sessionId, toolCallId: null, questions, expiresAt: new Date(now.getTime() + HOUR_MS) });
    const pending = await listPendingAgentQuestions(sessionId, now);
    expect(pending.items.some((item) => item.id === expired.id)).toBe(false);
    await dismissAgentQuestion({ id: dismissed.id, now });
    expect((await getAgentQuestionOutcome(dismissed.id))?.status).toBe("DISMISSED");
  });
});
