import { describe, expect, it } from "bun:test";
import type { ProjectEnvironmentVariableResponse } from "@repo/contracts";
import {
  deriveDatabaseSource,
  selectVariablesForEnvironment,
  toIntegrationViews,
} from "../src/environment-view";

function variable(
  key: string,
  environment: ProjectEnvironmentVariableResponse["environment"],
  maskedValue: string | null,
): ProjectEnvironmentVariableResponse {
  return {
    id: `${environment}-${key}`,
    projectId: "project",
    environment,
    key,
    value: maskedValue,
    isSecret: false,
    maskedValue,
    required: true,
    description: null,
    createdAt: "2026-10-25T00:00:00.000Z",
    updatedAt: "2026-10-25T00:00:00.000Z",
  };
}

describe("selectVariablesForEnvironment", () => {
  it("prefers the environment row over the shared row and drops other environments", () => {
    const selected = selectVariablesForEnvironment([
      variable("SITE_URL", "all", "https://shared.example"),
      variable("SITE_URL", "production", "https://prod.example"),
      variable("SITE_URL", "development", "http://localhost"),
    ], "production");
    expect(selected).toHaveLength(1);
    expect(selected[0]?.maskedValue).toBe("https://prod.example");
  });

  it("drops empty integration credential placeholders but keeps configured ones", () => {
    const selected = selectVariablesForEnvironment([
      variable("BREVO_API_KEY", "development", null),
      variable("RAZORPAY_KEY_ID", "development", "rzp_test_abc"),
      variable("AUTH_SECRET", "development", null),
    ], "development");
    expect(selected.map((item) => item.key)).toEqual(["AUTH_SECRET", "RAZORPAY_KEY_ID"]);
  });
});

describe("deriveDatabaseSource", () => {
  it("reports the user's own URI before the Appwright database", () => {
    expect(deriveDatabaseSource({
      needsDatabase: true,
      projectDatabase: { status: "READY", databaseName: "app_dev" },
      hasOwnUri: true,
    }).source).toBe("BYOK");
  });

  it("reports a missing production database as not provisioned", () => {
    expect(deriveDatabaseSource({ needsDatabase: true, projectDatabase: null, hasOwnUri: false }))
      .toEqual({ source: "NOT_PROVISIONED", databaseName: null });
  });
});

describe("toIntegrationViews", () => {
  const integrations = [
    {
      provider: "razorpay",
      required: true,
      environments: [
        { environment: "development", credentialMode: "APPWRITE_MANAGED", status: "connected", lastTestedAt: null, lastError: null },
        { environment: "production", credentialMode: "BYOK", status: "test_failed", lastTestedAt: null, lastError: "rejected" },
      ],
    },
    { provider: "mongodb", required: true, environments: [] },
    { provider: "legacy-provider", required: false, environments: [] },
  ];
  const database = { source: "APPWRIGHT", databaseName: "app_dev" } as const;

  it("shows each environment's own status and credential source", () => {
    const development = toIntegrationViews({ integrations, environment: "development", database });
    const production = toIntegrationViews({ integrations, environment: "production", database });
    expect(development.items.find((item) => item.provider === "razorpay")).toMatchObject({
      status: "connected",
      credentialSource: "APPWRIGHT_TEST_KEY",
    });
    expect(production.items.find((item) => item.provider === "razorpay")).toMatchObject({
      status: "test_failed",
      credentialSource: "YOUR_KEY",
      lastError: "rejected",
    });
  });

  it("derives the database row from the database source and reports unknown providers", () => {
    const views = toIntegrationViews({ integrations, environment: "preview", database });
    expect(views.items.find((item) => item.provider === "mongodb")).toMatchObject({
      status: "connected",
      credentialSource: "APPWRIGHT_TEST_KEY",
    });
    expect(views.skipped).toEqual([{ provider: "legacy-provider", reason: "Unknown integration provider" }]);
  });
});
