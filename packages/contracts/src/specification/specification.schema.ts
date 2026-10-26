import { z } from "zod";

export const ProductTypeSchema = z.enum([
  "website",
  "web_app",
  "dashboard",
  "e_commerce",
  "mobile_web",
  "other",
]);

export const SpecProjectIntentSchema = z.object({
  summary: z.string(),
  productType: ProductTypeSchema.default("web_app"),
  targetUsers: z.array(z.string()).default([]),
  primaryGoals: z.array(z.string()).default([]),
  successCriteria: z.array(z.string()).default([]),
});

export const SpecRequirementsSchema = z.object({
  functional: z.array(z.string()).default([]),
  nonFunctional: z.array(z.string()).default([]),
  businessRules: z.array(z.string()).default([]),
  constraints: z.array(z.string()).default([]),
  acceptanceCriteria: z.array(z.string()).default([]),
});

export const SpecPageSectionSchema = z.object({
  name: z.string(),
  purpose: z.string(),
  components: z.array(z.string()).default([]),
});

export const SpecPageSchema = z.object({
  name: z.string(),
  route: z.string(),
  purpose: z.string(),
  sections: z.array(SpecPageSectionSchema).default([]),
  requiredComponents: z.array(z.string()).default([]),
  sourceReferences: z.array(z.string()).default([]),
});

export const SpecColorSchema = z.object({
  role: z.string(),
  hex: z.string(),
  name: z.string().optional(),
});

export const SpecTypographySchema = z.object({
  role: z.string(),
  font: z.string().optional(),
  size: z.string().optional(),
  weight: z.string().optional(),
});

export const SpecDesignSystemSchema = z.object({
  visualDirection: z.string().default("modern"),
  colors: z.array(SpecColorSchema).default([]),
  typography: z.array(SpecTypographySchema).default([]),
  spacingGuidance: z.array(z.string()).default([]),
  componentGuidance: z.array(z.string()).default([]),
  responsiveRequirements: z.array(z.string()).default([]),
});

export const SpecFieldSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean().default(true),
  unique: z.boolean().default(false),
});

export const SpecEntitySchema = z.object({
  entity: z.string(),
  fields: z.array(SpecFieldSchema).default([]),
  relations: z.array(z.string()).default([]),
  sourceReferences: z.array(z.string()).default([]),
});

export const SpecIntegrationSchema = z.object({
  name: z.string(),
  purpose: z.string(),
  required: z.boolean().default(false),
  sourceReferences: z.array(z.string()).default([]),
});

export const SpecEvidenceSchema = z.object({
  sourceId: z.string(),
  sourceName: z.string(),
  type: z.enum(["user_prompt", "image_reference", "pdf_document"]),
  role: z.string(),
  description: z.string(),
  confidence: z.number().min(0).max(1).default(1),
});

export const ProjectSpecificationSchema = z.object({
  version: z.literal(1).default(1),
  projectIntent: SpecProjectIntentSchema,
  requirements: SpecRequirementsSchema.default({
    functional: [],
    nonFunctional: [],
    businessRules: [],
    constraints: [],
    acceptanceCriteria: [],
  }),
  pages: z.array(SpecPageSchema).default([]),
  designSystem: SpecDesignSystemSchema.default({
    visualDirection: "modern",
    colors: [],
    typography: [],
    spacingGuidance: [],
    componentGuidance: [],
    responsiveRequirements: [],
  }),
  dataModel: z.array(SpecEntitySchema).default([]),
  integrations: z.array(SpecIntegrationSchema).default([]),
  implementationConstraints: z.array(z.string()).default([]),
  ambiguities: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  sourceEvidence: z.array(SpecEvidenceSchema).default([]),
  confidence: z.number().min(0).max(1).default(1),
});
