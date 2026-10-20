import type { DesignBlock, LayoutBlock } from "@repo/contracts";
import type { ParsedVisualDesign, VisualReferenceInput } from "./types";

function normalizePixelDimension(val: string | number | undefined, defaultVal: string): string {
  if (val === undefined) return defaultVal;
  if (typeof val === "number") return `${val}px`;
  return val.endsWith("px") ? val : `${val}px`;
}

function normalizeColor(color: string | undefined, defaultColor: string): string {
  if (!color) return defaultColor;
  const hex = color.startsWith("#") ? color : `#${color}`;
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : defaultColor;
}

export function parseVisualReference(input: VisualReferenceInput): ParsedVisualDesign {
  const design: Partial<DesignBlock> = {
    style: input.style ?? "minimal-premium",
    density: input.density ?? "comfortable",
    fontFamily: input.fontFamily ?? "Inter",
    primaryColor: normalizeColor(input.primaryColor, "#111111"),
    accentColor: normalizeColor(input.accentColor, "#6366F1"),
    radius: input.radius ?? "md",
  };

  const layout: Partial<LayoutBlock> = {
    header: normalizePixelDimension(input.headerHeight, "72px"),
    sidebar: normalizePixelDimension(input.sidebarWidth, "240px"),
    content: input.columns ? `${input.columns}-column` : "12-column",
    mobileNavigation: input.mobileNav ?? "bottom",
  };

  return {
    design,
    layout,
    rawViewport: input.viewport,
  };
}
