import { DevLogsResponse } from "@repo/contracts";
import { Router } from "express";
import { z } from "zod";
import { logBufferFor } from "../dev-logs";
import { ownedSessionWorktree } from "../ownership";
import { sessionServerKey } from "../workspace/manager";

export const devLogsRouter = Router();

const DevLogsQuery = z.object({ after: z.coerce.number().int().nonnegative().default(0) });

devLogsRouter.get("/v1/sessions/:sessionId/dev-logs", async (req, res) => {
  const query = DevLogsQuery.safeParse(req.query);
  if (!query.success) {
    return res.status(400).json({ error: { code: "BAD_REQUEST", message: "after must be a non-negative integer", details: {}, requestId: "" } });
  }
  const owned = await ownedSessionWorktree(req.params.sessionId, req.userId!);
  if (!owned) {
    return res.status(404).json({ error: { code: "NOT_FOUND", message: "not found", details: {}, requestId: "" } });
  }
  const buffer = logBufferFor(sessionServerKey(owned.worktreeSessionId));
  res.json(DevLogsResponse.parse({ ...buffer.since(query.data.after), isRunning: buffer.isRunning() }));
});
