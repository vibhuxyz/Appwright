import {
  buildSystemPrompt,
  formatPlanForAgent,
  LocalRuntime,
  OpenAiProvider,
  planTasks,
  runAgentLoop,
  verifyTypeScript,
  type AgentEvent,
  type Message as CoreMessage,
} from "@repo/agent-core";
import { SendMessageRequest } from "@repo/contracts";
import { prisma, type Prisma } from "@repo/db";
import { ALL_TOOLS } from "@repo/tools";
import { Router } from "express";
import { ownedSessionProjectId, requireAuthAllowingQueryToken } from "../auth";
import { attachSseClient, publishDelta, publishMessage, publishUsage } from "../stream/sse";

export const conversationRouter = Router();

// The SSE route is the one exception to the app-wide bearer-token wall:
// EventSource cannot set headers, so it takes the JWT as a query param and
// is mounted before the wall with its own middleware.
export const streamRouter = Router();
streamRouter.use(requireAuthAllowingQueryToken);

interface MessageRow {
  id: string;
  sessionId: string;
  seq: number;
  role: string;
  type: string;
  content: string;
  data: unknown;
  createdAt: Date;
}

function serializeRow(row: MessageRow) {
  return {
    id: row.id,
    seq: row.seq,
    role: row.role,
    type: row.type,
    content: row.content,
    data: row.data,
    createdAt: row.createdAt.toISOString(),
  };
}

// The DB Message model is a flatter shape than agent-core's Message (no
// dedicated toolCallId column) — toolCall/toolResponse stash it in `data`.
// This is the inverse of that mapping, used to rebuild the messages[] array
// runAgentLoop needs from what's already persisted.
function toCoreMessage(row: MessageRow): CoreMessage {
  if (row.type === "text") {
    return {
      role: row.role as "user" | "assistant",
      type: "text",
      content: row.content,
    };
  }
  if (row.type === "toolCall") {
    const data = row.data as {
      toolCallId: string;
      toolName: string;
      args: Record<string, unknown>;
      providerMeta?: unknown;
    };
    return {
      role: "assistant",
      type: "toolCall",
      toolCallId: data.toolCallId,
      content: {
        toolName: data.toolName,
        args: data.args,
        providerMeta: data.providerMeta ?? undefined,
      },
    };
  }
  const data = row.data as { toolCallId: string };
  return {
    role: "tool",
    type: "toolResponse",
    toolCallId: data.toolCallId,
    content: row.content,
  };
}

conversationRouter.get("/conversations/:sessionId", async (req, res) => {
  if (!(await ownedSessionProjectId(req.params.sessionId, req.userId!))) {
    return res.status(404).json({ error: "not found" });
  }
  const afterSeq = req.query.afterSeq ? Number(req.query.afterSeq) : -1;
  const rows = await prisma.message.findMany({
    where: { sessionId: req.params.sessionId, seq: { gt: afterSeq } },
    orderBy: { seq: "asc" },
  });
  res.json(rows.map(serializeRow));
});

streamRouter.get("/stream/:sessionId", async (req, res) => {
  if (!(await ownedSessionProjectId(req.params.sessionId, req.userId!))) {
    return res.status(404).json({ error: "not found" });
  }
  const afterSeq = req.query.afterSeq ? Number(req.query.afterSeq) : -1;
  attachSseClient(req.params.sessionId, res, afterSeq);
});

