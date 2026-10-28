import { fontStack, googleFontsUrl, type ThemePalette } from "@repo/contracts";
import type { DesignCase } from "./cases";

const PALETTE_VARS: Readonly<Record<keyof ThemePalette, readonly string[]>> = {
  background: ["--background"],
  foreground: ["--foreground", "--card-foreground", "--popover-foreground"],
  card: ["--card", "--popover"],
  primary: ["--primary", "--ring"],
  primaryForeground: ["--primary-foreground"],
  secondary: ["--secondary"],
  secondaryForeground: ["--secondary-foreground"],
  accent: ["--accent"],
  accentForeground: ["--accent-foreground"],
  muted: ["--muted"],
  mutedForeground: ["--muted-foreground"],
  border: ["--border", "--input"],
};

function caseBlock(designCase: DesignCase): string {
  const colours = (Object.keys(PALETTE_VARS) as (keyof ThemePalette)[]).flatMap((key) =>
    PALETTE_VARS[key].map((name) => `  ${name}: ${designCase.palette[key]};`),
  );
  return [
    `[data-case="${designCase.id}"] {`,
    ...colours,
    `  --case-font-heading: ${fontStack(designCase.fonts.heading)};`,
    `  --case-font-body: ${fontStack(designCase.fonts.body)};`,
    `  font-family: var(--case-font-body);`,
    `  background: var(--background);`,
    `  color: var(--foreground);`,
    `}`,
    `[data-case="${designCase.id}"] :is(h1, h2, h3, h4) { font-family: var(--case-font-heading); }`,
  ].join("\n");
}

export function showcaseCss(cases: readonly DesignCase[], globalsCss: string): string {
  const fonts = googleFontsUrl(cases.flatMap((designCase) => [designCase.fonts.heading, designCase.fonts.body]));
  return [
    `@import url("${fonts}");`,
    globalsCss,
    `@theme inline {\n  --font-heading: var(--case-font-heading);\n  --font-body: var(--case-font-body);\n}`,
    ...cases.map(caseBlock),
    "",
  ].join("\n");
}

export function showcasePage(designCase: DesignCase): string {
  const importPath = `@/examples/${designCase.exampleFile.replace(/\.tsx$/, "")}`;
  return [
    `import { ${designCase.exportName} } from "${importPath}";`,
    ``,
    `export default function Page() {`,
    `  return (`,
    `    <div data-case="${designCase.id}">`,
    `      <${designCase.exportName} />`,
    `    </div>`,
    `  );`,
    `}`,
    ``,
  ].join("\n");
}
