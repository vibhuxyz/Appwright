export const PREVIEW_COOKIE = "aw_preview";

const API_PREFIXES = [
  "/auth",
  "/health",
  "/session",
  "/project",
  "/projects",
  "/conversation",
  "/conversations",
  "/stream",
  "/models",
  "/files",
  "/vercel",
  "/prompt",
  "/approval",
  "/user",
  "/preview",
];

const PREVIEW_URL_PATTERN = /^\/preview\/([^/?#]+)(\/[^?#]*)?(\?.*)?$/;

export interface PreviewTarget {
  token: string;
  upstreamPath: string;
}

export function isApiPath(pathname: string): boolean {
  return API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function cookieValue(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const separatorIndex = part.indexOf("=");
    if (separatorIndex === -1) continue;
    if (part.slice(0, separatorIndex).trim() === name) {
      return decodeURIComponent(part.slice(separatorIndex + 1).trim());
    }
  }
  return null;
}

export function previewTargetFor(
  requestUrl: string,
  cookieHeader: string | undefined,
): PreviewTarget | null {
  const match = PREVIEW_URL_PATTERN.exec(requestUrl);
  const token = match?.[1];
  if (token) {
    return { token: decodeURIComponent(token), upstreamPath: `${match[2] ?? "/"}${match[3] ?? ""}` };
  }
  const pathname = requestUrl.split("?")[0] ?? "";
  if (isApiPath(pathname)) return null;
  const cookieToken = cookieValue(cookieHeader, PREVIEW_COOKIE);
  return cookieToken ? { token: cookieToken, upstreamPath: requestUrl } : null;
}
