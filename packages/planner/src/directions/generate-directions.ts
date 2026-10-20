import type { DesignBlock, DesignDirection, Intent, LayoutBlock } from "@repo/contracts";

function buildDefaultDirection(baseDesign?: Partial<DesignBlock>): DesignDirection {
  const primaryColor = baseDesign?.primaryColor ?? "#111827";
  const accentColor = baseDesign?.accentColor ?? "#6366F1";

  const design: DesignBlock = {
    style: baseDesign?.style ?? "minimal-premium",
    density: baseDesign?.density ?? "comfortable",
    fontFamily: baseDesign?.fontFamily ?? "Inter",
    colorMode: baseDesign?.colorMode ?? "light",
    primaryColor,
    accentColor,
    radius: baseDesign?.radius ?? "md",
    maxContentWidth: baseDesign?.maxContentWidth ?? "1280px",
  };

  const layout: LayoutBlock = {
    header: "72px",
    sidebar: "240px",
    content: "12-column",
    mobileNavigation: "bottom",
  };

  return {
    id: "minimal-premium",
    title: "Minimal Premium",
    description: "Refined, distraction-free surfaces with balanced contrast and crisp typography.",
    preview: {
      header: "Clean Top Header with subtle border",
      hero: "Centered high-clarity headline with subtle pill badge",
      layout: "12-column responsive grid with collapsible sidebar",
      colorPalette: {
        primary: primaryColor,
        accent: accentColor,
        background: "#FFFFFF",
        text: "#111827",
      },
      typography: "Inter · Medium tracking · Balanced line-height",
    },
    design,
    layout,
    isDefault: true,
  };
}

function buildVibrantDirection(baseDesign?: Partial<DesignBlock>): DesignDirection {
  const primaryColor = baseDesign?.primaryColor ?? "#0F172A";
  const accentColor = "#10B981";

  const design: DesignBlock = {
    style: "vibrant-modern",
    density: "spacious",
    fontFamily: "Inter",
    colorMode: "light",
    primaryColor,
    accentColor,
    radius: "lg",
    maxContentWidth: "1280px",
  };

  const layout: LayoutBlock = {
    header: "64px",
    sidebar: "260px",
    content: "12-column",
    mobileNavigation: "drawer",
  };

  return {
    id: "vibrant-modern",
    title: "Vibrant Modern",
    description: "High-energy layout with spacious padding, generous radii, and vivid emerald accents.",
    preview: {
      header: "Prominent Header with dynamic accent bar",
      hero: "Bold typography with high-impact action buttons",
      layout: "Spacious card layout with fluid drawer navigation",
      colorPalette: {
        primary: primaryColor,
        accent: accentColor,
        background: "#F8FAFC",
        text: "#0F172A",
      },
      typography: "Inter · Tight tracking · Expressive weights",
    },
    design,
    layout,
    isDefault: false,
  };
}

function buildDenseDirection(baseDesign?: Partial<DesignBlock>): DesignDirection {
  const primaryColor = baseDesign?.primaryColor ?? "#1E293B";
  const accentColor = "#3B82F6";

  const design: DesignBlock = {
    style: "dense-technical",
    density: "compact",
    fontFamily: "Inter",
    colorMode: "system",
    primaryColor,
    accentColor,
    radius: "sm",
    maxContentWidth: "1440px",
  };

  const layout: LayoutBlock = {
    header: "56px",
    sidebar: "220px",
    content: "12-column",
    mobileNavigation: "header",
  };

  return {
    id: "dense-technical",
    title: "Dense Utility",
    description: "Compact information density designed for productivity tools, tables, and dashboards.",
    preview: {
      header: "Slim 56px utility header with inline metrics",
      hero: "Data-forward tabular layout with zero wasted whitespace",
      layout: "Wide 1440px workspace grid with compact sidebar",
      colorPalette: {
        primary: primaryColor,
        accent: accentColor,
        background: "#FFFFFF",
        text: "#1E293B",
      },
      typography: "Inter · Compact line-height · Monospace data tags",
    },
    design,
    layout,
    isDefault: false,
  };
}

export function generateDesignDirections(
  _prompt: string,
  _intent?: Intent,
  baseDesign?: Partial<DesignBlock>,
): DesignDirection[] {
  return [
    buildDefaultDirection(baseDesign),
    buildVibrantDirection(baseDesign),
    buildDenseDirection(baseDesign),
  ];
}
