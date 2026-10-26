import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { getActiveEmailProvider, setActiveEmailProvider } from "../src/email/provider-selection";
import { prisma } from "../src/lib/prisma";

describe("Email Provider Selection & Persistence", () => {
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `email-select-test-${Date.now()}@example.com`,
        hashPassword: "password123",
      },
    });
    userId = user.id;

    const project = await prisma.project.create({
      data: {
        name: "Email Test Project",
        workspacePath: "/tmp/email-test",
        userId,
      },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    await prisma.projectIntegration.deleteMany({ where: { projectId } });
    await prisma.project.delete({ where: { id: projectId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  it("defaults to brevo when unset", async () => {
    const provider = await getActiveEmailProvider(projectId, "development");
    expect(provider).toBe("brevo");
  });

  it("persists active provider for an environment and allows switching", async () => {
    await setActiveEmailProvider({
      projectId,
      environment: "development",
      provider: "brevo",
    });

    const devProvider = await getActiveEmailProvider(projectId, "development");
    expect(devProvider).toBe("brevo");

    await setActiveEmailProvider({
      projectId,
      environment: "production",
      provider: "nodemailer",
    });

    const prodProvider = await getActiveEmailProvider(projectId, "production");
    expect(prodProvider).toBe("nodemailer");

    const devProviderAfter = await getActiveEmailProvider(projectId, "development");
    expect(devProviderAfter).toBe("brevo");
  });

  it("changes only the selected environment", async () => {
    await setActiveEmailProvider({
      projectId,
      environment: "preview",
      provider: "resend",
    });

    expect(await getActiveEmailProvider(projectId, "preview")).toBe("resend");
    expect(await getActiveEmailProvider(projectId, "development")).toBe("brevo");
    expect(await getActiveEmailProvider(projectId, "production")).toBe("nodemailer");
  });
});
