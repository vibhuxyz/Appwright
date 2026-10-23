import { THEME_FONTS, type ThemeOption, type ThemePalette } from "@repo/contracts";
import { contrastRatio, contrastUse, formatRatio, hexToHsl, hslToHex, readableOn } from "./theme-contrast";

export interface DesignColorToken {
  token: string;
  hex: string;
  onHex: string;
  usage: string;
  group: "grounds" | "surfaces" | "semantic";
}

export interface ContrastRow {
  pair: string;
  ratio: string;
  use: string;
  pass: "aa" | "large" | "fail";
  badge: string;
  ink: string;
}

export interface TypeSpecimen {
  id: string;
  label: string;
  sample: string;
  sizePx: number;
  weight: number;
  family: "heading" | "body";
  note: string;
}

export interface RadiusStep {
  id: ThemeOption["radius"] | "sm-step";
  label: string;
  px: number;
  current: boolean;
}

export interface DesignSystemView {
  summary: string;
  colors: DesignColorToken[];
  contrast: ContrastRow[];
  type: TypeSpecimen[];
  radius: { philosophy: string; steps: RadiusStep[] };
  elevation: string;
  dos: string[];
  donts: string[];
}

const RADIUS_PX: Record<ThemeOption["radius"], number> = {
  none: 0,
  sm: 4,
  md: 10,
  lg: 24,
  full: 9999,
};

const RADIUS_COPY: Record<ThemeOption["radius"], string> = {
  none: "Sharp corners. Interactive elements stay square; no rounding on cards or buttons.",
  sm: "Tight 4px rounding on controls; cards stay close to square.",
  md: "Comfortable 10px rounding on cards; buttons a step tighter.",
  lg: "Soft 24px cards; pills on chips and primary actions.",
  full: "Pill-first: every interactive element is fully rounded; cards stay 24px.",
};

function token(
  name: string,
  hex: string,
  usage: string,
  group: DesignColorToken["group"],
  onHex?: string,
): DesignColorToken {
  return { token: name, hex, onHex: onHex ?? readableOn(hex), usage, group };
}

function semanticFrom(
  palette: ThemePalette,
  mood: ThemeOption["mood"],
): { success: string; info: string; error: string; tertiary: string } {
  const primary = hexToHsl(palette.primary);
  const ground = mood === "dark" ? 38 : 42;
  return {
    success: hslToHex(142, Math.max(40, primary.saturation * 0.7), ground),
    info: hslToHex(210, Math.max(45, primary.saturation * 0.65), ground),
    error: hslToHex(4, 70, 42),
    tertiary: hslToHex((primary.hue + 40) % 360, Math.max(35, primary.saturation * 0.8), 48),
  };
}

function contrastRow(
  pair: string,
  foreground: string,
  background: string,
  badges: { aa: string; large: string; fail: string },
): ContrastRow {
  const ratio = contrastRatio(foreground, background);
  const { use, pass } = contrastUse(ratio);
  const badge = badges[pass];
  return { pair, ratio: formatRatio(ratio), use, pass, badge, ink: readableOn(badge) };
}

function defaultDos(theme: ThemeOption): string[] {
  return [
    `Give every screen one full-bleed hue from this palette; let ${theme.mood === "dark" ? "ink and one accent" : "white, ink and one accent"} do the rest.`,
    `Headlines in ${theme.fonts.heading}; everything that explains in ${theme.fonts.body}.`,
    `Make one number or word the hero per screen in display size, with a unit in the supporting line.`,
    `Write supporting copy with personality — ${theme.voice ?? theme.tagline}`,
    RADIUS_COPY[theme.radius],
  ];
}

function defaultDonts(theme: ThemeOption): string[] {
  return [
    "Do not put white body copy on a saturated ground if it fails AA; use ink or the deep surface.",
    "Do not add shadows or extra borders; depth comes from colour layering. A sticker shadow belongs only on the primary action.",
    `Do not introduce a second typeface beyond ${theme.fonts.heading} and ${theme.fonts.body}.`,
    "Do not reduce a screen to four competing cards — one hero, then supporting tiles.",
    "Do not use emoji or unicode ornaments in UI chrome.",
  ];
}

export function cornerRadius(theme: ThemeOption, kind: "control" | "card" | "pill" = "card"): string {
  if (theme.radius === "full") return kind === "card" ? "24px" : "999px";
  if (kind === "pill") return "999px";
  const px = RADIUS_PX[theme.radius];
  if (kind === "control") return `${Math.max(0, px - 2)}px`;
  return `${px}px`;
}

