export function cachedResultNote(toolName: string): string {
  return `Unchanged since your earlier ${toolName} call with the same arguments in this run. Reuse that result instead of calling it again.`;
}

export function overwriteRefusal(path: string): string {
  return `${path} already exists and you have not read it in this run. Read it first, then prefer edit_file so existing code is extended, not replaced.`;
}

export function missingImportRefusal(input: {
  path: string;
  missing: readonly string[];
  allowed: readonly string[];
}): string {
  const addable = input.missing.filter((name) => input.allowed.includes(name));
  const forbidden = input.missing.filter((name) => !input.allowed.includes(name));
  const parts = [`Cannot write ${input.path}: it imports ${input.missing.join(", ")}, not in package.json.`];
  if (addable.length > 0) parts.push(`Add ${addable.join(", ")} to package.json dependencies first.`);
  if (forbidden.length > 0) {
    parts.push(`${forbidden.join(", ")} is not on the allowed package list; write that code yourself instead.`);
  }
  return parts.join(" ");
}
