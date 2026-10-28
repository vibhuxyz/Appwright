import { describe, expect, test } from "bun:test";
import type { Runtime } from "@repo/agent-core";
import { BlueprintSchema, type Blueprint } from "@repo/contracts";
import { effectById, patternById, patternImportPath } from "@repo/ui-system";
import { buildSinglePassBrief, deliverBlueprintPatterns, PatternDeliveryError } from "../src";
import { effectIdsForPage, shellSectionIdsFor } from "../src/patterns";

const SECTION = {
  variantId: "v",
  purpose: "hero",
  reason: "fits",
  layoutPattern: "p",
  surface: "canvas",
  width: "full",
  spacing: "comfortable",
  assetPurposes: [],
  contentFields: [],
  interactions: [],
  responsive: "stacks",
};

function blueprint(): Blueprint {
  return BlueprintSchema.parse({
    blueprintVersion: 1,
    intent: { type: "business-site", domain: "retail", complexity: "simple" },
    stack: { framework: "next", db: "none", orm: "none", auth: "authjs", styling: "tailwind" },
    pages: [{
      route: "/",
      purpose: "Sneaker store home",
      components: [],
      artDirection: "commerce",
      sections: ["hero.cinematic", "story.split-image", "band.marquee", "faq.stack"].map((sectionId) => ({ ...SECTION, sectionId })),
    }],
    theme: { preset: "warm", primary: "#b45309" },
  });
}

function memoryRuntime(failPath?: string): { runtime: Runtime; files: Map<string, string> } {
  const files = new Map<string, string>();
  const runtime = {
    readFile: async (path: string) => {
      const content = files.get(path);
      if (content === undefined) throw new Error(`ENOENT: ${path}`);
      return content;
    },
    writeFile: async (path: string, content: string) => {
      if (path === failPath) throw new Error("disk full");
      files.set(path, content);
    },
  } as unknown as Runtime;
  return { runtime, files };
}

const TREE = ["next.config.ts"];

describe("single-pass pattern delivery", () => {
  test("puts the briefed signature effect and its dependencies on disk", async () => {
    const plan = blueprint();
    const page = plan.pages[0]!;
    const signatureId = effectIdsForPage(page, plan.design, "project-1")[0];
    const effect = signatureId ? effectById(signatureId) : undefined;
    expect(effect).toBeDefined();
    const { runtime, files } = memoryRuntime();
    const delivery = await deliverBlueprintPatterns({ blueprint: plan, projectId: "project-1" }, runtime, TREE);
    const { text } = buildSinglePassBrief({ blueprint: plan, slots: [], projectId: "project-1", delivery });
    expect(text).toContain(`Signature effect: import { ${effect?.exportName} }`);
    for (const source of [effect?.file, ...(effect?.requires ?? [])]) {
      expect(files.has(`src/components/patterns/${source}`)).toBe(true);
    }
    expect(files.has("src/components/patterns/hero/cinematic-hero.tsx")).toBe(true);
  });

  test("delivers the same files as the page task plus the app-shell task", async () => {
    const plan = blueprint();
    const single = memoryRuntime();
    await deliverBlueprintPatterns({ blueprint: plan, projectId: "project-1" }, single.runtime, TREE);
    const { deliverPatterns } = await import("../src/patterns");
    const task = { title: "Page /: Home", type: "page", pages: plan.pages, design: plan.design, projectId: "project-1" } as never;
    const perTask = memoryRuntime();
    await deliverPatterns(task, perTask.runtime, TREE);
    const shellTitle = `App shell & navigation (${shellSectionIdsFor(plan).join(", ")})`;
    await deliverPatterns({ ...(task as object), type: "app-shell", title: shellTitle } as never, perTask.runtime, TREE);
    expect([...single.files.keys()].sort()).toEqual([...perTask.files.keys()].sort());
  });

  test("keeps the signature when only the theme changes", async () => {
    const plan = blueprint();
    const page = plan.pages[0]!;
    const themed = { ...plan.design, primaryColor: "#0a0a0a", accentColor: "#ff5500" };
    expect(effectIdsForPage(page, themed, "project-1")).toEqual(effectIdsForPage(page, plan.design, "project-1"));
  });

  test("fails with the file path instead of leaving an invalid import", async () => {
    const plan = blueprint();
    const { runtime } = memoryRuntime("src/components/patterns/hero/cinematic-hero.tsx");
    const attempt = deliverBlueprintPatterns({ blueprint: plan, projectId: "project-1" }, runtime, TREE);
    await expect(attempt).rejects.toBeInstanceOf(PatternDeliveryError);
    await expect(attempt).rejects.toThrow("src/components/patterns/hero/cinematic-hero.tsx (disk full)");
  });

  test("selects shell patterns from the same choice as the app-shell task", () => {
    const ids = shellSectionIdsFor(blueprint());
    expect(ids).toContain("promo.bar");
    expect(ids).toContain("footer.editorial");
    expect(ids.every((id) => patternById(id) !== undefined)).toBe(true);
  });

  test("delivers shell files once and briefs exactly the delivered shell patterns", async () => {
    const plan = blueprint();
    const { runtime, files } = memoryRuntime();
    const delivery = await deliverBlueprintPatterns({ blueprint: plan, projectId: "project-1" }, runtime, TREE);
    expect(new Set([...delivery.written, ...delivery.unchanged]).size).toBe(delivery.written.length + delivery.unchanged.length);
    const { text } = buildSinglePassBrief({ blueprint: plan, slots: [], projectId: "project-1", delivery });
    expect(text).toContain("Shared shell patterns for the root layout:");
    for (const id of shellSectionIdsFor(plan)) {
      const pattern = patternById(id);
      expect(files.has(`src/components/patterns/${pattern?.file}`)).toBe(true);
      expect(text).toContain(`import { ${pattern?.exportName} } from "${patternImportPath(pattern?.file ?? "")}"`);
    }
  });

  test("names only the shell patterns that were delivered", () => {
    const plan = blueprint();
    const delivery = { patternIds: ["footer.editorial"], written: [], unchanged: [], skipped: [] };
    const { text } = buildSinglePassBrief({ blueprint: plan, slots: [], projectId: "project-1", delivery });
    expect(text).not.toContain(`import { ${patternById("promo.bar")?.exportName} }`);
  });

  test("omits shell files and shell brief lines when shell delivery is turned off", async () => {
    const plan = blueprint();
    const { runtime, files } = memoryRuntime();
    const delivery = await deliverBlueprintPatterns({ blueprint: plan, projectId: "project-1" }, runtime, TREE, { shellPatterns: "omitted" });
    const { text } = buildSinglePassBrief({ blueprint: plan, slots: [], projectId: "project-1", delivery });
    expect(files.has("src/components/patterns/commerce/promo-bar.tsx")).toBe(false);
    expect(files.has("src/components/patterns/hero/cinematic-hero.tsx")).toBe(true);
    expect(text).not.toContain("Shared shell patterns");
  });
});
