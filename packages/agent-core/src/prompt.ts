import { uiSystemPromptSection } from "@repo/ui-system";
import type { Runtime } from "./runtime";
import { loadStackStandards } from "./standards";

const systemPromptPath = new URL("../prompts/system.md", import.meta.url);
const referencePromptPath = new URL("../prompts/system-reference.md", import.meta.url);

const TREE_LIMIT = 50;

export interface SystemPromptOptions {
  readonly memorySection?: string;
  readonly includeFileTree?: boolean;
  readonly includeReference?: boolean;
  readonly includeUiPrimitives?: boolean;
}

function treeForPrompt(entries: string[]): string[] {
  const kept = entries.filter((entry) => !entry.includes("components/ui/"));
  const hidden = entries.length - kept.length;
  const tree = kept.slice(0, TREE_LIMIT);
  if (hidden > 0) tree.push(`… plus ${hidden} UI primitives under src/components/ui/ (listed above)`);
  return tree;
}

function enabled(value: boolean | undefined): boolean {
  return value ?? true;
}

export async function buildSystemPrompt(runtime: Runtime, options: SystemPromptOptions = {}): Promise<string> {
  const includeFileTree = enabled(options.includeFileTree);
  const includeReference = enabled(options.includeReference);
  const includeUiPrimitives = enabled(options.includeUiPrimitives);
  const [template, standards, reference] = await Promise.all([
    Bun.file(systemPromptPath).text(),
    loadStackStandards(),
    includeReference ? Bun.file(referencePromptPath).text() : Promise.resolve(""),
  ]);

  let fileTree: string[] = [];
  if (includeFileTree) {
    try {
      fileTree = await runtime.listDir(".");
    } catch {
      fileTree = [];
    }
  }

  const referenceText = reference.trim();
  return [
    template.trimEnd(),
    standards.trimEnd(),
    ...(includeUiPrimitives ? [uiSystemPromptSection()] : []),
    ...(referenceText.length > 0 ? [referenceText] : []),
    ...(includeFileTree ? [`Project file tree (top ${TREE_LIMIT}):\n${treeForPrompt(fileTree).join("\n")}`] : []),
    ...(options.memorySection ? [options.memorySection] : []),
  ].join("\n\n");
}
