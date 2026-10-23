export const BROWSER_CHECK_OPENING = "Opening the app in a browser…";

const CHECKING_PREFIX = "Checking ";
const MAX_STATUS_CHARS = 180;

export function browserCheckStatus(label: string): string {
  const flat = label.replace(/\s+/g, " ").trim().slice(0, MAX_STATUS_CHARS);
  return `${CHECKING_PREFIX}${flat}`;
}

export function isBrowserCheckStatus(detail: string): boolean {
  return detail === BROWSER_CHECK_OPENING || detail.startsWith(CHECKING_PREFIX);
}
