import type { Runtime } from "@repo/agent-core";
import type { ThemeOption } from "@repo/contracts";
import { THEME_STYLESHEETS, themeCss, withThemeImports, type ThemeStylesheet } from "./theme-css";

async function readOrEmpty(runtime: Runtime, path: string): Promise<string | null> {
  try {
    return await runtime.readFile(path);
  } catch (error) {
    if (error instanceof Error && /ENOENT|not found|no such file|does not exist|not exist/i.test(error.message)) return null;
    throw error;
  }
}

async function findStylesheet(runtime: Runtime): Promise<{ target: ThemeStylesheet; globals: string } | null> {
  const contents = await Promise.all(THEME_STYLESHEETS.map((target) => readOrEmpty(runtime, target.globalsPath)));
  const index = contents.findIndex((content) => content !== null);
  const target = THEME_STYLESHEETS[index];
  const globals = contents[index];
  return target && typeof globals === "string" ? { target, globals } : null;
}

export async function applyTheme(runtime: Runtime, theme: ThemeOption): Promise<string[]> {
  const found = await findStylesheet(runtime);
  if (!found) return [];
  const { target, globals } = found;
  const nextThemeCss = themeCss(theme);
  const nextGlobals = withThemeImports(globals, theme);
  const written: string[] = [];
  if ((await readOrEmpty(runtime, target.themePath)) !== nextThemeCss) {
    await runtime.writeFile(target.themePath, nextThemeCss);
    written.push(target.themePath);
  }
  if (nextGlobals !== globals) {
    await runtime.writeFile(target.globalsPath, nextGlobals);
    written.push(target.globalsPath);
  }
  return written;
}
