import { dismissIntegrationRequest, listPendingIntegrationRequests } from "@repo/db";
import { Router } from "express";
import { z } from "zod";
import { ownedIntegrationRequestSessionId, ownedSessionProjectId } from "../../ownership";
import { integrationError } from "../integrations";

export const integrationRequestRouter = Router();

const RequestIdSchema = z.uuid();

integrationRequestRouter.get("/v1/sessions/:id/integration-requests", async (req, res) => {
  if (!req.userId) return integrationError(res, 401, "UNAUTHORIZED", "Authentication required");
  const projectId = await ownedSessionProjectId(req.params.id, req.userId);
  if (!projectId) return integrationError(res, 404, "NOT_FOUND", "Session not found");

  const items = await listPendingIntegrationRequests(req.params.id, new Date());
  res.setHeader("Cache-Control", "no-store");
  return res.json({ items });
});

integrationRequestRouter.post("/v1/integration-requests/:id/dismiss", async (req, res) => {
  const requestId = RequestIdSchema.safeParse(req.params.id);
  if (!requestId.success || !req.userId) return integrationError(res, 404, "NOT_FOUND", "Request not found");
  const sessionId = await ownedIntegrationRequestSessionId(requestId.data, req.userId);
  if (!sessionId) return integrationError(res, 404, "NOT_FOUND", "Request not found");

  const isDismissed = await dismissIntegrationRequest({ id: requestId.data, now: new Date() });
  if (!isDismissed) return integrationError(res, 409, "ALREADY_RESOLVED", "This request was already connected or closed");
  return res.status(204).end();
});
