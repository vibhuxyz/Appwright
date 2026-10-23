const MONGO_URI_WITH_USERINFO =
  /mongodb(\+srv)?:\/\/([^/@]+)@/gi;

export function redactSecrets(text: string): string {
  return text.replace(MONGO_URI_WITH_USERINFO, "mongodb$1://***@");
}

export function containsSecret(text: string, secret: string): boolean {
  if (!secret) return false;
  return text.includes(secret);
}
