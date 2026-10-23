import type { Viewport } from "./types";

export function screenshotName(route: string, viewport: Viewport, suffix?: string): string {
  const slug = route === "/" ? "home" : route.slice(1).replaceAll("/", "-");
  return `${slug}-${viewport.name}${suffix ? `-${suffix}` : ""}.png`;
}
