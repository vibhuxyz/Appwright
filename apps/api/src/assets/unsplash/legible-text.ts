import type { UnsplashPhoto } from "@repo/contracts";

const LEGIBLE_TEXT_PATTERN =
  /\b(screenshots?|web ?sites?|web ?pages?|landing pages?|dashboards?|user interfaces?|interfaces?|ui|ux|app screens?|log ?in|sign ?in|sign ?up|linkedin|facebook|instagram|twitter|tiktok|youtube|google|airbnb|browser|logos?|slogans?|quotes?|typography|text|words|letters|posters?|billboards?|banners?|flags?|signs?|neon|signage|chalkboards?|menu boards?|laptops?|macbooks?|computers?|monitors?|screens?|slides?|presentations?|keyboards?|phones?|iphones?|tablets?)\b/i;

function slugWords(photoUrl: string): string {
  const slug = new URL(photoUrl).pathname.split("/").filter(Boolean).at(-1) ?? "";
  const segments = slug.split("-");
  return (segments.length > 1 ? segments.slice(0, -1) : segments).join(" ");
}

export function photoWords(photo: Pick<UnsplashPhoto, "description" | "attribution">): string {
  return `${photo.description ?? ""} ${slugWords(photo.attribution.photoUrl)}`.toLowerCase();
}

export function hasLegibleText(photo: Pick<UnsplashPhoto, "description" | "attribution">): boolean {
  return LEGIBLE_TEXT_PATTERN.test(photoWords(photo));
}
