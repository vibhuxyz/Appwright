import { v2 as cloudinary } from "cloudinary";
import type { UploadAssetInput, UploadAssetResult } from "./types";

const UPLOAD_TIMEOUT_MS = 30_000;

let configured = false;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function ensureConfigured(): void {
  if (configured) return;
  cloudinary.config({
    cloud_name: requireEnv("CLOUDINARY_CLOUD_NAME"),
    api_key: requireEnv("CLOUDINARY_API_KEY"),
    api_secret: requireEnv("CLOUDINARY_API_SECRET"),
  });
  configured = true;
}

export async function uploadAsset(input: UploadAssetInput): Promise<UploadAssetResult> {
  ensureConfigured();
  const dataUri = `data:${input.mimeType};base64,${Buffer.from(input.bytes).toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: input.folder,
    public_id: input.publicId,
    resource_type: "image",
    overwrite: false,
    timeout: UPLOAD_TIMEOUT_MS,
  });
  return { publicId: result.public_id, url: result.secure_url };
}
