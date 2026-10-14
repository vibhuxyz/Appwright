import { describe, expect, it } from "bun:test";
import { randomUUID } from "node:crypto";
import { createLogger, runWithTrace } from "@repo/logger";
import express from "express";

describe("API Tracing Middleware", () => {
  it("propagates client x-request-id and x-trace-id and captures them in logs", async () => {
    const logs: Array<Record<string, unknown>> = [];
    const testLogger = createLogger("api-test", {}, { writer: (line) => logs.push(line) });

    const app = express();
    app.use((req, res, next) => {
      const reqIdHeader = req.headers["x-request-id"];
      const traceIdHeader = req.headers["x-trace-id"];
      const requestId =
        typeof reqIdHeader === "string" && reqIdHeader.trim()
          ? reqIdHeader.trim()
          : randomUUID();
      const traceId =
        typeof traceIdHeader === "string" && traceIdHeader.trim()
          ? traceIdHeader.trim()
          : undefined;

      res.setHeader("x-request-id", requestId);
      if (traceId) {
        res.setHeader("x-trace-id", traceId);
      }

      runWithTrace({ requestId, ...(traceId ? { traceId } : {}) }, () => {
        testLogger.info("request received", { path: req.path });
        next();
      });
    });

    app.get("/test", (_req, res) => {
      testLogger.info("handling /test");
      res.json({ ok: true });
    });

    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    try {
      const res = await fetch(`http://localhost:${port}/test`, {
        headers: {
          "x-request-id": "client-req-999",
          "x-trace-id": "client-trace-777",
        },
      });

      expect(res.status).toBe(200);
      expect(res.headers.get("x-request-id")).toBe("client-req-999");
      expect(res.headers.get("x-trace-id")).toBe("client-trace-777");

      expect(logs.length).toBe(2);
      expect(logs[0]!.requestId).toBe("client-req-999");
      expect(logs[0]!.traceId).toBe("client-trace-777");
      expect(logs[0]!.msg).toBe("request received");

      expect(logs[1]!.requestId).toBe("client-req-999");
      expect(logs[1]!.traceId).toBe("client-trace-777");
      expect(logs[1]!.msg).toBe("handling /test");
    } finally {
      server.close();
    }
  });

  it("generates a random UUID when x-request-id is omitted and binds it to async logs", async () => {
    const logs: Array<Record<string, unknown>> = [];
    const testLogger = createLogger("api-test", {}, { writer: (line) => logs.push(line) });

    const app = express();
    app.use((req, res, next) => {
      const requestId = randomUUID();
      res.setHeader("x-request-id", requestId);
      runWithTrace({ requestId }, () => {
        testLogger.info("auto id request");
        next();
      });
    });

    app.get("/auto", async (_req, res) => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      testLogger.info("handling auto async");
      res.json({ ok: true });
    });

    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    try {
      const res = await fetch(`http://localhost:${port}/auto`);
      const generatedId = res.headers.get("x-request-id");
      expect(typeof generatedId).toBe("string");
      expect(generatedId!.length).toBeGreaterThan(10);

      expect(logs.length).toBe(2);
      expect(logs[0]!.requestId).toBe(generatedId);
      expect(logs[1]!.requestId).toBe(generatedId);
    } finally {
      server.close();
    }
  });
});
