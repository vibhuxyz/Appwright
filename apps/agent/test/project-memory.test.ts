import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { formatProjectMemory } from "@repo/agent-core";
import { loadProjectMemoryRows, prisma } from "@repo/db";

const blueprintFields = {
  blueprintVersion: 1,
  intent: { type: "booking site", domain: "yoga studio", complexity: "medium" },
  stack: {},
  entities: [],
  pages: [{ route: "/schedule", purpose: "Class schedule" }],
  features: ["Online booking"],
  theme: {},
  requirements: [{ id: "r1", area: "seo", level: "required", reason: "x", acceptance: ["Every page has a title"] }],
};

describe("project memory across chats", () => {
  let userId = "";
  let projectId = "";
  let otherProjectId = "";
  let firstChatId = "";

  beforeAll(async () => {
    const user = await prisma.user.create({ data: { email: `memory-${Date.now()}@example.com`, hashPassword: "x" } });
    userId = user.id;
    const [project, otherProject] = await Promise.all([
      prisma.project.create({ data: { name: "Yoga", workspacePath: "/tmp/memory", userId } }),
      prisma.project.create({ data: { name: "Other", workspacePath: "/tmp/memory-other", userId } }),
    ]);
    projectId = project.id;
    otherProjectId = otherProject.id;
    const firstChat = await prisma.session.create({ data: { projectId } });
    firstChatId = firstChat.id;
    const blueprint = await prisma.blueprint.create({ data: { sessionId: firstChatId, ...blueprintFields } });
    await prisma.task.create({
      data: {
        blueprintId: blueprint.id, type: "PAGE", title: "Build schedule page", status: "DONE", dependsOn: [],
        owns: ["src/app/schedule/page.tsx"], reads: [], riskTier: "LOW", capability: "FAST_CODING", verification: { tier: 1 },
      },
    });
    await prisma.message.createMany({
      data: [
        { sessionId: firstChatId, seq: 1, role: "user", type: "text", content: "Build a booking site for my yoga studio", data: {} },
        { sessionId: firstChatId, seq: 2, role: "user", type: "text", content: "Approve plan", data: { blueprintId: blueprint.id } },
        { sessionId: firstChatId, seq: 3, role: "assistant", type: "toolCall", content: "write_file", data: { toolCallId: "c1", toolName: "write_file", args: { path: "src/app/schedule/page.tsx" } } },
        { sessionId: firstChatId, seq: 4, role: "user", type: "text", content: "Verification failed, retrying: tsc", data: { verificationRetry: true } },
        { sessionId: firstChatId, seq: 5, role: "assistant", type: "text", content: "Done", data: { verification: [{ ok: true, check: "tsc", errors: [] }] } },
      ],
    });
    const otherChat = await prisma.session.create({ data: { projectId: otherProjectId } });
    await prisma.message.create({
      data: { sessionId: otherChat.id, seq: 1, role: "user", type: "text", content: "Secret other project request", data: {} },
    });
    await prisma.session.create({ data: { projectId } });
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: userId } });
  });

  it("a new chat sees the earlier chat's requests, plan, tasks, files and verification", async () => {
    const memory = formatProjectMemory(await loadProjectMemoryRows(projectId));
    expect(memory).toContain('"Build a booking site for my yoga studio"');
    expect(memory).toContain("- booking site for yoga studio (medium)");
    expect(memory).toContain("The user approved this plan.");
    expect(memory).toContain("- [DONE] Build schedule page — owns: src/app/schedule/page.tsx");
    expect(memory).toContain("- src/app/schedule/page.tsx (1)");
    expect(memory).toContain("- tsc: passed");
    expect(memory).toContain("- [required] seo: Every page has a title");
    expect(memory).not.toContain("Verification failed");
  });

  it("never leaks another project's memory", async () => {
    const memory = formatProjectMemory(await loadProjectMemoryRows(projectId));
    expect(memory).not.toContain("Secret other project request");
    const other = formatProjectMemory(await loadProjectMemoryRows(otherProjectId));
    expect(other).toContain("Secret other project request");
    expect(other).not.toContain("yoga");
  });
});
