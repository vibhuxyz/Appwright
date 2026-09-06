import { truncate, type Runtime } from "@repo/agent-core";
import { z } from "zod";
import { wrapUntrusted } from "./untrusted";

export const grepArgs = z.object({
  pattern: z.string(),
  path: z.string().default("."),
});

export async function grepTool(
  args: z.infer<typeof grepArgs>,
  runtime: Runtime,
): Promise<string> {
  const result = await runtime.exec(
    ["grep", "-rn", "--", args.pattern, args.path],
    { timeoutMs: 15_000 },
  );

  // grep exits 1 for "no matches" — that's a normal result, not a tool error.
  if (result.exitCode > 1) {
    throw new Error(result.stderr || `grep failed with exit code ${result.exitCode}`);
  }

  const content = result.stdout.trim() || "(no matches)";
  return wrapUntrusted(`grep:${args.pattern}`, truncate(content));
}
