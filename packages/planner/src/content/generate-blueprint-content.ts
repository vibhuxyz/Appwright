import { z } from "zod";
import type { Entity, Page, Theme } from "@repo/contracts";
import { extractJsonObject } from "../shared";

const MAX_PROMPT_CHARS = 4000;
const MAX_ENTITIES = 8;
const MAX_FIELDS_PER_ENTITY = 10;
const MAX_PAGES = 10;
const MAX_FEATURES = 2;
const KNOWN_FEATURES = new Set(["auth", "payments"]);
const DEFAULT_THEME: Theme = { preset: "default", primary: "#111827" };
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const CONTENT_INSTRUCTIONS = `You design the content of a full-stack application from a user's request.

Return ONLY JSON:
{
  "entities": [{"name":"Order","fields":[{"name":"status","type":"String","required":true,"unique":false}],"relations":["Restaurant"]}],
  "pages": [{"route":"/orders","purpose":"List a customer's orders","components":["OrderList"]},{"route":"/orders/[id]","purpose":"A single order's detail","components":["OrderDetail"]}],
  "features": ["auth"],
  "theme": {"preset":"default","primary":"#111827"}
}

Rules:
- Field "type" is one of: String, Int, Boolean, DateTime, Json. Nothing else.
- "features" may only contain "auth" and/or "payments" — include one only if the request clearly needs it.
- "pages" must have at least one entry. Routes start with "/". This is a Next.js App Router app: a dynamic segment is written "[id]" in square brackets, e.g. "/restaurants/[id]" — never ":id" or "{id}".
- Home and marketing pages include Testimonials and Carousel in "components". Contact, order and other form pages include Modal.
- "primary" is a 6-digit hex colour.
- entities and their fields model what the request actually describes — do not invent unrelated data.

User request:
`;

const FieldSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["String", "Int", "Boolean", "DateTime", "Json"]),
  required: z.boolean().optional(),
  unique: z.boolean().optional(),
});

const EntityInputSchema = z.object({
  name: z.string().min(1),
  fields: z.array(FieldSchema).optional(),
  relations: z.array(z.string()).optional(),
});

const PageInputSchema = z.object({
  route: z.string().min(1),
  purpose: z.string().min(1),
  components: z.array(z.string()).optional(),
});

const ThemeInputSchema = z.object({
  preset: z.string().min(1).optional(),
  primary: z.string().optional(),
});

const GeneratedContentSchema = z.object({
  entities: z.array(EntityInputSchema).optional(),
  pages: z.array(PageInputSchema).optional(),
  features: z.array(z.string()).optional(),
  theme: ThemeInputSchema.optional(),
});

export interface BlueprintContent {
  entities: Entity[];
  pages: Page[];
  features: string[];
  theme: Theme;
}

export type ParsedBlueprintContent =
  | { ok: true; content: BlueprintContent }
  | { ok: false; reason: "invalid_json" | "invalid_shape" | "no_pages" };

function clip(value: string, max: number): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length <= max ? trimmed : trimmed.slice(0, max).trimEnd();
}

function escapeRequest(text: string): string {
  return text.replaceAll("</user-request>", "<\\/user-request>");
}

function normalizeEntity(item: z.infer<typeof EntityInputSchema>): Entity | undefined {
  const name = clip(item.name, 40);
  const fields = (item.fields ?? [])
    .slice(0, MAX_FIELDS_PER_ENTITY)
    .map((field) => ({
      name: clip(field.name, 40),
      type: field.type,
      required: field.required ?? true,
      unique: field.unique ?? false,
    }))
    .filter((field) => field.name.length > 0);
  if (name.length === 0 || fields.length === 0) return undefined;
  const relations = (item.relations ?? []).map((r) => clip(r, 40)).filter((r) => r.length > 0);
  return { name, fields, relations };
}

// A model occasionally reaches for Express's ":id" or OpenAPI's "{id}"
// instead of the Next.js App Router's "[id]" — all three mean the same
// dynamic segment, so normalize rather than reject a plan over syntax.
function toNextJsDynamicSegments(route: string): string {
  return route.replace(/:([A-Za-z0-9_]+)|\{([A-Za-z0-9_]+)\}/g, (_match, colonName, braceName) => {
    const name: string = colonName ?? braceName;
    return `[${name}]`;
  });
}

function normalizePage(item: z.infer<typeof PageInputSchema>): Page | undefined {
  const route = toNextJsDynamicSegments(clip(item.route, 100));
  const purpose = clip(item.purpose, 160);
  if (!route.startsWith("/") || purpose.length === 0) return undefined;
  const components = (item.components ?? []).map((c) => clip(c, 40)).filter((c) => c.length > 0);
  return { route, purpose, components };
}

function normalizeFeatures(raw: readonly string[] | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  for (const item of raw) {
    const name = item.toLowerCase().trim();
    if (KNOWN_FEATURES.has(name)) seen.add(name);
  }
  return [...seen].slice(0, MAX_FEATURES);
}

function normalizeTheme(raw: z.infer<typeof ThemeInputSchema> | undefined): Theme {
  const preset = clip(raw?.preset ?? "", 40) || DEFAULT_THEME.preset;
  const primary = raw?.primary && HEX_COLOR.test(raw.primary) ? raw.primary : DEFAULT_THEME.primary;
  return { preset, primary };
}

export function buildContentPrompt(prompt: string): string {
  const request = clip(escapeRequest(prompt), MAX_PROMPT_CHARS);
  return `${CONTENT_INSTRUCTIONS}<user-request>\n${request}\n</user-request>`;
}

export function parseGeneratedContent(raw: string): ParsedBlueprintContent {
  const extracted = extractJsonObject(raw);
  if (extracted === undefined) return { ok: false, reason: "invalid_json" };
  const parsed = GeneratedContentSchema.safeParse(extracted);
  if (!parsed.success) return { ok: false, reason: "invalid_shape" };

  const entities = (parsed.data.entities ?? [])
    .slice(0, MAX_ENTITIES)
    .map(normalizeEntity)
    .filter((entity): entity is Entity => entity !== undefined);
  const pages = (parsed.data.pages ?? [])
    .slice(0, MAX_PAGES)
    .map(normalizePage)
    .filter((page): page is Page => page !== undefined);
  if (pages.length === 0) return { ok: false, reason: "no_pages" };

  return {
    ok: true,
    content: {
      entities,
      pages,
      features: normalizeFeatures(parsed.data.features),
      theme: normalizeTheme(parsed.data.theme),
    },
  };
}
