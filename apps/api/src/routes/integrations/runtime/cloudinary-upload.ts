import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";
import { MANAGED_CLOUDINARY_OPERATION, managedUsageLimit } from "@repo/contracts";
import {
  completeIntegrationUsage,
  managedCredentials,
  prisma,
  reserveIntegrationUsage,
  resolveProjectRuntimeEnvVars,
} from "@repo/db";
import { Router } from "express";
import { integrationRuntimeScope } from "./context";
import { runtimeError } from "./runtime-error";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;
const UploadRequestSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  dataBase64: z.string().max(14 * 1024 * 1024).regex(/^[A-Za-z0-9+/]+={0,2}$/),
}).strict();

type CredentialMode = "APPWRITE_MANAGED" | "BYOK";
type CloudinaryCredentials = { cloudName: string; apiKey: string; apiSecret: string };

export const cloudinaryUploadRouter = Router();

export function uploadFolder(input: { projectId: string; environment: string; credentialMode: CredentialMode }): string {
  return input.credentialMode === "APPWRITE_MANAGED"
    ? `appwright-apps/${input.projectId}/${input.environment}`
    : `appwright/${input.projectId}`;
}

async function resolveUploadCredentials(
  credentialMode: CredentialMode,
  scope: { projectId: string; environment: "development" | "preview" | "production" },
): Promise<CloudinaryCredentials | null> {
  if (credentialMode === "APPWRITE_MANAGED") {
    const managed = managedCredentials("cloudinary");
    return managed?.provider === "cloudinary"
      ? { cloudName: managed.cloudName, apiKey: managed.apiKey, apiSecret: managed.apiSecret }
      : null;
  }
  return cloudinaryCredentials(await resolveProjectRuntimeEnvVars(scope));
}

cloudinaryUploadRouter.post("/v1/integrations/cloudinary/upload", async (req, res) => {
  const parsed = UploadRequestSchema.safeParse(req.body);
  const idempotencyKey = req.header("Idempotency-Key") ?? "";
  if (!parsed.success || !IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    runtimeError(res, 400, "INVALID_UPLOAD", "Provide one JPEG, PNG, or WebP image and an Idempotency-Key");
    return;
  }
  const file = Buffer.from(parsed.data.dataBase64, "base64");
  if (file.length === 0 || file.length > MAX_UPLOAD_BYTES || !matchesImageType(file, parsed.data.mimeType)) {
    runtimeError(res, 422, "INVALID_UPLOAD", "Image content must match its declared type and stay under 10 MiB");
    return;
  }
  const scope = integrationRuntimeScope(res);
  const config = await prisma.projectIntegrationEnvironment.findFirst({
    where: {
      environment: scope.environment,
      status: "connected",
      integration: { projectId: scope.projectId, provider: "cloudinary" },
    },
    select: { credentialMode: true },
  });
  if (!config) {
    runtimeError(res, 422, "INTEGRATION_NOT_CONFIGURED", "Cloudinary is not connected for this environment");
    return;
  }
  const credentialMode: CredentialMode = config.credentialMode === "APPWRITE_MANAGED" ? "APPWRITE_MANAGED" : "BYOK";
  const credentials = await resolveUploadCredentials(credentialMode, scope);
  if (!credentials) {
    runtimeError(res, 422, "INTEGRATION_CONFIGURATION_REQUIRED", "Cloudinary credentials are incomplete for this environment");
    return;
  }
  const fingerprint = createHash("sha256").update(parsed.data.mimeType).update(file).digest("hex");
  const reservation = await reserveIntegrationUsage({
    projectId: scope.projectId,
    provider: "cloudinary",
    credentialMode,
    environment: scope.environment,
    operation: MANAGED_CLOUDINARY_OPERATION,
    idempotencyKey,
    requestFingerprint: fingerprint,
    ...(credentialMode === "APPWRITE_MANAGED" ? { limit: managedUsageLimit("cloudinary") } : {}),
  });
  if (!reservation.ok && reservation.reason === "quota_exhausted") {
    runtimeError(res, 429, "INTEGRATION_QUOTA_EXHAUSTED", "Your Appwright Cloudinary test allowance is exhausted. Connect your own account to continue.", {
      integration: "cloudinary", used: reservation.used, limit: reservation.limit, nextAction: "connect_byok_or_upgrade",
    });
    return;
  }
  if (!reservation.ok) {
    runtimeError(res, 409, "IDEMPOTENCY_CONFLICT", "This idempotency key was already used for a different upload");
    return;
  }
  if (reservation.isDuplicate) {
    if (reservation.resultJson) {
      const previousResult = reservation.resultJson as { status?: unknown };
      if (previousResult.status === "failed") {
        runtimeError(res, 502, "MEDIA_PROVIDER_REJECTED", "Cloudinary did not accept the image upload");
        return;
      }
      res.json(reservation.resultJson);
      return;
    }
    runtimeError(res, 409, "REQUEST_IN_PROGRESS", "The upload request is still being processed");
    return;
  }
  const folder = uploadFolder({ projectId: scope.projectId, environment: scope.environment, credentialMode });
  const result = await uploadCloudinary(credentials, folder, file, parsed.data.mimeType);
  if (!result) {
    await completeIntegrationUsage({ usageId: reservation.usageId, isAccepted: false, resultJson: { status: "failed" } });
    runtimeError(res, 502, "MEDIA_PROVIDER_REJECTED", "Cloudinary did not accept the image upload");
    return;
  }
  const response = { status: "uploaded", publicId: result.publicId, secureUrl: result.secureUrl, bytes: result.bytes };
  await completeIntegrationUsage({
    usageId: reservation.usageId,
    isAccepted: true,
    providerRequestId: result.publicId,
    resultJson: response,
  });
  res.status(201).json(response);
});

