const MAX_ARGS_PREVIEW_CHARS = 200;

export type ToolCallArgs =
  | { readonly args: unknown }
  | { readonly args: Record<string, never>; readonly argsError: string };

export function parseToolArgs(raw: string): ToolCallArgs {
  if (raw.trim() === "") return { args: {} };
  try {
    return { args: JSON.parse(raw) };
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return {
      args: {},
      argsError: `Tool arguments were not valid JSON, send the call again with complete JSON: ${raw.slice(0, MAX_ARGS_PREVIEW_CHARS)}`,
    };
  }
}
