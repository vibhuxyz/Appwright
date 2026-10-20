export { detectAssetSlots } from "./detect";
export { buildAssetFolder, uploadAsset } from "./cloudinary";
export type { AssetSourceFolder, UploadAssetInput, UploadAssetResult } from "./cloudinary";
export { imageProviderFor } from "./image-provider";
export type {
  GenerateImageInput,
  GeneratedImage,
  ImageGenerationError,
  ImageGenerationErrorCode,
  ImageProvider,
  ImageProviderName,
  Result,
} from "./image-provider";
