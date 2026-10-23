import type { Runtime } from "@repo/agent-core";
import type { ThemeOption } from "@repo/contracts";
import { GLOBALS_CSS_PATH, THEME_CSS_PATH, themeCss, withThemeImports } from "./theme-css";

async function readOrEmpty(runtime: Runtime, path: string): Promise<string | null> {
  try {
    return await runtime.readFile(path);
  } catch (error) {
    if (error instanceof Error && /ENOENT|not found|no such file|does not exist|not exist/i.test(error.message)) return null;
    throw error;
  }
}

export async function applyTheme(runtime: Runtime, theme: ThemeOption): Promise<string[]> {
  const globals = await readOrEmpty(runtime, GLOBALS_CSS_PATH);
  if (globals === null) return [];
  const nextThemeCss = themeCss(theme);
  const nextGlobals = withThemeImports(globals, theme);
  const written: string[] = [];
  if ((await readOrEmpty(runtime, THEME_CSS_PATH)) !== nextThemeCss) {
    await runtime.writeFile(THEME_CSS_PATH, nextThemeCss);
    written.push(THEME_CSS_PATH);
  }
  if (nextGlobals !== globals) {
    await runtime.writeFile(GLOBALS_CSS_PATH, nextGlobals);
    written.push(GLOBALS_CSS_PATH);
  }
  return written;
}
