import type { Message, ProjectSnapshot } from "@repo/contracts";
import { listProjectFiles } from "@repo/contracts";
import { runAgent } from "opencode-ai-cli";
import cors from "cors";
import express from "express";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json({ limit: "5mb" }));

const messageHistory: Message[] = [];
let latestSummary = "";

app.get("/api/project", async (_req, res) => {
  res.json(await buildSnapshot(latestSummary));
});

app.post("/api/messages", async (req, res) => {
  const { content, provider } = req.body ?? {};
  if (!content) {
    return res.status(400).json({ error: "content required" });
  }

  messageHistory.push({
    role: "user",
    content,
    createdAt: new Date().toISOString(),
  });

  try {
    const { reply, summary } = await runAgent(messageHistory, { provider });
    latestSummary = summary;
    messageHistory.push({
      role: "assistant",
      content: reply,
      createdAt: new Date().toISOString(),
    });
    res.json(await buildSnapshot(summary));
  } catch (err: any) {
    console.error("agent failed:", err);
    res.status(500).json({ error: err?.message ?? "agent failed" });
  }
});

async function buildSnapshot(summary: string): Promise<ProjectSnapshot> {
  return {
    summary,
    messageHistory,
    files: await listProjectFiles(),
    updatedAt: new Date().toISOString(),
    previewUrl: "http://localhost:5173",
  };
}

app.listen(PORT, () => console.log(`backed on :${PORT}`));
