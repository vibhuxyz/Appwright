import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "bun:test";
import {
  applyComposition,
  GLOBALS_CSS_PATH,
  THEME_CSS_PATH,
  planComposition,
  withThemeImport,
} from "../src/compose";

test("plans theme file and sorted dependencies", () => {
  const plan = planComposition({
    primaryHex: "#112233",
    capabilityChoices: ["websockets", "stripe"],
  });
  expect(plan.dependencies).toEqual(["stripe", "ws"]);
  expect(plan.writes[0]?.content).toContain("--primary: #112233");
  expect(plan.writes[0]?.content).toContain("oklch(0.985 0 0)");
  expect(plan.skipped).toEqual([]);
});

test("light primary gets dark foreground", () => {
  const plan = planComposition({ primaryHex: "#ffee00", capabilityChoices: [] });
  expect(plan.writes[0]?.content).toContain("oklch(0.145 0 0)");
});

test("reports bad colour and unknown choice instead of dropping", () => {
  const plan = planComposition({ primaryHex: "blue", capabilityChoices: ["mystery"] });
  expect(plan.writes).toEqual([]);
  expect(plan.skipped.map((s) => s.input)).toEqual(["mystery", "blue"]);
});

test("theme import is added once after tokens", () => {
  const css = '@import "./tokens.css";\nbody{}';
  const once = withThemeImport(css);
  expect(once).toBe('@import "./tokens.css";\n@import "./theme.css";\nbody{}');
  expect(withThemeImport(once)).toBe(once);
});

test("applyComposition writes theme files, updates globals.css, and updates package.json", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "workspace-test-"));
  try {
    const cssPath = path.join(dir, GLOBALS_CSS_PATH);
    await mkdir(path.dirname(cssPath), { recursive: true });
    await writeFile(cssPath, '@import "./tokens.css";\n', "utf8");

    const pkgPath = path.join(dir, "package.json");
    await writeFile(pkgPath, JSON.stringify({ name: "test-app", dependencies: {} }), "utf8");

    const plan = planComposition({
      primaryHex: "#112233",
      capabilityChoices: ["websockets", "stripe"],
    });

    const result = await applyComposition(dir, plan);

    expect(result.writtenFiles).toContain(THEME_CSS_PATH);
    expect(result.writtenFiles).toContain(GLOBALS_CSS_PATH);
    expect(result.installedDependencies).toEqual(["stripe", "ws"]);

    const themeContent = await readFile(path.join(dir, THEME_CSS_PATH), "utf8");
    expect(themeContent).toContain("--primary: #112233");

    const updatedCss = await readFile(cssPath, "utf8");
    expect(updatedCss).toContain('@import "./theme.css";');

    const updatedPkg = JSON.parse(await readFile(pkgPath, "utf8"));
    expect(updatedPkg.dependencies.stripe).toBe("latest");
    expect(updatedPkg.dependencies.ws).toBe("latest");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

