import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

// D41 (write-through secrets): the Vercel OAuth token is the one credential
// we do keep, since it's ours to hold on the user's behalf — everything the
// user's app itself needs (DATABASE_URL, API keys) is pushed straight into
// their Vercel project env and never lands in our DB. AES-256-GCM, key
// derived from SECRETS_ENCRYPTION_KEY so the raw env var never touches the
// cipher directly.
const ALGO = "aes-256-gcm";

function deriveKey(): Buffer {
  const secret = process.env.SECRETS_ENCRYPTION_KEY;
  if (!secret) throw new Error("SECRETS_ENCRYPTION_KEY is not set");
  return scryptSync(secret, "appwright-secrets", 32);
}

export function encryptSecret(plaintext: string): string {
  const key = deriveKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map((b) => b.toString("base64")).join(".");
}

export function decryptSecret(encoded: string): string {
  const key = deriveKey();
  const parts = encoded.split(".").map((b) => Buffer.from(b, "base64"));
  const [iv, authTag, ciphertext] = [parts[0]!, parts[1]!, parts[2]!];
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
