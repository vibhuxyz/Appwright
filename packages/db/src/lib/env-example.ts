import type { EnvVarDefinition } from "@repo/contracts";

export function generateSafeEnvExample(vars: readonly EnvVarDefinition[]): string {
  const lines = vars.map((v) => {
    const placeholder = v.exampleValue ?? (v.isSecret ? "your-secret-here" : "");
    const comment = v.description ? `# ${v.description}\n` : "";
    return `${comment}${v.key}="${placeholder}"`;
  });
  return lines.join("\n\n").concat("\n");
}
