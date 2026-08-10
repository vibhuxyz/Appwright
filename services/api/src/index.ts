import cors from "cors";
import express from "express";

// V0 placeholder. This becomes the real API in V1 — see docs/versions/V1_WEB_APP.md.
// Right now it exists to prove the toolchain boots.

const PORT = Number(process.env.PORT ?? 3001);
const AGENT_URL = process.env.AGENT_URL ?? "http://localhost:8000";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
	res.json({ ok: true, service: "api" });
});

app.get("/hello", (_req, res) => {
	res.json({ message: "hello from the TypeScript API" });
});

// Proves the language boundary works: TS calls Python over HTTP.
// In V1 this becomes POST /conversation with SSE streaming.
app.get("/hello/agent", async (_req, res) => {
	try {
		const upstream = await fetch(`${AGENT_URL}/hello`);
		res.json({ api: "ok", agent: await upstream.json() });
	} catch (err) {
		res.status(502).json({
			api: "ok",
			agent: null,
			error: `agent unreachable at ${AGENT_URL}`,
			hint: "start it with: make dev-agent",
		});
	}
});

app.listen(PORT, () => console.log(`api listening on :${PORT}`));
