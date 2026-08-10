import { hello as agentHello } from "@repo/agent-core";
import { hello as toolsHello } from "@repo/tools";
import cors from "cors";
import express from "express";

// V0 placeholder. This becomes the real API in V1 — see docs/versions/V1_WEB_APP.md.
// Right now it exists to prove the toolchain boots and the workspace resolves.

const PORT = Number(process.env.PORT ?? 3001);

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
	res.json({ ok: true, service: "api" });
});

// The agent is a LIBRARY, not a service. No HTTP hop, no serialisation, no second
// process to keep alive. In V3 a worker imports the same package and runs it next
// to a sandbox — see docs/DECISIONS.md D4.
app.get("/hello", (_req, res) => {
	res.json({
		api: "hello from the TypeScript API",
		agentCore: agentHello().message,
		tools: toolsHello().message,
	});
});

app.listen(PORT, () => console.log(`api listening on :${PORT}`));
