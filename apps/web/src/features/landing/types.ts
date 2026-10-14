export interface NavLink {
  label: string;
  href: string;
  badge?: { label: string; tone: "accent" | "neutral" };
}

export interface QuickPrompt {
  label: string;
  prompt: string;
}

export interface ShowcaseItem {
  id: string;
  name: string;
  copy: string;
  kind: "FULL RUN" | "VIDEO" | "LIVE";
  tint: string;
  placeholder: string;
}

export interface ModelCard {
  name: string;
  copy: string;
  task: string;
  pill: string;
  pillTone: "premium" | "accent" | "neutral";
  glyph: string;
  tint: string;
}

export interface PlatformFeature {
  tag: string;
  name: string;
  copy: string;
  meta: string;
}

export interface TemplateCard {
  name: string;
  copy: string;
  stack: string;
  chrome: string;
  stat: string;
  accent: string;
  wash: string;
}

export interface DeployCheck {
  label: string;
  time: string;
}