conversationRouter.post("/conversation", async (req, res) => {
  const body = SendMessageRequest.parse(req.body);
  const session = await prisma.session.findFirst({
    where: { id: body.sessionId, project: { userId: req.userId! } },
  });
  if (!session) return res.status(404).json({ error: "session not found" });

  const priorRows = await prisma.message.findMany({
    where: { sessionId: session.id },
    orderBy: { seq: "asc" },
  });
  let seqCounter = (priorRows.at(-1)?.seq ?? -1) + 1;

  // This response IS the live listener for this run — attach it before
  // anything is persisted so it never misses a frame. Any OTHER tab watching
  // the same session attaches via GET /stream and gets the same publishes.
  attachSseClient(session.id, res, -1);

  async function persist(fields: {
    role: string;
    type: string;
    content: string;
    data?: Record<string, unknown>;
  }): Promise<MessageRow> {
    // Postgres text columns reject raw NUL bytes (0x00) outright. Bun's own
    // error formatting embeds one in ENOENT-style path errors (seen when a
    // tool ran against a workspace that no longer exists) — strip defensively
    // rather than let one bad error message crash the whole persist layer.
    const row = await prisma.message.create({
      data: {
        sessionId: session!.id,
        seq: seqCounter++,
        ...fields,
        content: fields.content.replaceAll("\u0000", ""),
        data: fields.data as Prisma.InputJsonValue | undefined,
      },
    });
    publishMessage(session!.id, { kind: "message", seq: row.seq, message: serializeRow(row) });
    return row;
  }

  const userRow = await persist({ role: "user", type: "text", content: body.prompt });
  await prisma.session.update({ where: { id: session.id }, data: { status: "RUNNING" } });

  const runtime = new LocalRuntime(session.projectId);

  // The rules in prompts/system.md — never persisted or streamed to the
  // client, just prepended fresh to what the provider sees each call. cli.ts
  // does this too; this route used to skip it entirely, so every web-driven
  // run had no rules at all and the model fell back to describing code in
  // prose instead of calling write_file/edit_file.
  const systemPrompt = await buildSystemPrompt(runtime);
  const systemMessage: CoreMessage = { role: "user", type: "text", content: systemPrompt };

  // Stopgap ahead of V4's real planner (docs/versions/V4_APP_BUILDER.md) —
  // one extra LLM call turns the prompt into a checklist so the loop has
  // something concrete to verify against, instead of stopping after the
  // first edit that "sounds done". See libs/ts/agent-core/src/planner.ts.
  const planningProvider = new OpenAiProvider({ model: session.model });
  let planMessage: CoreMessage | undefined;
  try {
    const tasks = await planTasks(runtime, planningProvider, body.prompt);
    await persist({
      role: "assistant",
      type: "text",
      content: `Plan:\n${tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")}`,
    });
    planMessage = { role: "user", type: "text", content: formatPlanForAgent(tasks) };
  } catch (err) {
    console.error(`planning failed for session ${session.id}, continuing without a plan:`, err);
  }

  const messages: CoreMessage[] = [
    systemMessage,
    ...priorRows.map(toCoreMessage),
    toCoreMessage(userRow),
    ...(planMessage ? [planMessage] : []),
  ];
  const controller = new AbortController();
  // No abort on req close: the run is a background job that happens to have
  // a listener, not a request that happens to be slow (V1 trap table).

  let textBuffer = "";

  const emit = async (event: AgentEvent) => {
    switch (event.type) {
      case "text_delta":
        textBuffer += event.delta;
        publishDelta(session!.id, event.delta);
        break;
      case "tool_call_start":
        await persist({
          role: "assistant",
          type: "toolCall",
          content: event.toolName,
          data: {
            toolCallId: event.toolCallId,
            toolName: event.toolName,
            args: event.args,
            providerMeta: event.providerMeta ?? null,
          },
        });
        break;
      case "tool_call_end":
        await persist({
          role: "tool",
          type: "toolResponse",
          content: event.result,
          data: { toolCallId: event.toolCallId },
        });
        break;
      case "tool_error":
        await persist({
          role: "tool",
          type: "toolResponse",
          content: `Error: ${event.error}`,
          data: { toolCallId: event.toolCallId },
        });
        break;
      case "usage": {
        // `increment`, not read-then-write. Two runs on one session (or one
        // run and a stale read) would otherwise each write the total they
        // saw, and the second silently erases the first — the same
        // read-then-check race D45 records for budgets, in miniature.
        const updated = await prisma.session.update({
          where: { id: session!.id },
          data: {
            cost: { increment: event.costUsd },
            tokenIn: { increment: event.inputTokens },
            tokenOut: { increment: event.outputTokens },
          },
          select: { cost: true, tokenIn: true, tokenOut: true },
        });
        publishUsage(session!.id, { kind: "usage", ...updated });
        break;
      }
      case "error":
        // The loop's own diagnostic for a fatalError — without this case it
        // was silently dropped: no log, no chat message, the UI just hung
        // on "working..." forever with no way to tell what happened.
        console.error(`agent loop error for session ${session!.id}:`, event.message);
        await persist({
          role: "assistant",
          type: "text",
          content: `Something went wrong and the run stopped: ${event.message}`,
        });
        break;
      case "agent_end":
        if (textBuffer) {
          await persist({ role: "assistant", type: "text", content: textBuffer });
          textBuffer = "";
        }
        break;
    }
  };

  // The model's own "verify your work" habit is re-reading files and
  // self-reporting — which catches nothing when a file is syntactically
  // broken (duplicated blocks, unclosed JSX). tsc actually checks. If it
  // fails, feed the real compiler errors back and let the agent take
  // another pass, capped so a persistently broken generation doesn't loop
  // forever.
  const MAX_VERIFY_ATTEMPTS = 2;
  let finalStopReason: string = "completed";

  try {
    for (let attempt = 0; attempt <= MAX_VERIFY_ATTEMPTS; attempt++) {
      const stopReason = await runAgentLoop({
        messages,
        tools: ALL_TOOLS,
        provider: new OpenAiProvider({ model: session.model }),
        runtime,
        emit,
        budget: {
          // A multi-item checklist means more read/edit/verify cycles than a
          // single-edit turn — 20 was tuned for the latter and cut runs off
          // mid-checklist.
          maxIterations: 40,
          maxTokens: 150_000,
          maxCostUsd: 5,
          deadline: Date.now() + 8 * 60_000,
        },
        signal: controller.signal,
        sessionId: session.id,
      });
      finalStopReason = stopReason;

      if (stopReason !== "completed") break;

      const verifyResult = await verifyTypeScript(runtime);
      if (verifyResult.ok) break;

      if (attempt === MAX_VERIFY_ATTEMPTS) {
        await persist({ role: "assistant", type: "text", content: `❌ Type-check still failing after ${MAX_VERIFY_ATTEMPTS} attempts. Giving up.` });
        finalStopReason = "fatalError";
        break;
      }

      const fixMessage: CoreMessage = {
        role: "user",
        type: "text",
        content: `Running \`tsc --noEmit\` on your changes found real errors — fix them, then
stop. Do not describe the fix, make it with edit_file/write_file.\n\n${verifyResult.output}`,
      };
      await persist({ role: "user", type: "text", content: `Type-check failed, retrying:\n${verifyResult.output}` });
      messages.push(fixMessage);
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { status: finalStopReason === "fatalError" ? "ERROR" : "IDLE" },
    });
  } catch (err) {
    await prisma.session.update({ where: { id: session.id }, data: { status: "ERROR" } });
    console.error(`run failed for session ${session.id}:`, err);
  } finally {
    if (!res.writableEnded) res.end();
  }
});
