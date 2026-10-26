import { describe, expect, it } from "bun:test";
import { mongoDatabaseProvider } from "../src/lib/database-provider";

describe("MongoDatabaseProvider", () => {
  it("connects successfully to local MongoDB instance", async () => {
    const uri = process.env.MONGO_DB_PROJECT_DATABASE ?? "mongodb://localhost:27017/test-ping";
    const result = await mongoDatabaseProvider.testConnection(uri);
    expect(result.ok).toBe(true);
    expect(result.message).toContain("Successfully connected to MongoDB");
    expect(typeof result.latencyMs).toBe("number");
  });

  it("handles connection failure safely and redacts connection string", async () => {
    const invalidUri = "mongodb://myuser:secretpassword123@127.0.0.1:27999/bad?connectTimeoutMS=500";
    const result = await mongoDatabaseProvider.testConnection(invalidUri);
    expect(result.ok).toBe(false);
    expect(result.message).toContain("MongoDB connection failed");
    expect(result.message).not.toContain("secretpassword123");
  });

  it("fails fast for empty URI", async () => {
    const result = await mongoDatabaseProvider.testConnection("");
    expect(result.ok).toBe(false);
    expect(result.message).toContain("missing");
  });
});
