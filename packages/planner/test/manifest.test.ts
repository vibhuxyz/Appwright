import { describe, expect, it } from "bun:test";
import {
  BlueprintSchema,
  DEFAULT_DESIGN_BLOCK,
  DEFAULT_LAYOUT_BLOCK,
  DEFAULT_RESPONSIVE_BLOCK,
  type Blueprint,
} from "@repo/contracts";
import { generateDependencyManifest } from "../src/manifest";

function sampleBlueprint(overrides: Partial<Blueprint> = {}): Blueprint {
  return BlueprintSchema.parse({
    blueprintVersion: 1,
    intent: {
      type: "saas",
      domain: "task-manager",
      complexity: "medium",
    },
    stack: {
      framework: "next",
      db: "mongodb",
      orm: "mongoose",
      auth: "authjs",
      styling: "tailwind",
    },
    entities: [
      {
        name: "Task",
        fields: [
          { name: "title", type: "String", required: true },
          { name: "completed", type: "Boolean", required: true },
        ],
        relations: [],
      },
    ],
    pages: [{ route: "/", purpose: "Home page", components: [] }],
    features: ["auth", "media"],
    theme: { preset: "modern", primary: "#111111" },
    design: DEFAULT_DESIGN_BLOCK,
    layout: DEFAULT_LAYOUT_BLOCK,
    responsive: DEFAULT_RESPONSIVE_BLOCK,
    ...overrides,
  });
}

describe("generateDependencyManifest", () => {
  it("generates complete manifest for fullstack app with mongo, auth, and cloudinary", () => {
    const blueprint = sampleBlueprint();
    const manifest = generateDependencyManifest({
      projectId: "proj-123",
      blueprint,
      templateId: "nextjs-fullstack",
    });

    expect(manifest.projectId).toBe("proj-123");
    expect(manifest.framework).toBe("nextjs");
    expect(manifest.database.required).toBe(true);
    expect(manifest.database.provider).toBe("mongodb");
    expect(manifest.database.orm).toBe("mongoose");
    expect(manifest.auth.required).toBe(true);
    expect(manifest.auth.provider).toBe("authjs");
    expect(manifest.storage.required).toBe(true);
    expect(manifest.storage.provider).toBe("cloudinary");

    const varKeys = manifest.envVars.map((v) => v.key);
    expect(varKeys).toContain("MONGODB_URI");
    expect(varKeys).toContain("AUTH_SECRET");
    expect(varKeys).toContain("CLOUDINARY_CLOUD_NAME");
    expect(varKeys).toContain("CLOUDINARY_API_KEY");
    expect(varKeys).toContain("CLOUDINARY_API_SECRET");
    expect(manifest.environments.production.requiredVars).toContain("MONGODB_URI");
    expect(manifest.environments.production.requiredVars).toContain("NEXT_PUBLIC_SITE_URL");
  });

  it("does not require database or auth for a static app without entities and auth features", () => {
    const blueprint = sampleBlueprint({
      entities: [],
      features: [],
      stack: {
        framework: "next",
        db: "none",
        orm: "none",
        auth: "authjs",
        styling: "tailwind",
      },
    });

    const manifest = generateDependencyManifest({
      projectId: "proj-static",
      blueprint,
      templateId: "vite-react",
    });

    expect(manifest.framework).toBe("vite");
    expect(manifest.database.required).toBe(false);
    expect(manifest.database.provider).toBe("none");
    expect(manifest.auth.required).toBe(false);
    expect(manifest.storage.required).toBe(false);

    const varKeys = manifest.envVars.map((v) => v.key);
    expect(varKeys).not.toContain("MONGODB_URI");
    expect(varKeys).not.toContain("AUTH_SECRET");
    expect(varKeys).not.toContain("CLOUDINARY_API_KEY");
  });

  it("detects email and payments requirements when requested", () => {
    const blueprint = sampleBlueprint({
      features: ["auth", "email", "payments"],
    });

    const manifest = generateDependencyManifest({
      projectId: "proj-shop",
      blueprint,
    });

    expect(manifest.email.required).toBe(true);
    expect(manifest.email.provider).toBe("brevo");
    expect(manifest.externalApis.some((api) => api.name === "razorpay")).toBe(true);

    const varKeys = manifest.envVars.map((v) => v.key);
    expect(varKeys).toContain("BREVO_API_KEY");
    expect(varKeys).toContain("RAZORPAY_KEY_ID");
    expect(varKeys).toContain("RAZORPAY_KEY_SECRET");
    expect(varKeys).toContain("RAZORPAY_WEBHOOK_SECRET");
  });

  it("generates correct variables for brevo and nodemailer when selected", () => {
    const blueprint = sampleBlueprint({
      features: ["email"],
    });

    const brevoManifest = generateDependencyManifest({
      projectId: "proj-brevo",
      blueprint,
      emailProvider: "brevo",
    });
    expect(brevoManifest.email.provider).toBe("brevo");
    const brevoKeys = brevoManifest.envVars.map((v) => v.key);
    expect(brevoKeys).toContain("BREVO_API_KEY");
    expect(brevoKeys).toContain("EMAIL_FROM");

    const smtpManifest = generateDependencyManifest({
      projectId: "proj-smtp",
      blueprint,
      emailProvider: "nodemailer",
    });
    expect(smtpManifest.email.provider).toBe("nodemailer");
    const smtpKeys = smtpManifest.envVars.map((v) => v.key);
    expect(smtpKeys).toContain("SMTP_HOST");
    expect(smtpKeys).toContain("SMTP_PORT");
    expect(smtpKeys).toContain("EMAIL_FROM");
  });

  it("requires server-side Google OAuth credentials only when Google sign-in is requested", () => {
    const blueprint = sampleBlueprint({ features: ["auth", "google-oauth"] });
    const manifest = generateDependencyManifest({ projectId: "proj-google", blueprint });
    const clientId = manifest.envVars.find((item) => item.key === "GOOGLE_CLIENT_ID");
    const clientSecret = manifest.envVars.find((item) => item.key === "GOOGLE_CLIENT_SECRET");

    expect(clientId).toMatchObject({ required: true, isSecret: false });
    expect(clientSecret).toMatchObject({ required: true, isSecret: true });
    expect(manifest.environments.production.requiredVars).toContain("GOOGLE_CLIENT_SECRET");
  });

  it("selects Brevo for new projects when given the legacy Resend option", () => {
    const manifest = generateDependencyManifest({
      projectId: "proj-email",
      blueprint: sampleBlueprint({ features: ["email"] }),
      emailProvider: "resend",
    });
    const variableKeys = manifest.envVars.map((variable) => variable.key);

    expect(manifest.email.provider).toBe("brevo");
    expect(variableKeys).toContain("BREVO_API_KEY");
    expect(variableKeys).not.toContain("RESEND_API_KEY");
  });
});
