import { describe, expect, test } from "bun:test";
import { collectionRouteSource, generateAdminCrud, generateModelFile } from "@repo/admin-crud";
import type { Runtime } from "@repo/agent-core";
import { DEFAULT_DESIGN_BLOCK, type Entity } from "@repo/contracts";
import { buildTaskPrompt } from "../src/build-task-prompt";
import { generateDataModelAttempt } from "../src/generate-data-model-attempt";
import { generateDeployAttempt } from "../src/generate-deploy-attempt";
import { generateSeedAttempt } from "../src/generate-seed-attempt";
import type { TaskDetail } from "../src/load-task-detail";

const product: Entity = {
  name: "Product",
  fields: [
    { name: "name", type: "String", required: true, unique: true },
    { name: "price", type: "Int", required: true, unique: false },
    { name: "launchedAt", type: "DateTime", required: false, unique: false },
  ],
} as Entity;

function recordingRuntime(): { runtime: Runtime; written: Map<string, string> } {
  const written = new Map<string, string>();
  const runtime = {
    writeFile: async (path: string, content: string) => {
      written.set(path, content);
    },
  } as unknown as Runtime;
  return { runtime, written };
}

function taskWith(overrides: Partial<TaskDetail>): TaskDetail {
  return { entities: [], features: [], owns: [], reads: [], acceptance: [], assetHints: [], design: DEFAULT_DESIGN_BLOCK, ...overrides } as unknown as TaskDetail;
}

describe("generateModelFile", () => {
  test("writes a Mongoose model with required, unique and integer rules", () => {
    const file = generateModelFile(product);
    expect(file.path).toBe("src/models/product.ts");
    expect(file.content).toContain('name: { type: String, required: true, unique: true }');
    expect(file.content).toContain("validator: Number.isInteger");
    expect(file.content).toContain("launchedAt: { type: Date, required: false }");
    expect(file.content).toContain("export const Product");
  });

  test("marks an optional unique field sparse so missing values do not collide", () => {
    const optionalUnique = { ...product, fields: [{ name: "sku", type: "String", required: false, unique: true }] } as Entity;
    expect(generateModelFile(optionalUnique).content).toContain("unique: true, sparse: true");
  });
});

describe("generators emit Mongoose, never Prisma", () => {
  test("admin CRUD routes and page connect and use the model", () => {
    const files = generateAdminCrud(product);
    expect(files).toHaveLength(3);
    for (const file of files) {
      expect(file.content).toContain("connectDb");
      expect(file.content).toContain('@/models/product');
      expect(file.content.toLowerCase()).not.toContain("prisma");
    }
    expect(files.some((file) => file.content.includes("isValidObjectId"))).toBe(true);
  });

  test("public collection route validates with Zod before writing", () => {
    const source = collectionRouteSource(product);
    expect(source).toContain("ProductInput.safeParse");
    expect(source).toContain("Product.create(parsed.data)");
  });

  test("data model task writes one model per entity", async () => {
    const { runtime, written } = recordingRuntime();
    const result = await generateDataModelAttempt(taskWith({ entities: [product] }), runtime);
    expect(result.kind).toBe("completed");
    expect([...written.keys()]).toEqual(["src/models/product.ts"]);
  });

  test("data model task fails clearly without entities", async () => {
    const { runtime } = recordingRuntime();
    const result = await generateDataModelAttempt(taskWith({}), runtime);
    expect(result).toEqual({ kind: "failed", costCents: 0, error: "No entities to model" });
  });

  test("seed script connects, inserts through the model and disconnects", async () => {
    const { runtime, written } = recordingRuntime();
    await generateSeedAttempt(taskWith({ entities: [product] }), runtime);
    const seed = written.get("scripts/seed.ts") ?? "";
    expect(seed).toContain("await connectDb()");
    expect(seed).toContain("Product.insertMany");
    expect(seed).toContain("mongoose.disconnect()");
  });

  test("deploy env uses MONGODB_URI and tolerates the build phase", async () => {
    const { runtime, written } = recordingRuntime();
    await generateDeployAttempt(taskWith({ features: ["auth"] }), runtime);
    const schema = written.get("src/env.ts") ?? "";
    expect(schema).toContain("MONGODB_URI");
    expect(schema).toContain("phase-production-build");
    expect(schema).toContain("AUTH_SECRET");
    expect(written.get(".env.example")).toContain("MONGODB_URI=");
  });

  test("a site with no stored records does not require MONGODB_URI", async () => {
    const { runtime, written } = recordingRuntime();
    await generateDeployAttempt(taskWith({}), runtime);
    expect(written.get("src/env.ts")).toContain("MONGODB_URI: z.string().min(1).optional()");
    expect(written.get(".env.example")).not.toContain("MONGODB_URI=");
  });
});

describe("buildTaskPrompt standards", () => {
  test("puts the standards before the task when provided", () => {
    const prompt = buildTaskPrompt(taskWith({ title: "Seed", type: "seed" } as Partial<TaskDetail>), undefined, { standards: "STANDARDS BLOCK" });
    expect(prompt.startsWith("STANDARDS BLOCK")).toBe(true);
    expect(prompt).toContain("Task: Seed");
  });

  test("lists the project tree without the ui primitives", () => {
    const prompt = buildTaskPrompt(taskWith({ title: "Seed", type: "seed" } as Partial<TaskDetail>), undefined, {
      projectTree: ["src/app/page.tsx", "src/components/ui/button.tsx"],
    });
    expect(prompt).toContain("- src/app/page.tsx");
    expect(prompt).not.toContain("- src/components/ui/button.tsx");
    expect(prompt).toContain("(+1 more, including the src/components/ui primitives)");
  });

  test("adds the integration gateway only to tasks that call it", () => {
    const layoutPrompt = buildTaskPrompt(taskWith({ title: "Layout shells", type: "layout" } as Partial<TaskDetail>), undefined);
    const mediaPrompt = buildTaskPrompt(taskWith({ title: "Media", type: "media" } as Partial<TaskDetail>), undefined);
    expect(layoutPrompt).not.toContain("cloudinary");
    expect(mediaPrompt).toContain("/v1/integrations/cloudinary/upload");
  });
});
