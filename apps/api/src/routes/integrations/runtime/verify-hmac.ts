import { createHmac, timingSafeEqual } from "node:crypto";

const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/i;

export function verifyHmacSignature(
  secret: string,
  payload: string | Buffer,
  signature: string,
): boolean {
  if (!SHA256_HEX_PATTERN.test(signature)) return false;
  const expected = createHmac("sha256", secret).update(payload).digest();
  const received = Buffer.from(signature, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