export function matchesImageType(file: Buffer, mimeType: string): boolean {
  if (mimeType === "image/jpeg") return file[0] === 0xff && file[1] === 0xd8 && file[2] === 0xff;
  if (mimeType === "image/png") return file.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  return mimeType === "image/webp" && file.toString("ascii", 0, 4) === "RIFF" && file.toString("ascii", 8, 12) === "WEBP";
}

function cloudinaryCredentials(values: Record<string, string>): CloudinaryCredentials | null {
  const cloudName = values.CLOUDINARY_CLOUD_NAME;
  const apiKey = values.CLOUDINARY_API_KEY;
  const apiSecret = values.CLOUDINARY_API_SECRET;
  return cloudName && apiKey && apiSecret ? { cloudName, apiKey, apiSecret } : null;
}

async function uploadCloudinary(
  credentials: CloudinaryCredentials,
  folder: string,
  file: Buffer,
  mimeType: string,
): Promise<{ publicId: string; secureUrl: string; bytes: number } | null> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const publicId = randomUUID();
  const signature = createHash("sha1")
    .update(`folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${credentials.apiSecret}`)
    .digest("hex");
  const form = new FormData();
  form.set("file", new Blob([file], { type: mimeType }), `${publicId}.${imageExtension(mimeType)}`);
  form.set("api_key", credentials.apiKey);
  form.set("timestamp", timestamp);
  form.set("folder", folder);
  form.set("public_id", publicId);
  form.set("signature", signature);
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${credentials.cloudName}/image/upload`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (!isCloudinaryUpload(body)) return null;
    return { publicId: body.public_id, secureUrl: body.secure_url, bytes: body.bytes };
  } catch {
    return null;
  }
}

function imageExtension(mimeType: string): string {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/png") return "png";
  return "webp";
}

function isCloudinaryUpload(value: unknown): value is { public_id: string; secure_url: string; bytes: number } {
  return typeof value === "object" && value !== null &&
    "public_id" in value && typeof value.public_id === "string" &&
    "secure_url" in value && typeof value.secure_url === "string" &&
    value.secure_url.startsWith("https://res.cloudinary.com/") &&
    "bytes" in value && typeof value.bytes === "number" && value.bytes <= MAX_UPLOAD_BYTES;
}
