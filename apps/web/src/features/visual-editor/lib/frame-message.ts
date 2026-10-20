import { frameSelectionSchema, type FrameSelection } from "../schemas/editor-schemas";

export function parseFrameSelection(
  event: MessageEvent<unknown>,
  frameWindow: Window | null,
  frameOrigin: string,
): FrameSelection | null {
  if (frameWindow === null || event.source !== frameWindow || event.origin !== frameOrigin) return null;
  const parsed = frameSelectionSchema.safeParse(event.data);
  return parsed.success ? parsed.data : null;
}

export function originOf(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}
