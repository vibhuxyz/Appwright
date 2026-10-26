import { AnswerAgentQuestionRequestSchema } from "@repo/contracts";
import {
  answerAgentQuestion,
  dismissAgentQuestion,
  getAgentQuestion,
  listPendingAgentQuestions,
  validateAgentQuestionAnswers,
} from "@repo/db";
import { Router, type Request } from "express";
import { z } from "zod";
import { log } from "../../log";
import { ownedAgentQuestionSessionId, ownedSessionProjectId } from "../../ownership";
import { publishAgentQuestion } from "../../stream/sse";
import { integrationError } from "../integrations";

export const agentQuestionRouter = Router();

const QuestionIdSchema = z.uuid();

async function ownedQuestionSession(req: Request<{ id: string }>): Promise<string | null> {
  const questionId = QuestionIdSchema.safeParse(req.params.id);
  if (!questionId.success || !req.userId) return null;
  return ownedAgentQuestionSessionId(questionId.data, req.userId);
}

agentQuestionRouter.get("/v1/sessions/:id/agent-questions", async (req, res) => {
  if (!req.userId) return integrationError(res, 401, "UNAUTHORIZED", "Authentication required");
  const projectId = await ownedSessionProjectId(req.params.id, req.userId);
  if (!projectId) return integrationError(res, 404, "NOT_FOUND", "Session not found");

  const { items, skipped } = await listPendingAgentQuestions(req.params.id, new Date());
  if (skipped.length > 0) log.warn("Skipped invalid agent questions", { sessionId: req.params.id, skipped });
  res.setHeader("Cache-Control", "no-store");
  return res.json({ items });
});

agentQuestionRouter.post("/v1/agent-questions/:id/answers", async (req, res) => {
  const sessionId = await ownedQuestionSession(req);
  if (!sessionId) return integrationError(res, 404, "NOT_FOUND", "Question not found");

  const parsed = AnswerAgentQuestionRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return integrationError(res, 400, "INVALID_INPUT", "Invalid answers", { issues: parsed.error.issues });
  }
  const question = await getAgentQuestion(req.params.id);
  if (!question) return integrationError(res, 404, "NOT_FOUND", "Question not found");
  const validation = validateAgentQuestionAnswers(question.questions, parsed.data.answers);
  if (!validation.ok) return integrationError(res, 400, "INVALID_ANSWERS", validation.message);

  const now = new Date();
  const result = await answerAgentQuestion({ id: question.id, answers: parsed.data.answers, now });
  if (!result.ok) return integrationError(res, 409, "ALREADY_RESOLVED", "This question was already answered or closed");
  publishAgentQuestion(sessionId, { id: question.id, sessionId, status: "ANSWERED", createdAt: question.createdAt });
  return res.json({ ok: true });
});

agentQuestionRouter.post("/v1/agent-questions/:id/dismiss", async (req, res) => {
  const sessionId = await ownedQuestionSession(req);
  if (!sessionId) return integrationError(res, 404, "NOT_FOUND", "Question not found");

  const result = await dismissAgentQuestion({ id: req.params.id, now: new Date() });
  if (!result.ok) return integrationError(res, 409, "ALREADY_RESOLVED", "This question was already answered or closed");
  publishAgentQuestion(sessionId, { id: req.params.id, sessionId, status: "DISMISSED", createdAt: new Date().toISOString() });
  return res.status(204).end();
});
