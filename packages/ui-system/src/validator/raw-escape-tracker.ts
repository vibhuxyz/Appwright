import type { RawEscape, RawEscapeLocation } from "./types";

export const MISSING_TOKEN_THRESHOLD = 3;

export class RawEscapeTracker {
  private readonly escapesByValue = new Map<string, RawEscapeLocation[]>();

  record(value: string, location: RawEscapeLocation): void {
    const existing = this.escapesByValue.get(value);
    if (existing) {
      existing.push(location);
    } else {
      this.escapesByValue.set(value, [location]);
    }
  }

  getEscapes(): RawEscape[] {
    const results: RawEscape[] = [];
    for (const [value, locations] of this.escapesByValue.entries()) {
      const count = locations.length;
      const recommendation =
        count >= MISSING_TOKEN_THRESHOLD
          ? `Value "${value}" occurred ${count} times; promote to a design token.`
          : undefined;
      results.push({ value, count, locations, recommendation });
    }
    return results.sort((a, b) => b.count - a.count);
  }

  getMissingTokenSuggestions(): string[] {
    return this.getEscapes()
      .filter((e) => e.count >= MISSING_TOKEN_THRESHOLD)
      .map((e) => e.recommendation)
      .filter((rec): rec is string => rec !== undefined);
  }
}
