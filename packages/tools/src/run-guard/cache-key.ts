export function cacheKey(toolName: string, args: unknown): string {
  if (typeof args !== "object" || args === null) return `${toolName}:${JSON.stringify(args)}`;
  const sortedKeys = Object.keys(args).sort();
  return `${toolName}:${JSON.stringify(args, sortedKeys)}`;
}
