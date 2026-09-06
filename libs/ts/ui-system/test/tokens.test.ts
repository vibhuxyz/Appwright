import { describe, expect, test } from "bun:test";
import path from "node:path";
import { emitTokensCss } from "../src/emit/css";
import { scaleSuffixes } from "../src/emit/tailwind";
import { uiSystemPromptSection } from "../src/prompt";
import {
  CLIENT_COMPONENTS,
  COMPONENT_FILES,
  renderComponent,
} from "../src/emit/components";
import { allowedPrimitives, registry, type RegistryEntry } from "../src/registry";

const REPO_ROOT = path.resolve(import.meta.dir, "../../../..");

const TEMPLATE_STYLESHEETS = [
  "templates/vite-react/src/index.css",
  "templates/nextjs-fullstack/src/app/globals.css",
];

const GENERATED_TOKENS = [
  "templates/vite-react/src/tokens.css",
  "templates/nextjs-fullstack/src/app/tokens.css",
];

describe("the token scale is defined once and consumed twice", () => {
  test("both templates carry byte-identical generated tokens", async () => {
    // This is V1.1's actual claim. Two files that merely *look* similar are
    // two design systems with a shared name — they diverge on the first
    // edit nobody mirrors.
    const contents = await Promise.all(
      GENERATED_TOKENS.map((rel) => Bun.file(path.join(REPO_ROOT, rel)).text()),
    );
    expect(contents[0]).toBe(contents[1]!);
    expect(contents[0]).toBe(emitTokensCss());
  });

  test("a colour's raw variable and its theme variable never share a name", () => {
    // `--color-x: var(--color-x)` is a variable defined as itself. It
    // resolves to nothing, renders every surface transparent, and errors
    // nowhere.
    const css = emitTokensCss();
    expect(css).not.toMatch(/--color-([\w-]+):\s*var\(--color-\1\)/);
    expect(css).toContain("--color-background: var(--background);");
  });

  test("neither template redeclares a scale value of its own", async () => {
    for (const rel of TEMPLATE_STYLESHEETS) {
      const css = await Bun.file(path.join(REPO_ROOT, rel)).text();
      expect(css).toContain('@import "tailwindcss"');
      expect(css).toMatch(/@import "\.\/(app\/)?tokens\.css"|@import "\.\/tokens\.css"/);
      // The proto-system this rung exists to delete.
      expect(css).not.toMatch(/^\s*\.btn\s*\{/m);
      expect(css).not.toMatch(/^\s*\.head-text\s*\{/m);
      expect(css).not.toMatch(/^\s*\.section-text\s*\{/m);
    }
  });
});

describe("the registry", () => {
  test("every entry names a file that exists in BOTH templates", async () => {
    // A registry entry the agent is told to import, that is not actually
    // in the template, is worse than no entry: the model writes a correct
    // import against a file that does not exist.
    for (const [name, entry] of Object.entries(registry as Record<string, RegistryEntry>)) {
      for (const base of ["templates/vite-react", "templates/nextjs-fullstack"]) {
        const abs = path.join(REPO_ROOT, base, entry.file);
        expect(await Bun.file(abs).exists()).toBe(true);
        expect(`${name} in ${base}`).toBeTruthy();
      }
    }
  });

  test("nine primitives, not forty — inventory with no demand is the trap", () => {
    expect(allowedPrimitives()).toHaveLength(9);
  });
});

describe("the prompt section", () => {
  test("names every allowed primitive and its variants", () => {
    const section = uiSystemPromptSection();
    for (const name of allowedPrimitives()) {
      expect(section).toContain(name);
    }
    expect(section).toContain("variant=default|secondary|outline|ghost|link|destructive");
  });

  test("states the bracket-value rule, which is the whole point of the scale", () => {
    expect(uiSystemPromptSection()).toContain("p-[17px]");
  });

  test("stays small enough to sit beside everything else in the context budget", () => {
    // Names and variants, not descriptions (V1.1 trap table). If this
    // fails, something started explaining components in prose.
    expect(uiSystemPromptSection().length).toBeLessThan(2500);
  });
});

describe("the scale is exported as data for V4's validator", () => {
  test("suffix lists are non-empty and derived from the same tokens", () => {
    const suffixes = scaleSuffixes();
    expect(suffixes.color).toContain("primary");
    expect(suffixes.spacing).toContain("4");
    expect(suffixes.radius).toContain("lg");
    expect(suffixes.text).toContain("3xl");
  });
});

describe("the vendored components have not drifted from their source", () => {
  // The tokens test proves the SCALE is defined once. This proves the same
  // for the components, which is the other half of "two templates, one
  // look" — an edit made directly in one template's `ui/` folder would
  // otherwise silently make the two products different.
  const TARGETS = [
    { dir: "templates/vite-react/src/components/ui", useClient: false },
    { dir: "templates/nextjs-fullstack/src/components/ui", useClient: true },
  ];

  test("every emitted file matches what the emitter would write today", async () => {
    for (const target of TARGETS) {
      for (const file of COMPONENT_FILES) {
        const source = await Bun.file(
          path.join(REPO_ROOT, "libs/ts/ui-system/components", file),
        ).text();
        const expected = renderComponent(
          file,
          source,
          target.useClient && CLIENT_COMPONENTS.has(file),
        );
        const actual = await Bun.file(path.join(REPO_ROOT, target.dir, file)).text();
        expect(`${target.dir}/${file}:\n${actual}`).toBe(`${target.dir}/${file}:\n${expected}`);
      }
    }
  });

  test("Next gets \"use client\" on the stateful primitives and Vite does not", async () => {
    // Missing the directive under the App Router is a 500 at runtime, not a
    // type error — tsc will never catch it.
    const next = await Bun.file(
      path.join(REPO_ROOT, "templates/nextjs-fullstack/src/components/ui/dialog.tsx"),
    ).text();
    expect(next.startsWith('"use client";')).toBe(true);

    const vite = await Bun.file(
      path.join(REPO_ROOT, "templates/vite-react/src/components/ui/dialog.tsx"),
    ).text();
    expect(vite.startsWith('"use client";')).toBe(false);
  });
});
