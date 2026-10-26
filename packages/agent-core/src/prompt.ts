import { uiSystemPromptSection } from "@repo/ui-system";
import type { Runtime } from "./runtime";
import { loadStackStandards } from "./standards";

const systemPromptPath = new URL("../prompts/system.md", import.meta.url);

// Shared by the CLI (V0) and the API's /conversation route (V1) — both need
// the same rules injected, or only one surface actually enforces them (that
// gap is exactly what let the API skip write_file/edit_file entirely).
const TREE_LIMIT = 50;

// The registry section below already names every primitive and its
// variants, so listing the same nine files again spends a fifth of the
// tree budget restating what the agent was just told.
//
// Filtered HERE and not in `Runtime.listDir` on purpose: `list_files` is a
// tool the agent calls, and a tool that hides real files from the caller is
// a tool that lies. This only trims what gets *summarised* into the prompt.
function treeForPrompt(entries: string[]): string[] {
  const kept = entries.filter((e) => !e.includes("components/ui/"));
  const hidden = entries.length - kept.length;
  const tree = kept.slice(0, TREE_LIMIT);
  if (hidden > 0) {
    tree.push(
      `… plus ${hidden} UI primitives under src/components/ui/ (listed above)`,
    );
  }
  return tree;
}

export async function buildSystemPrompt(
  runtime: Runtime,
  options: { memorySection?: string } = {},
): Promise<string> {
  const template = await Bun.file(systemPromptPath).text();

  let fileTree: string[] = [];
  try {
    fileTree = await runtime.listDir(".");
  } catch {
    fileTree = [];
  }

  // The UI vocabulary is generated from the registry rather than written
  // into system.md by hand. One definition, two jobs (D10): this prompt
  // section now, and V4's validator later. A prose copy in the markdown
  // would be a second definition that drifts the first time a variant is
  // added and nobody remembers the paragraph exists.
  return [
    template,
    await loadStackStandards(),
    uiSystemPromptSection(),
    `Project file tree (top ${TREE_LIMIT}):\n${treeForPrompt(fileTree).join("\n")}`,
    ...(options.memorySection ? [options.memorySection] : []),
  ].join("\n\n");
}
