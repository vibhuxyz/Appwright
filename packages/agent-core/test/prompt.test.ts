import { describe, expect, test } from "bun:test";
import { buildSystemPrompt } from "../src/prompt";
import type { Runtime } from "../src/runtime";

function runtimeWith(files: string[]): Runtime {
  return {
    readFile: async () => "",
    writeFile: async () => {},
    listDir: async () => files,
    exec: async () => ({ stdout: "", stderr: "", exitCode: 0 }),
  };
}

describe("buildSystemPrompt", () => {
  test("names the UI primitives once, in the registry — not again in the file tree", async () => {
    // Ten files under components/ui/ would otherwise eat a fifth of the
    // 50-entry tree budget restating what the registry section just said.
    const prompt = await buildSystemPrompt(
      runtimeWith([
        "src/App.tsx",
        "src/components/ui/button.tsx",
        "src/components/ui/card.tsx",
        "src/components/ui/dialog.tsx",
      ]),
    );
    const tree = prompt.slice(prompt.indexOf("Project file tree"));
    expect(tree).toContain("src/App.tsx");
    expect(tree).not.toContain("src/components/ui/button.tsx");
    expect(tree).toContain("plus 3 UI primitives");

    // But the agent still knows they exist — that is the whole point.
    expect(prompt).toContain("Button");
    expect(prompt).toContain("Testimonials");
    expect(prompt).toContain("Carousel");
    expect(prompt).toContain("src/components/ui/");
  });

  test("leaves the file tree out when a task run asks for the core only", async () => {
    const prompt = await buildSystemPrompt(runtimeWith(["src/App.tsx", "src/components/ui/button.tsx"]), {
      includeFileTree: false,
      includeReference: false,
      includeUiPrimitives: false,
    });
    expect(prompt).not.toContain("Project file tree");
    expect(prompt).not.toContain("framer-motion");
    expect(prompt).not.toContain("## UI system");
    expect(prompt).toContain("Do not `read_file` or edit anything under `src/components/ui/`");
  });

  test("puts memory after the stable rules", async () => {
    const memorySection = "<project-memory>\n- src/App.tsx (1)\n</project-memory>";
    const withMemory = await buildSystemPrompt(runtimeWith(["src/App.tsx"]), { memorySection });
    const without = await buildSystemPrompt(runtimeWith(["src/App.tsx"]), { memorySection: "" });
    expect(withMemory.endsWith(memorySection)).toBe(true);
    expect(without).not.toContain("<project-memory>");
  });

  test("says nothing about primitives when a project has none", async () => {
    const prompt = await buildSystemPrompt(runtimeWith(["src/App.tsx"]));
    expect(prompt).not.toContain("UI primitives under");
  });

  test("carries the compose-do-not-invent rule and the bracket-value rule", async () => {
    const prompt = await buildSystemPrompt(runtimeWith([]));
    expect(prompt).toContain("compose");
    expect(prompt).toContain("p-[17px]");
  });

  test("tells the agent not to open generated UI primitive sources", async () => {
    const prompt = await buildSystemPrompt(runtimeWith([]));
    expect(prompt).toContain("Do not `read_file` or edit anything under `src/components/ui/`");
    expect(prompt).toContain("Do not read_file or edit those files");
  });
});
