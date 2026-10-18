import z from "zod";

// The most important artifact in V4 — everything downstream consumes this.
// Versioned from day one (docs/versions/V4_APP_BUILDER.md Slice 1): a
// blueprint is immutable per version, an approved change request writes a
// new row at blueprintVersion + 1, it never edits the old one.

export const BLUEPRINT_SCHEMA_VERSION = 1;

// D14/Slice 3: one stack, not a matrix. Adding a second stack is a new
// literal in each enum plus a template, not a redesign of this schema.
export const StackSchema = z.object({
  framework: z.literal("next"),
  db: z.literal("postgres"),
  orm: z.literal("prisma"),
  auth: z.literal("authjs"),
  styling: z.literal("tailwind"),
});
export type Stack = z.infer<typeof StackSchema>;

export const IntentSchema = z.object({
  type: z.string().min(1),
  domain: z.string().min(1),
  complexity: z.enum(["simple", "medium", "complex"]),
});
export type Intent = z.infer<typeof IntentSchema>;

// Prisma scalar types the template actually supports. `Decimal` is
// deliberately absent — V4 doc's Slice-0 trap table: it cannot serialise
// across the Server -> Client Component boundary. Money is `Int` cents.
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

export const PageSchema = z.object({
  route: z.string().min(1),
  purpose: z.string().min(1),
  components: z.array(z.string()).default([]),
});
export type Page = z.infer<typeof PageSchema>;

export const ThemeSchema = z.object({
  preset: z.string().min(1),
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
export type Theme = z.infer<typeof ThemeSchema>;

export const BlueprintSchema = z.object({
  blueprintVersion: z.number().int().positive(),
  intent: IntentSchema,
  stack: StackSchema,
  entities: z.array(EntitySchema).default([]),
  pages: z.array(PageSchema).min(1),
  features: z.array(z.string()).default([]),
  theme: ThemeSchema,
});
export type Blueprint = z.infer<typeof BlueprintSchema>;
