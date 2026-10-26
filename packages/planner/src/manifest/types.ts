import type { Blueprint, DependencyManifest, EmailProviderType } from "@repo/contracts";

export interface GenerateManifestInput {
  projectId: string;
  blueprint: Blueprint;
  templateId?: string;
  emailProvider?: EmailProviderType;
}

export type ManifestGeneratorResult = DependencyManifest;
