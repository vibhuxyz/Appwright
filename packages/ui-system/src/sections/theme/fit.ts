import type { DesignBlock } from "@repo/contracts";
import { contrastPass, contrastRatio } from "./contrast";

const LIGHT_PAGE = "#ffffff";
const DARK_INK = "#111111";
const LIGHT_INK = "#fafafa";

export interface ThemeFit {
  fontFamily: string;
  radius: string;
  density: DesignBlock["density"];
  colorMode: DesignBlock["colorMode"];
  maxContentWidth: string;
  bodyContrast: "aa" | "large" | "fail" | "not-checked";
  imageScrim: true;
  directive: string;
}

function readableInk(background: string): string {
  const light = contrastRatio(LIGHT_INK, background) ?? 0;
  const dark = contrastRatio(DARK_INK, background) ?? 0;
  return light > dark ? LIGHT_INK : DARK_INK;
}

export function themeFit(design: DesignBlock): ThemeFit {
  const onPage = contrastPass(contrastRatio(design.primaryColor, LIGHT_PAGE));
  const ink = readableInk(design.primaryColor);
  const primaryUse = onPage === "aa" ? "Primary may color large headings and buttons." : "Primary is for buttons and large headings only. Body text stays foreground on background.";
  const directive = [
    `Use semantic surfaces, ${design.fontFamily}, radius ${design.radius}, ${design.density} spacing, and max width ${design.maxContentWidth}.`,
    `Color mode is ${design.colorMode}. ${primaryUse}`,
    `Text on an image uses a scrim and ${ink} at 4.5:1. Do not leave the section's original type, spacing, or radius in place.`,
    "Animate only transform and opacity, and follow prefers-reduced-motion.",
  ].join(" ");
  return {
    fontFamily: design.fontFamily,
    radius: design.radius,
    density: design.density,
    colorMode: design.colorMode,
    maxContentWidth: design.maxContentWidth,
    bodyContrast: onPage,
    imageScrim: true,
    directive,
  };
}
