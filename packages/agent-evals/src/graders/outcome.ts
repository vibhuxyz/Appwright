import { MAX_DETAIL_CHARS, TYPECHECK_TIMEOUT_MS } from "../core/constants";
import type { GradeResult, Grader, RunTrace } from "../core/types";

function grade(name: string, passed: boolean, detail = ""): GradeResult {
  return { name, passed, detail: detail.slice(0, MAX_DETAIL_CHARS) };
}

async function readOrUndefined(trace: RunTrace, filePath: string): Promise<string | undefined> {
  try {
    return await trace.runtime.readFile(filePath);
  } catch {
    return undefined;
  }
}

export const completed: Grader = async (trace) => {
  const errors = trace.events.flatMap((event) => (event.type === "error" ? [event.message] : []));
  return grade("completed", trace.stopReason === "completed", `stopReason=${trace.stopReason} ${errors.join("; ")}`);
};

export function fileContains(filePath: string, pattern: RegExp): Grader {
  return async (trace) => {
    const content = await readOrUndefined(trace, filePath);
    if (content === undefined) return grade(`fileContains ${filePath}`, false, "file missing");
    return grade(`fileContains ${filePath} ${pattern}`, pattern.test(content));
  };
}

export function fileLacks(filePath: string, pattern: RegExp): Grader {
  return async (trace) => {
    const content = await readOrUndefined(trace, filePath);
    if (content === undefined) return grade(`fileLacks ${filePath}`, false, "file missing");
    const match = content.match(pattern);
    return grade(`fileLacks ${filePath} ${pattern}`, match === null, match?.[0] ?? "");
  };
}

export const typechecks: Grader = async (trace) => {
  const hasAppConfig = (await readOrUndefined(trace, "tsconfig.app.json")) !== undefined;
  const result = await trace.runtime.exec(
    ["bunx", "tsc", "--noEmit", "-p", hasAppConfig ? "tsconfig.app.json" : "tsconfig.json"],
    { timeoutMs: TYPECHECK_TIMEOUT_MS },
  );
  return grade("typechecks", result.exitCode === 0, result.stdout + result.stderr);
};

export function maxToolCalls(limit: number): Grader {
  return async (trace) =>
    grade(`maxToolCalls ${limit}`, trace.toolCalls.length <= limit, `used ${trace.toolCalls.length}`);
}

export function maxCostUsd(limit: number): Grader {
  return async (trace) =>
    grade(`maxCostUsd ${limit}`, trace.costUsd <= limit, `spent ${trace.costUsd.toFixed(4)}`);
}

export const noToolErrors: Grader = async (trace) => {
  const failed = trace.toolCalls
    .filter((call) => call.isError)
    .map((call) => `${call.name}: ${call.errorMessage.slice(0, 120)}`);
  return grade("noToolErrors", failed.length === 0, failed.join(" | "));
};

export function neverCalls(toolName: string): Grader {
  return async (trace) =>
    grade(`neverCalls ${toolName}`, !trace.toolCalls.some((call) => call.name === toolName));
}

export function readsBeforeWriting(): Grader {
  return async (trace) => {
    const firstWrite = trace.toolCalls.findIndex((c) => c.name === "write_file" || c.name === "edit_file");
    const firstRead = trace.toolCalls.findIndex((c) => c.name === "read_file" || c.name === "list_files");
    const passed = firstWrite === -1 || (firstRead !== -1 && firstRead < firstWrite);
    return grade("readsBeforeWriting", passed, `firstRead=${firstRead} firstWrite=${firstWrite}`);
  };
}

function writtenPaths(trace: RunTrace): string[] {
  return trace.toolCalls
    .filter((call) => call.name === "write_file" || call.name === "edit_file")
    .flatMap((call) => (typeof call.args.path === "string" ? [call.args.path] : []));
}

export function onlyWrites(allowed: RegExp): Grader {
  return async (trace) => {
    const stray = [...new Set(writtenPaths(trace))].filter((filePath) => !allowed.test(filePath));
    return grade(`onlyWrites ${allowed}`, stray.length === 0, stray.join(", "));
  };
}

export function writesAtLeast(count: number): Grader {
  return async (trace) => {
    const written = new Set(writtenPaths(trace)).size;
    return grade(`writesAtLeast ${count}`, written >= count, `wrote ${written}`);
  };
}

async function readWrittenFiles(trace: RunTrace, scope: RegExp): Promise<Map<string, string>> {
  const paths = [...new Set(writtenPaths(trace))].filter((filePath) => scope.test(filePath));
  const entries = await Promise.all(
    paths.map(async (filePath) => [filePath, await readOrUndefined(trace, filePath)] as const),
  );
  return new Map(entries.flatMap(([filePath, content]) => (content === undefined ? [] : [[filePath, content] as const])));
}

export function writtenFilesLack(scope: RegExp, pattern: RegExp): Grader {
  return async (trace) => {
    const files = await readWrittenFiles(trace, scope);
    const offenders = [...files].filter(([, content]) => pattern.test(content)).map(([filePath]) => filePath);
    return grade(`writtenFilesLack ${scope} ${pattern}`, offenders.length === 0, offenders.join(", "));
  };
}

export function writtenFilesContain(scope: RegExp, pattern: RegExp): Grader {
  return async (trace) => {
    const files = await readWrittenFiles(trace, scope);
    const passed = [...files.values()].some((content) => pattern.test(content));
    return grade(`writtenFilesContain ${scope} ${pattern}`, passed, `checked ${files.size} files`);
  };
}
