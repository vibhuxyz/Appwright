import { expect, test } from "bun:test";
import { planComposition, withThemeImport } from "../src/compose";

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
