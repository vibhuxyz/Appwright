import { GeneratedFilesSchema, type GeneratedFile } from "./types";

const JSON_FENCE = /^\s*```(?:json)?[ \t]*\r?\n([\s\S]*?)\r?\n```\s*$/;

export type ParsedOutput =
  | { ok: true; files: GeneratedFile[] }
  | { ok: false; message: string };

export function parseGeneratedFiles(text: string): ParsedOutput {
  const body = JSON_FENCE.exec(text)?.[1] ?? text;
  let raw: unknown;
  try {
    raw = JSON.parse(body);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    return { ok: false, message: `Model output is not valid JSON: ${error.message}` };
  }
  const parsed = GeneratedFilesSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: `Model output has the wrong shape: ${parsed.error.message}` };
  }
  return { ok: true, files: parsed.data };
}
