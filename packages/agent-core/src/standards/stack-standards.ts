const standardsPath = new URL("../../prompts/stack-standards.md", import.meta.url);

let cachedStandards: Promise<string> | undefined;

export function loadStackStandards(): Promise<string> {
  cachedStandards ??= Bun.file(standardsPath)
    .text()
    .catch((error: unknown) => {
      cachedStandards = undefined;
      throw error;
    });
  return cachedStandards;
}
