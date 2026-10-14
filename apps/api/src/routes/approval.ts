import { Router } from "express";
import { ResolveApprovalRequest, type ApprovalResponse } from "@repo/contracts";
import { prisma } from "@repo/db";
import { ownedSessionProjectId } from "../ownership";

export const approvalRouter = Router();

function serializeApproval(row: {
  id: string;
  sessionId: string;
  messageId: string | null;
  toolCallId: string | null;
  toolName: string;
  args: unknown;
  status: string;
  createdAt: Date;
  resolvedAt: Date | null;
}): ApprovalResponse {
  return {
    id: row.id,
    sessionId: row.sessionId,
    messageId: row.messageId,
    toolCallId: row.toolCallId,
    toolName: row.toolName,
    args: (row.args as Record<string, unknown>) ?? {},
    status: row.status as ApprovalResponse["status"],
    createdAt: row.createdAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
  };
}

approvalRouter.get("/approvals/:sessionId", async (req, res) => {
  const projectId = await ownedSessionProjectId(req.params.sessionId, req.userId!);
  if (!projectId) {
    return res.status(404).json({ error: "not found" });
  }

  const rows = await prisma.approval.findMany({
    where: { sessionId: req.params.sessionId },
    orderBy: { createdAt: "asc" },
  });

  res.json(rows.map(serializeApproval));
});

approvalRouter.post("/approval/:id", async (req, res) => {
  const body = ResolveApprovalRequest.parse(req.body);
  const approval = await prisma.approval.findUnique({
    where: { id: req.params.id },
  });

  if (!approval) {
    return res.status(404).json({ error: "not found" });
  }

  const projectId = await ownedSessionProjectId(approval.sessionId, req.userId!);
  if (!projectId) {
    return res.status(404).json({ error: "not found" });
  }

  const updated = await prisma.approval.update({
    where: { id: req.params.id },
    data: {
      status: body.status,
      resolvedAt: new Date(),
    },
  });

  if (body.status === "APPROVED" && body.alwaysAllowTool) {
    const session = await prisma.session.findUnique({
      where: { id: approval.sessionId },
      select: { allowedTools: true },
    });
    if (session && !session.allowedTools.includes(approval.toolName)) {
      await prisma.session.update({
        where: { id: approval.sessionId },
        data: {
          allowedTools: [...session.allowedTools, approval.toolName],
        },
      });
    }
  }

  res.json(serializeApproval(updated));
});
