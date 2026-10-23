import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Runtime } from "@repo/agent-core";
import { presetThemes } from "@repo/planner";
import { applyTheme, themeCss } from "../src/theme";

const TEMPLATE_GLOBALS = readFileSync(
  path.resolve(import.meta.dir, "../../../templates/nextjs-fullstack/src/app/globals.css"),
  "utf8",
);

function memoryRuntime(files: Record<string, string>): { runtime: Runtime; files: Record<string, string> } {
  const runtime: Runtime = {
    readFile: async (target) => {
      const content = files[target];
      if (content === undefined) throw new Error(`ENOENT: no such file ${target}`);
      return content;
    },
    writeFile: async (target, content) => {
      files[target] = content;
    },
    listDir: async () => Object.keys(files),
    exec: async () => ({ stdout: "", stderr: "", exitCode: 0 }),
  };
  return { runtime, files };
}

const theme = presetThemes({ text: "a bakery" })[0];

describe("applyTheme", () => {
  test("writes theme.css and wires fonts and the import into globals.css", async () => {
    if (!theme) throw new Error("no preset theme");
    const { runtime, files } = memoryRuntime({ "src/app/globals.css": TEMPLATE_GLOBALS });
    const written = await applyTheme(runtime, theme);
    expect(written.sort()).toEqual(["src/app/globals.css", "src/app/theme.css"]);
    expect(files["src/app/theme.css"]).toContain(`--primary: ${theme.palette.primary};`);
    expect(files["src/app/theme.css"]).toContain(theme.fonts.heading);
    const globals = files["src/app/globals.css"] ?? "";
    expect(globals.startsWith('@import url("https://fonts.googleapis.com/css2?')).toBe(true);
    expect(globals.indexOf('@import "./tokens.css";')).toBeLessThan(globals.indexOf('@import "./theme.css";'));
  });

  test("is idempotent and replaces the previous theme", async () => {
    if (!theme) throw new Error("no preset theme");
    const { runtime, files } = memoryRuntime({ "src/app/globals.css": TEMPLATE_GLOBALS });
    await applyTheme(runtime, theme);
    expect(await applyTheme(runtime, theme)).toEqual([]);
    const other = presetThemes({ text: "a bakery" })[3];
    if (!other) throw new Error("no second theme");
    await applyTheme(runtime, other);
    const globals = files["src/app/globals.css"] ?? "";
    expect(globals.match(/fonts\.googleapis\.com/g)).toHaveLength(1);
    expect(globals.match(/theme\.css/g)).toHaveLength(1);
    expect(files["src/app/theme.css"]).toContain(`--primary: ${other.palette.primary};`);
  });

  test("locks single-weight heading fonts to 400 so headings are not faux-bolded", () => {
    const single = presetThemes({ text: "a bakery" })[3];
    const multi = presetThemes({ text: "a bakery" })[0];
    if (!single || !multi) throw new Error("missing preset");
    expect(single.fonts.heading).toBe("DM Serif Display");
    expect(themeCss(single)).toContain("font-weight: 400;");
    expect(themeCss(multi)).not.toContain("font-weight: 400;");
  });

  test("does nothing when the project has no globals.css", async () => {
    if (!theme) throw new Error("no preset theme");
    const { runtime, files } = memoryRuntime({});
    expect(await applyTheme(runtime, theme)).toEqual([]);
    expect(files).toEqual({});
  });
});
