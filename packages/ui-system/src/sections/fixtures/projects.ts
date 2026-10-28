import {
  DEFAULT_DESIGN_BLOCK,
  DEFAULT_LAYOUT_BLOCK,
  DEFAULT_RESPONSIVE_BLOCK,
  type Blueprint,
  type DesignBlock,
  type Page,
  type ProjectType,
} from "@repo/contracts";

interface FixtureInput {
  name: string;
  domain: string;
  projectType: ProjectType;
  style: string;
  density: DesignBlock["density"];
  pages: readonly Page[];
}

function page(route: string, purpose: string, components: string[] = []): Page {
  return { route, purpose, components };
}

function blueprint(input: FixtureInput): Blueprint {
  return {
    blueprintVersion: 1,
    intent: { type: "new-app", domain: input.domain, complexity: "simple", projectType: input.projectType },
    stack: { framework: "next", db: "none", orm: "none", auth: "authjs", styling: "tailwind" },
    entities: [],
    pages: [...input.pages],
    features: [],
    theme: { preset: "default", primary: "#111827" },
    design: { ...DEFAULT_DESIGN_BLOCK, style: input.style, density: input.density },
    layout: DEFAULT_LAYOUT_BLOCK,
    responsive: DEFAULT_RESPONSIVE_BLOCK,
    projectType: input.projectType,
  };
}

export const FIXTURES: readonly { name: string; blueprint: Blueprint }[] = [
  {
    name: "local-business",
    blueprint: blueprint({
      name: "local-business",
      domain: "bakery",
      projectType: "business-site",
      style: "minimal-premium",
      density: "comfortable",
      pages: [
        page("/", "Bakery home with hero photos"),
        page("/contact", "Contact details and opening hours"),
      ],
    }),
  },
  {
    name: "saas-marketing",
    blueprint: blueprint({
      name: "saas-marketing",
      domain: "crm",
      projectType: "saas",
      style: "minimal-premium",
      density: "comfortable",
      pages: [page("/", "Product marketing home"), page("/pricing", "Pricing plans for the product")],
    }),
  },
  {
    name: "portfolio",
    blueprint: blueprint({
      name: "portfolio",
      domain: "studio",
      projectType: "portfolio",
      style: "minimal-premium",
      density: "spacious",
      pages: [page("/", "Studio portfolio home"), page("/work", "Selected work gallery")],
    }),
  },
  {
    name: "fashion-store",
    blueprint: blueprint({
      name: "fashion-store",
      domain: "streetwear fashion store",
      projectType: "marketplace",
      style: "vibrant-modern",
      density: "comfortable",
      pages: [page("/", "Fashion store home with new collections"), page("/shop", "Shop all sneakers and apparel")],
    }),
  },
  {
    name: "dashboard",
    blueprint: blueprint({
      name: "dashboard",
      domain: "crm",
      projectType: "saas",
      style: "dense-technical",
      density: "compact",
      pages: [page("/", "Application dashboard"), page("/contacts", "List contacts")],
    }),
  },
];
