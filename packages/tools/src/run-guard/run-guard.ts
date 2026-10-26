import type { Runtime, Tool } from "@repo/agent-core";
import { z } from "zod";
import { cacheKey } from "./cache-key";
import {
  BASH_TOOL,
  CACHEABLE_TOOLS,
  EDIT_TOOL,
  MUTATING_TOOLS,
  PACKAGE_JSON_PATH,
  READ_TOOL,
  WRITE_TOOL,
} from "./constants";
import { importedPackages, isCodeFile } from "./import-specifiers";
import { cachedResultNote, missingImportRefusal, overwriteRefusal } from "./messages";
import { declaredPackages, missingPackages, type DeclaredPackages } from "./missing-dependencies";
import type { RunGuardStats } from "./types";
import { normalizeWorkspacePath, pathArg } from "./workspace-path";

const WriteArgsSchema = z.object({ path: z.string(), content: z.string() });
const EditArgsSchema = z.object({ path: z.string(), newString: z.string() });

type ToolContext = { runtime: Runtime };

export class RunGuard {
  private readonly results = new Map<string, string>();
  private readonly readPaths = new Set<string>();
  private existingFiles: Promise<ReadonlySet<string>> | undefined;
  private declared: Promise<DeclaredPackages | undefined> | undefined;
  private counts: RunGuardStats = {
    cacheHits: 0,
    overwritesRefused: 0,
    missingImportRefusals: 0,
    importChecksSkipped: 0,
  };

  constructor(private readonly allowedPackages: readonly string[]) {}

  wrap(tool: Tool): Tool {
    if (CACHEABLE_TOOLS.has(tool.name)) {
      return { ...tool, execute: (args, ctx) => this.executeCacheable(tool, args, ctx) };
    }
    if (MUTATING_TOOLS.has(tool.name)) {
      return { ...tool, execute: (args, ctx) => this.executeMutating(tool, args, ctx) };
    }
    return tool;
  }

  stats(): RunGuardStats {
    return this.counts;
  }

  private async executeCacheable(tool: Tool, args: unknown, ctx: ToolContext): Promise<string> {
    const key = cacheKey(tool.name, args);
    if (this.results.has(key)) {
      this.counts = { ...this.counts, cacheHits: this.counts.cacheHits + 1 };
      return cachedResultNote(tool.name);
    }
    const result = await tool.execute(args, ctx);
    this.results.set(key, result);
    const path = tool.name === READ_TOOL ? pathArg(args) : undefined;
    if (path) this.readPaths.add(path);
    return result;
  }

  private async executeMutating(tool: Tool, args: unknown, ctx: ToolContext): Promise<string> {
    await this.checkBeforeMutation(tool.name, args, ctx.runtime);
    try {
      const result = await tool.execute(args, ctx);
      const path = pathArg(args);
      if (path && tool.name !== BASH_TOOL) this.readPaths.add(path);
      return result;
    } finally {
      this.invalidateAfter(tool.name, pathArg(args));
    }
  }

  private async checkBeforeMutation(toolName: string, args: unknown, runtime: Runtime): Promise<void> {
    if (toolName === WRITE_TOOL) {
      const write = WriteArgsSchema.safeParse(args);
      if (!write.success) return;
      const path = normalizeWorkspacePath(write.data.path);
      await this.refuseBlindOverwrite(path, runtime);
      await this.refuseMissingImports(path, write.data.content, runtime);
    }
    if (toolName === EDIT_TOOL) {
      const edit = EditArgsSchema.safeParse(args);
      if (!edit.success) return;
      await this.refuseMissingImports(normalizeWorkspacePath(edit.data.path), edit.data.newString, runtime);
    }
  }

  private async refuseBlindOverwrite(path: string, runtime: Runtime): Promise<void> {
    if (this.readPaths.has(path)) return;
    const existing = await this.loadExistingFiles(runtime);
    if (!existing.has(path)) return;
    this.counts = { ...this.counts, overwritesRefused: this.counts.overwritesRefused + 1 };
    throw new Error(overwriteRefusal(path));
  }

  private async refuseMissingImports(path: string, source: string, runtime: Runtime): Promise<void> {
    if (!isCodeFile(path)) return;
    const imported = importedPackages(source);
    if (imported.length === 0) return;
    const declared = await this.loadDeclaredPackages(runtime);
    if (declared?.kind !== "declared") {
      this.counts = { ...this.counts, importChecksSkipped: this.counts.importChecksSkipped + 1 };
      return;
    }
    const missing = missingPackages(imported, declared.names);
    if (missing.length === 0) return;
    this.counts = { ...this.counts, missingImportRefusals: this.counts.missingImportRefusals + 1 };
    throw new Error(missingImportRefusal({ path, missing, allowed: this.allowedPackages }));
  }

  private loadExistingFiles(runtime: Runtime): Promise<ReadonlySet<string>> {
    this.existingFiles ??= runtime
      .listDir(".")
      .then((entries) => new Set(entries.map(normalizeWorkspacePath)));
    return this.existingFiles;
  }

  private loadDeclaredPackages(runtime: Runtime): Promise<DeclaredPackages | undefined> {
    this.declared ??= this.loadExistingFiles(runtime).then(async (existing) =>
      existing.has(PACKAGE_JSON_PATH) ? declaredPackages(await runtime.readFile(PACKAGE_JSON_PATH)) : undefined,
    );
    return this.declared;
  }

  private invalidateAfter(toolName: string, path: string | undefined): void {
    this.results.clear();
    if (toolName === BASH_TOOL) {
      this.existingFiles = undefined;
      this.declared = undefined;
      return;
    }
    if (path === PACKAGE_JSON_PATH) this.declared = undefined;
  }
}
