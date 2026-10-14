import { prisma, type Prisma } from "@repo/db";
import {
  isDeniedInMode,
  requiresApproval,
  type SessionPermissionMode,
} from "@repo/decision-engine";
import { publishApproval, publishStatus } from "../stream/sse";

interface WaitForApprovalParams {
  sessionId: string;
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  mode?: string;
  allowedTools?: readonly string[];
  signal: AbortSignal;
}

export async function waitForApproval(
  params: WaitForApprovalParams,
): Promise<{ approved: boolean; reason?: string }> {
  const mode = (params.mode as SessionPermissionMode) ?? "default";
  if (isDeniedInMode({ toolName: params.toolName, mode })) {
    return {
      approved: false,
      reason: `Session is in plan mode (read-only); ${params.toolName} is not allowed`,
    };
  }

  const needsApproval = requiresApproval({
    toolName: params.toolName,
    args: params.args,
    mode,
    allowedTools: params.allowedTools,
  });

  if (!needsApproval) {
    return { approved: true };
  }

  const row = await prisma.approval.create({
    data: {
      sessionId: params.sessionId,
      toolCallId: params.toolCallId,
      toolName: params.toolName,
      args: params.args as Prisma.InputJsonValue,
      status: "PENDING",
    },
  });

  await prisma.session.update({
    where: { id: params.sessionId },
    data: { status: "AWAITING_APPROVAL" },
  });

  publishStatus(
    params.sessionId,
    "AWAITING_APPROVAL",
    `Awaiting approval for ${params.toolName}`,
  );

  publishApproval(params.sessionId, {
    id: row.id,
    sessionId: row.sessionId,
    toolCallId: row.toolCallId,
    toolName: row.toolName,
    args: row.args,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  });

  while (!params.signal.aborted) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const current = await prisma.approval.findUnique({
      where: { id: row.id },
    });

    if (!current) {
      return { approved: false, reason: "Approval request was deleted" };
    }

    if (current.status === "APPROVED") {
      await prisma.session.update({
        where: { id: params.sessionId },
        data: { status: "RUNNING" },
      });
      publishStatus(params.sessionId, "RUNNING", `Running ${params.toolName}…`);
      return { approved: true };
    }

    if (current.status === "DENIED") {
      await prisma.session.update({
        where: { id: params.sessionId },
        data: { status: "RUNNING" },
      });
      publishStatus(params.sessionId, "RUNNING", "Approval denied by user");
      return {
        approved: false,
        reason: "User denied permission for this action",
      };
    }
  }

  return { approved: false, reason: "Execution stopped while awaiting approval" };
}

export function createApprovalHook(
  sessionId: string,
  defaultMode: string,
  signal: AbortSignal,
) {
  return async (call: {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
  }) => {
    const latest = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { mode: true, allowedTools: true },
    });
    return waitForApproval({
      sessionId,
      toolCallId: call.toolCallId,
      toolName: call.toolName,
      args: call.args,
      mode: latest?.mode ?? defaultMode,
      allowedTools: latest?.allowedTools ?? [],
      signal,
    });
  };
}
