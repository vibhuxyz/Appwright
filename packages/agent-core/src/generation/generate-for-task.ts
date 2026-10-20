import { buildTaskPrompt } from "./build-prompt";
import { collectOutput } from "./collect-output";
import { DEFAULT_TIMEOUT_MS, MAX_FILES_PER_TASK } from "./constants";
import { parseGeneratedFiles } from "./parse-output";
import { selectProvider } from "./select-provider";
import type {
  GenerateForTaskOptions,
  GeneratedFile,
  GenerationResult,
  PathFence,
  RejectedFile,
} from "./types";

function applyFence(
  files: readonly GeneratedFile[],
  fence: PathFence,
): { accepted: GeneratedFile[]; rejected: RejectedFile[] } {
  const accepted: GeneratedFile[] = [];
  const rejected: RejectedFile[] = [];
  for (const file of files) {
    const decision = fence.check(file.path);
    if (decision.allowed) accepted.push({ path: decision.path, content: file.content });
    else rejected.push({ path: file.path, reason: decision.reason });
  }
  return { accepted, rejected };
}

export async function generateForTask(
  options: GenerateForTaskOptions,
): Promise<GenerationResult> {
  const selection = selectProvider(options.resolution, options.createProvider);
  if (!selection.ok) {
    return { ok: false, code: "provider_unavailable", message: selection.message };
  }

  const signal = AbortSignal.any([
    options.signal,
    AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS),
  ]);
  const prompt = buildTaskPrompt(options.task, options.contextText);
  const output = await collectOutput(selection.provider, prompt, signal);
  if (!output.ok) return output;

  const parsed = parseGeneratedFiles(output.text);
  if (!parsed.ok) {
    return { ok: false, code: "output_unparseable", message: parsed.message };
  }
  if (parsed.files.length > MAX_FILES_PER_TASK) {
    return {
      ok: false,
      code: "too_many_files",
      message: `Task ${options.task.id} produced ${parsed.files.length} files, limit is ${MAX_FILES_PER_TASK}`,
    };
  }

  const { accepted, rejected } = applyFence(parsed.files, options.fence);
  return {
    ok: true,
    model: selection.provider.model,
    fellBackFrom: selection.fellBackFrom,
    files: accepted,
    rejected,
    usage: output.usage,
  };
}
