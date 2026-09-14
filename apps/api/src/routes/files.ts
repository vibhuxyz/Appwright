import { listProjectPaths, readProjectFile } from "@repo/contracts";
import { Router } from "express";
import { ownedProjectId } from "../ownership";

export const filesRouter = Router();

filesRouter.get("/files/:projectId", async (req, res) => {
  if (!(await ownedProjectId(req.params.projectId, req.userId!))) {
    return res.status(404).json({ error: "not found" });
  }
  const paths = await listProjectPaths(req.params.projectId);
  res.json({ paths });
});

filesRouter.get("/files/:projectId/content", async (req, res) => {
  if (!(await ownedProjectId(req.params.projectId, req.userId!))) {
    return res.status(404).json({ error: "not found" });
  }
  const relPath = String(req.query.path ?? "");
  if (!relPath)
    return res.status(400).json({ error: "path query param required" });
  try {
    const content = await readProjectFile(req.params.projectId, relPath);
    res.json({ path: relPath, content });
  } catch (err) {
    res
      .status(404)
      .json({ error: err instanceof Error ? err.message : String(err) });
  }
});
