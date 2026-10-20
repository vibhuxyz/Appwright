import type { DesignBlock, LayoutBlock } from "@repo/contracts";

export interface VisualReferenceInput {
  viewport?: string;
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  headerHeight?: string | number;
  sidebarWidth?: string | number;
  columns?: number;
  radius?: "none" | "sm" | "md" | "lg" | "full";
  density?: "compact" | "comfortable" | "spacious";
  style?: string;
  mobileNav?: "bottom" | "drawer" | "header" | "none";
}

export interface ParsedVisualDesign {
  design: Partial<DesignBlock>;
  layout: Partial<LayoutBlock>;
  rawViewport?: string;
}
