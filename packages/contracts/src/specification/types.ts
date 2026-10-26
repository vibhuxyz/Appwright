import type { z } from "zod";
import type {
  ProductTypeSchema,
  ProjectSpecificationSchema,
  SpecDesignSystemSchema,
  SpecEntitySchema,
  SpecEvidenceSchema,
  SpecIntegrationSchema,
  SpecPageSchema,
  SpecProjectIntentSchema,
  SpecRequirementsSchema,
} from "./specification.schema";

export type ProductType = z.infer<typeof ProductTypeSchema>;
export type SpecProjectIntent = z.infer<typeof SpecProjectIntentSchema>;
export type SpecRequirements = z.infer<typeof SpecRequirementsSchema>;
export type SpecPage = z.infer<typeof SpecPageSchema>;
export type SpecDesignSystem = z.infer<typeof SpecDesignSystemSchema>;
export type SpecEntity = z.infer<typeof SpecEntitySchema>;
export type SpecIntegration = z.infer<typeof SpecIntegrationSchema>;
export type SpecEvidence = z.infer<typeof SpecEvidenceSchema>;
export type ProjectSpecification = z.infer<typeof ProjectSpecificationSchema>;
