import { redactSecrets } from "./mongo-redact";

export function maskSecretValue(value: string): string {
  if (!value) return "";
  if (value.includes("://")) {
    return redactSecrets(value);
  }
  const len = value.length;
  if (len <= 4) {
    return "••••";
  }
  if (len <= 8) {
    const head = value.slice(0, 1);
    const tail = value.slice(-1);
    return `${head}••••${tail}`;
  }
  const head = value.slice(0, 3);
  const tail = value.slice(-3);
  return `${head}••••••••${tail}`;
}
