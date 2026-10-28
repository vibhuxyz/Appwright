import z from "zod";
import { ProjectType, RequirementSchema } from "./requirement.schema";
import { PlannedSectionSchema, SECTION_PLAN_LIMITS } from "./section-plan.schema";
import { ThemeOptionSchema } from "./theme";

export const WorkflowKind = z.enum([
  "browse-catalog",
  "pickup-order",
  "delivery-order",
  "custom-request",
  "pop-up-locations",
  "inventory",
  "notifications",
  "admin-operations",
]);
export type WorkflowKind = z.infer<typeof WorkflowKind>;

export const WorkflowSchema = z.object({
  id: z.string().min(1),
  kind: WorkflowKind,
  name: z.string().min(1),
  inScope: z.boolean(),
  reason: z.string().min(1),
  actors: z.array(z.string().min(1)).default([]),
  steps: z.array(z.string().min(1)).default([]),
});
export type Workflow = z.infer<typeof WorkflowSchema>;

export const BLUEPRINT_SCHEMA_VERSION = 1;

export const StackSchema = z.object({
  framework: z.literal("next"),
  db: z.enum(["mongodb", "postgres", "none"]),
  orm: z.enum(["mongoose", "prisma", "none"]),
  auth: z.literal("authjs"),
  styling: z.literal("tailwind"),
});
export type Stack = z.infer<typeof StackSchema>;

export const IntentSchema = z.object({
  type: z.string().min(1),
  domain: z.string().min(1),
  complexity: z.enum(["simple", "medium", "complex"]),
  projectType: ProjectType.optional().catch(undefined),
});
export type Intent = z.infer<typeof IntentSchema>;

export const EntityFieldType = z.enum([
  "String",
  "Int",
  "Boolean",
  "DateTime",
  "Json",
]);
export type EntityFieldType = z.infer<typeof EntityFieldType>;

export const EntityFieldSchema = z.object({
  name: z.string().min(1),
  type: EntityFieldType,
  required: z.boolean(),
  unique: z.boolean().default(false),
});
export type EntityField = z.infer<typeof EntityFieldSchema>;

export const EntitySchema = z.object({
  name: z.string().min(1),
  fields: z.array(EntityFieldSchema).min(1),
  relations: z.array(z.string()).default([]),
});
export type Entity = z.infer<typeof EntitySchema>;

export const ArtDirectionSchema = z.enum(["editorial", "commerce", "product", "local", "classic"]);
export type ArtDirection = z.infer<typeof ArtDirectionSchema>;

export const PageSchema = z.object({
  route: z.string().min(1),
  purpose: z.string().min(1),
  components: z.array(z.string()).default([]),
  sections: z.array(PlannedSectionSchema).max(SECTION_PLAN_LIMITS.maxSectionsPerPage).optional(),
  artDirection: ArtDirectionSchema.optional(),
});
export type Page = z.infer<typeof PageSchema>;

export const ThemeSchema = z.object({
  preset: z.string().min(1),
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
export type Theme = z.infer<typeof ThemeSchema>;

export const DesignBlockSchema = z.object({
  style: z.string().default("minimal-premium"),
  density: z.enum(["compact", "comfortable", "spacious"]).default("comfortable"),
  fontFamily: z.string().default("Inter"),
  colorMode: z.enum(["light", "dark", "system"]).default("light"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#111111"),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366F1"),
  radius: z.enum(["none", "sm", "md", "lg", "full"]).default("md"),
  maxContentWidth: z.string().default("1280px"),
  theme: ThemeOptionSchema.optional(),
});
export type DesignBlock = z.infer<typeof DesignBlockSchema>;

export const DEFAULT_DESIGN_BLOCK: DesignBlock = {
  style: "minimal-premium",
  density: "comfortable",
  fontFamily: "Inter",
  colorMode: "light",
  primaryColor: "#111111",
  accentColor: "#6366F1",
  radius: "md",
  maxContentWidth: "1280px",
};

export const LayoutBlockSchema = z.object({
  header: z.string().default("72px"),
  sidebar: z.string().default("240px"),
  content: z.string().default("12-column"),
  mobileNavigation: z.enum(["bottom", "drawer", "header", "none"]).default("bottom"),
});
export type LayoutBlock = z.infer<typeof LayoutBlockSchema>;

export const DEFAULT_LAYOUT_BLOCK: LayoutBlock = {
  header: "72px",
  sidebar: "240px",
  content: "12-column",
  mobileNavigation: "bottom",
};

export const ResponsiveBreakpointSchema = z.object({
  columns: z.number().int().positive().optional(),
  padding: z.string().optional(),
  navigation: z.string().optional(),
}).passthrough();
export type ResponsiveBreakpoint = z.infer<typeof ResponsiveBreakpointSchema>;

export const ResponsiveBlockSchema = z.object({
  desktop: ResponsiveBreakpointSchema.default({}),
  tablet: ResponsiveBreakpointSchema.default({}),
  mobile: ResponsiveBreakpointSchema.default({}),
});
export type ResponsiveBlock = z.infer<typeof ResponsiveBlockSchema>;

export const DEFAULT_RESPONSIVE_BLOCK: ResponsiveBlock = {
  desktop: {},
  tablet: {},
  mobile: {},
};

export const BlueprintSchema = z.object({
  blueprintVersion: z.number().int().positive(),
  intent: IntentSchema,
  stack: StackSchema,
  entities: z.array(EntitySchema).default([]),
  pages: z.array(PageSchema).min(1),
  features: z.array(z.string()).default([]),
  theme: ThemeSchema,
  design: DesignBlockSchema.default(DEFAULT_DESIGN_BLOCK),
  layout: LayoutBlockSchema.default(DEFAULT_LAYOUT_BLOCK),
  responsive: ResponsiveBlockSchema.default(DEFAULT_RESPONSIVE_BLOCK),
  projectType: ProjectType.optional(),
  requirements: z.array(RequirementSchema).optional(),
  workflows: z.array(WorkflowSchema).optional(),
});
export type Blueprint = z.infer<typeof BlueprintSchema>;
