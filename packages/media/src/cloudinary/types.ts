export type AssetSourceFolder = "uploads" | "generated" | "stock";

export interface UploadAssetInput {
  readonly bytes: Uint8Array;
  readonly mimeType: string;
  readonly folder: string;
  readonly publicId: string;
}

export interface UploadAssetResult {
  readonly publicId: string;
  readonly url: string;
}
