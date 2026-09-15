const EXTENSION_LANGUAGE: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  json: "json",
  css: "css",
  html: "html",
  md: "markdown",
  prisma: "graphql",
  yml: "yaml",
  yaml: "yaml",
};

export function languageFromPath(path: string): string {
  const ext = path.split(".").pop() ?? "";
  return EXTENSION_LANGUAGE[ext] ?? "plaintext";
}
