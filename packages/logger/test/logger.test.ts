import { describe, expect, it } from "bun:test";
import {
  createLogger,
  getTraceContext,
  parseLogLevel,
  runWithTrace,
  setTraceContext,
  type LogLevel,
} from "../src/index";

describe("@repo/logger", () => {
  it("formats log lines as structured JSON with ts, level, service, and msg", () => {
    const logs: Array<Record<string, unknown>> = [];
    const logger = createLogger(
      "test-service",
      { env: "test" },
      {
        writer: (line) => logs.push(line),
        minLevel: "debug",
      },
    );

    logger.info("service started", { port: 3000 });

    expect(logs.length).toBe(1);
    const entry = logs[0]!;
    expect(entry.service).toBe("test-service");
    expect(entry.level).toBe("info");
    expect(entry.msg).toBe("service started");
    expect(entry.env).toBe("test");
    expect(entry.port).toBe(3000);
    expect(typeof entry.ts).toBe("string");
    expect(new Date(entry.ts as string).getTime()).not.toBeNaN();
  });

  describe("Log-level filtering", () => {
    it("filters out logs below the configured minLevel", () => {
      const logs: Array<Record<string, unknown>> = [];
      const logger = createLogger(
        "filter-service",
        {},
        {
          minLevel: "warn",
          writer: (line) => logs.push(line),
        },
      );

      expect(logger.isLevelEnabled("debug")).toBe(false);
      expect(logger.isLevelEnabled("info")).toBe(false);
      expect(logger.isLevelEnabled("warn")).toBe(true);
      expect(logger.isLevelEnabled("error")).toBe(true);

      logger.debug("debug message");
      logger.info("info message");
      logger.warn("warning message");
      logger.error("error message");

      expect(logs.length).toBe(2);
      expect(logs[0]!.level).toBe("warn");
      expect(logs[0]!.msg).toBe("warning message");
      expect(logs[1]!.level).toBe("error");
      expect(logs[1]!.msg).toBe("error message");
    });

    it("dynamically respects process.env.LOG_LEVEL when minLevel option is not pinned", () => {
      const original = process.env.LOG_LEVEL;
      try {
        process.env.LOG_LEVEL = "error";
        const logs: Array<Record<string, unknown>> = [];
        const logger = createLogger("env-service", {}, { writer: (line) => logs.push(line) });

        expect(logger.isLevelEnabled("info")).toBe(false);
        expect(logger.isLevelEnabled("warn")).toBe(false);
        expect(logger.isLevelEnabled("error")).toBe(true);

        logger.info("should not appear");
        logger.warn("should not appear");
        logger.error("critical error");

        expect(logs.length).toBe(1);
        expect(logs[0]!.msg).toBe("critical error");
      } finally {
        process.env.LOG_LEVEL = original;
      }
    });

    it("parseLogLevel normalizes strings and falls back safely", () => {
      expect(parseLogLevel("DEBUG")).toBe("debug");
      expect(parseLogLevel("  INFO ")).toBe("info");
      expect(parseLogLevel("warn")).toBe("warn");
      expect(parseLogLevel("error")).toBe("error");
      expect(parseLogLevel("unknown", "warn")).toBe("warn");
      expect(parseLogLevel(undefined, "info")).toBe("info");
    });
  });

  describe("Child Loggers", () => {
    it("inherits service, minLevel, baseContext, and writer", () => {
      const logs: Array<Record<string, unknown>> = [];
      const parent = createLogger(
        "api",
        { region: "us-east-1" },
        {
          minLevel: "info",
          writer: (line) => logs.push(line),
        },
      );

      const child = parent.child({ component: "auth" });
      child.debug("ignored debug");
      child.info("child login", { user: "alice" });

      expect(logs.length).toBe(1);
      expect(logs[0]!.service).toBe("api");
      expect(logs[0]!.region).toBe("us-east-1");
      expect(logs[0]!.component).toBe("auth");
      expect(logs[0]!.user).toBe("alice");
      expect(logs[0]!.msg).toBe("child login");
    });

    it("allows child to override minLevel", () => {
      const logs: Array<Record<string, unknown>> = [];
      const parent = createLogger(
        "api",
        {},
        {
          minLevel: "warn",
          writer: (line) => logs.push(line),
        },
      );

      const child = parent.child({ component: "debug-worker" }, { minLevel: "debug" });
      parent.debug("parent debug"); // filtered
      child.debug("child debug"); // allowed

      expect(logs.length).toBe(1);
      expect(logs[0]!.msg).toBe("child debug");
    });
  });

  describe("Trace Propagation", () => {
    it("emits trace context automatically when running within runWithTrace", () => {
      const logs: Array<Record<string, unknown>> = [];
      const logger = createLogger("trace-service", {}, { writer: (line) => logs.push(line) });

      logger.info("outside trace");
      expect(logs[0]!.requestId).toBeUndefined();

      runWithTrace({ requestId: "req-123", traceId: "trace-456" }, () => {
        expect(getTraceContext()).toEqual({ requestId: "req-123", traceId: "trace-456" });
        logger.info("inside trace");
      });

      expect(logs.length).toBe(2);
      expect(logs[1]!.requestId).toBe("req-123");
      expect(logs[1]!.traceId).toBe("trace-456");
      expect(logs[1]!.msg).toBe("inside trace");

      // Outside scope, trace context resets
      logger.info("outside trace again");
      expect(logs[2]!.requestId).toBeUndefined();
    });

    it("propagates trace context across async boundaries and promises", async () => {
      const logs: Array<Record<string, unknown>> = [];
      const logger = createLogger("async-service", {}, { writer: (line) => logs.push(line) });

      await runWithTrace({ requestId: "async-req-789" }, async () => {
        logger.info("before delay");
        await new Promise((resolve) => setTimeout(resolve, 10));
        logger.info("after delay");
      });

      expect(logs.length).toBe(2);
      expect(logs[0]!.requestId).toBe("async-req-789");
      expect(logs[1]!.requestId).toBe("async-req-789");
    });

    it("allows enriching ambient trace context via setTraceContext", () => {
      const logs: Array<Record<string, unknown>> = [];
      const logger = createLogger("enrich-service", {}, { writer: (line) => logs.push(line) });

      runWithTrace({ requestId: "req-abc" }, () => {
        logger.info("before auth");
        setTraceContext({ userId: "user-42" });
        logger.info("after auth");
      });

      expect(logs.length).toBe(2);
      expect(logs[0]!.requestId).toBe("req-abc");
      expect(logs[0]!.userId).toBeUndefined();

      expect(logs[1]!.requestId).toBe("req-abc");
      expect(logs[1]!.userId).toBe("user-42");
    });

    it("allows explicit call context to override ambient trace properties", () => {
      const logs: Array<Record<string, unknown>> = [];
      const logger = createLogger("override-service", {}, { writer: (line) => logs.push(line) });

      runWithTrace({ requestId: "ambient-req" }, () => {
        logger.info("override log", { requestId: "explicit-req" });
      });

      expect(logs.length).toBe(1);
      expect(logs[0]!.requestId).toBe("explicit-req");
    });
  });
});
