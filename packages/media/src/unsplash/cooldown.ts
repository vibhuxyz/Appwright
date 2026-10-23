import type { UnsplashError } from "./types";

export class Cooldown {
  private blocked: { untilMs: number; error: UnsplashError } | undefined;

  start(error: UnsplashError, untilMs: number): void {
    this.blocked = { untilMs, error };
  }

  activeError(nowMs: number): UnsplashError | undefined {
    if (!this.blocked) return undefined;
    if (this.blocked.untilMs <= nowMs) {
      this.blocked = undefined;
      return undefined;
    }
    return this.blocked.error;
  }
}