export function buildDesignSystem(theme: ThemeOption): DesignSystemView {
  const { palette } = theme;
  const primaryHsl = hexToHsl(palette.primary);
  const derived = semanticFrom(palette, theme.mood);
  const container = hslToHex(primaryHsl.hue, primaryHsl.saturation * 0.45, theme.mood === "dark" ? 22 : 92);
  const headingWeights = THEME_FONTS[theme.fonts.heading].weights.split(";");
  const displayWeight = Number(headingWeights[headingWeights.length - 1] ?? "700");

  const colors: DesignColorToken[] = [
    token("primary", palette.primary, "cover screens, primary CTA", "grounds", palette.primaryForeground),
    token("primary-container", container, "ghost chips on primary", "grounds"),
    token("secondary", palette.secondary, "supporting bands", "grounds", palette.secondaryForeground),
    token("accent", palette.accent, "highlights and success-adjacent", "grounds", palette.accentForeground),
    token("tertiary", derived.tertiary, "third hue, captions on yellows", "grounds"),
    token("success", derived.success, "confirmations", "semantic"),
    token("info", derived.info, "data and facts", "semantic"),
    token("error", derived.error, "errors only", "semantic"),
    token("background", palette.background, "page ground", "surfaces", palette.foreground),
    token("card", palette.card, "cards, chips, nested rows", "surfaces", palette.foreground),
    token("muted", palette.muted, "quiet wells", "surfaces", palette.mutedForeground),
    token("border", palette.border, "hairlines and tracks", "surfaces", palette.foreground),
  ];

  const badges = {
    aa: derived.success,
    large: hslToHex(46, 78, 58),
    fail: derived.error,
  };
  const contrast: ContrastRow[] = [
    contrastRow("on-primary on primary", palette.primaryForeground, palette.primary, badges),
    contrastRow("foreground on background", palette.foreground, palette.background, badges),
    contrastRow("foreground on card", palette.foreground, palette.card, badges),
    contrastRow("on-secondary on secondary", palette.secondaryForeground, palette.secondary, badges),
    contrastRow("on-accent on accent", palette.accentForeground, palette.accent, badges),
    contrastRow("muted on muted surface", palette.mutedForeground, palette.muted, badges),
    contrastRow("foreground on primary", palette.foreground, palette.primary, badges),
    contrastRow("primary on background", palette.primary, palette.background, badges),
  ];

  return {
    summary:
      theme.summary ??
      `${theme.tagline} ${theme.style ? `${theme.style} system` : "Design system"} — ${theme.fonts.heading} for display, ${theme.fonts.body} for reading, ${theme.density ?? "comfortable"} density.`,
    colors,
    contrast,
    type: [
      { id: "display-xl", label: "display-xl", sample: "7", sizePx: 88, weight: displayWeight, family: "heading", note: "hero number" },
      { id: "display-lg", label: "display-lg", sample: "12", sizePx: 64, weight: displayWeight, family: "heading", note: "secondary hero number" },
      { id: "title", label: "title-md", sample: theme.name, sizePx: 22, weight: 700, family: "heading", note: `${theme.fonts.heading} · 22px` },
      { id: "body", label: "body", sample: theme.voice ?? "The supporting line with personality.", sizePx: 16, weight: 400, family: "body", note: `${theme.fonts.body} · 16px` },
    ],
    radius: {
      philosophy: RADIUS_COPY[theme.radius],
      steps: [
        { id: "none", label: "none · 0", px: 0, current: theme.radius === "none" },
        { id: "sm-step", label: "sm · 4px", px: 4, current: theme.radius === "sm" },
        { id: "md", label: "md · 10px", px: 10, current: theme.radius === "md" },
        { id: "lg", label: "lg · 24px", px: 24, current: theme.radius === "lg" },
        { id: "full", label: "full · pill", px: 9999, current: theme.radius === "full" },
      ],
    },
    elevation:
      theme.mood === "dark"
        ? "Depth comes from colour layering on a dark ground. No drop shadows on cards. Glow only on the primary CTA."
        : "Depth comes from colour layering. Cards have no shadow. The only shadow is a hard offset sticker on the primary CTA.",
    dos: theme.dos && theme.dos.length > 0 ? [...theme.dos] : defaultDos(theme),
    donts: theme.donts && theme.donts.length > 0 ? [...theme.donts] : defaultDonts(theme),
  };
}
