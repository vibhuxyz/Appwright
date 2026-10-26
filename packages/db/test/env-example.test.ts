import { describe, expect, it } from "bun:test";
import { generateSafeEnvExample } from "../src/lib/env-example";

describe("generateSafeEnvExample", () => {
  it("generates safe env example without leaking real secrets", () => {
    const vars = [
      {
        key: "MONGODB_URI",
        description: "Database connection URI",
        required: true,
        isSecret: true,
        scopes: ["development" as const, "production" as const],
        exampleValue: "mongodb://localhost:27017/app",
      },
      {
        key: "AUTH_SECRET",
        description: "Session secret",
        required: true,
        isSecret: true,
        scopes: ["production" as const],
      },
      {
        key: "NEXT_PUBLIC_SITE_URL",
        description: "Site URL",
        required: false,
        isSecret: false,
        scopes: ["development" as const, "production" as const],
        exampleValue: "http://localhost:3000",
      },
    ];

    const output = generateSafeEnvExample(vars);
    expect(output).toContain("MONGODB_URI=\"mongodb://localhost:27017/app\"");
    expect(output).toContain("AUTH_SECRET=\"your-secret-here\"");
    expect(output).toContain("NEXT_PUBLIC_SITE_URL=\"http://localhost:3000\"");
    expect(output).not.toContain("password");
    expect(output).not.toContain("real-secret");
  });
});
