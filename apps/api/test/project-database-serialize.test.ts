import { describe, expect, it } from "bun:test";
import { serializeProjectDatabase } from "../src/project-database/serialize";
import type { ProjectDatabase } from "@repo/db";

describe("serializeProjectDatabase", () => {
  it("never includes credentials or a connection string", () => {
    const row = {
      id: "dbrow1",
      projectId: "proj1",
      environment: "DEVELOPMENT",
      provider: "MONGODB",
      databaseName: "app_proj1_development",
      isolationMode: "SCOPED_USER",
      status: "READY",
      secretRef: "42",
      migrationVersion: 1,
      lastErrorCode: null,
      retryCount: 0,
      createdAt: new Date("2026-10-23T00:00:00.000Z"),
      updatedAt: new Date("2026-10-23T00:00:00.000Z"),
    } as ProjectDatabase;

    const payload = serializeProjectDatabase(row);
    const json = JSON.stringify(payload);
    expect(json).not.toContain("mongodb://");
    expect(json).not.toContain("secretRef");
    expect(payload).not.toHaveProperty("secretRef");
    expect(payload.databaseName).toBe("app_proj1_development");
    expect(payload.status).toBe("ready");
  });
});
