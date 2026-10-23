import type { Runtime } from "@repo/agent-core";
import type { DesignBlock } from "@repo/contracts";
import type { GeneratedAttempt } from "orchestrator";
import { hexToOklch } from "./color/hex-to-oklch";
import type { TaskDetail } from "./load-task-detail";
import { applyTheme } from "./theme";

const GLOBALS_CSS_PATH = "src/app/globals.css";

const RADIUS_BASE_BY_SETTING: Record<DesignBlock["radius"], string | undefined> = {
  none: "0px",
  sm: "0.375rem",
  md: "0.625rem",
  lg: "1rem",
  full: undefined,
};

function themeOverrideBlock(design: DesignBlock): string {
  const primary = hexToOklch(design.primaryColor);
  const accent = hexToOklch(design.accentColor);
  const radiusBase = RADIUS_BASE_BY_SETTING[design.radius];
  return `
/* Blueprint theme overrides — applied by the "theme" task from Blueprint.design */
@layer base {
  :root {
    --primary: ${primary};
    --ring: ${primary};
    --accent: ${accent};
${radiusBase ? `    --radius: ${radiusBase};\n` : ""}  }
}

@theme inline {
  --font-sans: "${design.fontFamily}", ui-sans-serif, system-ui, sans-serif;
}
`;
}

export async function generateThemeAttempt(
  task: TaskDetail,
  runtime: Runtime,
): Promise<GeneratedAttempt> {
  if (task.design.theme) {
    const written = await applyTheme(runtime, task.design.theme);
    return { kind: "completed", costCents: 0, writtenPaths: written };
  }
  const existing = await runtime.readFile(GLOBALS_CSS_PATH).catch(() => "");
  const override = themeOverrideBlock(task.design);
  if (existing.includes(override.trim())) {
    return { kind: "completed", costCents: 0, writtenPaths: [] };
  }

  await runtime.writeFile(GLOBALS_CSS_PATH, `${existing}\n${override}`);
  return { kind: "completed", costCents: 0, writtenPaths: [GLOBALS_CSS_PATH] };
}
