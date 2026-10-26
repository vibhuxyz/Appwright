import { describe, expect, test } from "bun:test";
import {
  CreateProjectRequest,
  DatabaseDocumentsResponse,
  DatabaseOverviewResponse,
  ProjectDatabaseResponse,
  ProjectResponse,
  templateNeedsDatabase,
} from "../src/index.ts";

describe("templateNeedsDatabase", () => {
  test("nextjs-fullstack is database-backed and vite-react is not", () => {
    expect(templateNeedsDatabase("nextjs-fullstack")).toBe(true);
    expect(templateNeedsDatabase("vite-react")).toBe(false);
  });
});

describe("ProjectDatabaseResponse", () => {
  test("rejects a payload that includes a connection string", () => {
    const parsed = ProjectDatabaseResponse.safeParse({
      projectId: "abc",
      environment: "development",
      provider: "mongodb",
      databaseName: "app_abc_development",
      isolationMode: "scoped-user",
      status: "ready",
      migrationVersion: 1,
      lastErrorCode: null,
      mongodbUri: "mongodb://secret@localhost/app",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(JSON.stringify(parsed.data)).not.toContain("mongodb://");
    }
  });
});

describe("CreateProjectRequest", () => {
  test("defaults new projects to Next.js and no optional integrations", () => {
    const parsed = CreateProjectRequest.parse({ name: "demo" });
    expect(parsed.templateId).toBe("nextjs-fullstack");
    expect(parsed.integrations).toEqual([]);
  });

  test("keeps an unselected starter empty", () => {
    const parsed = CreateProjectRequest.parse({ name: "demo", starterId: null });
    expect(parsed.starterId).toBeNull();
  });

  test("returns the persisted starter selection with the project", () => {
    const parsed = ProjectResponse.parse({
      id: "project-1",
      name: "demo",
      templateId: "nextjs-fullstack",
      starterId: "saas",
      status: "READY",
      previewUrl: null,
      hasProductionDeployment: false,
      createdAt: new Date(0).toISOString(),
    });
    expect(parsed.starterId).toBe("saas");
  });

  test("accepts supported optional integrations", () => {
    const parsed = CreateProjectRequest.parse({
      name: "demo",
      starterId: "ecommerce",
      integrations: ["mongodb", "email", "razorpay"],
    });
    expect(parsed.starterId).toBe("ecommerce");
    expect(parsed.integrations).toEqual(["mongodb", "email", "razorpay"]);
  });

  test("rejects unsupported frameworks and providers", () => {
    expect(() => CreateProjectRequest.parse({ name: "demo", templateId: "vite-react" })).toThrow();
    expect(() => CreateProjectRequest.parse({ name: "demo", integrations: ["resend"] })).toThrow();
    expect(() => CreateProjectRequest.parse({ name: "demo", starterId: "unknown" })).toThrow();
  });
});

describe("DatabaseOverviewResponse", () => {
  test("parses structured collection overview with fields and indexes", () => {
    const payload = {
      projectId: "proj-1",
      databaseName: "app_proj-1_dev",
      provider: "mongodb",
      status: "ready",
      environment: "development",
      totalDocuments: 42,
      totalIndexes: 2,
      collections: [
        {
          name: "users",
          documentCount: 42,
          fields: [
            {
              name: "_id",
              type: "ObjectId",
              required: true,
              unique: true,
              indexed: true,
            },
            {
              name: "email",
              type: "String",
              required: true,
              unique: true,
              indexed: true,
            },
          ],
          indexes: [
            {
              name: "_id_",
              keys: { _id: 1 },
              unique: true,
            },
            {
              name: "email_1",
              keys: { email: 1 },
              unique: true,
            },
          ],
        },
      ],
    };

    const parsed = DatabaseOverviewResponse.parse(payload);
    expect(parsed.collections.length).toBe(1);
    expect(parsed.collections[0]?.fields.length).toBe(2);
    expect(parsed.collections[0]?.indexes.length).toBe(2);
  });
});

describe("DatabaseDocumentsResponse", () => {
  test("parses collection documents with pagination info", () => {
    const payload = {
      items: [{ _id: "660c1f4a9b1d8e001f3e4a5b", email: "user@example.com" }],
      total: 1,
      limit: 25,
      skip: 0,
    };

    const parsed = DatabaseDocumentsResponse.parse(payload);
    expect(parsed.items.length).toBe(1);
    expect(parsed.total).toBe(1);
    expect(parsed.limit).toBe(25);
  });
});
