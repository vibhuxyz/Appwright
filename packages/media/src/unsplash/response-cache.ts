interface CacheEntry<T> {
  readonly value: T;
  readonly expiresAtMs: number;
}

export class ResponseCache<T> {
  private readonly entries = new Map<string, CacheEntry<T>>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries: number,
  ) {}

  get(key: string, nowMs: number): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAtMs <= nowMs) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, nowMs: number): void {
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAtMs: nowMs + this.ttlMs });
    const oldest = this.entries.keys().next().value;
    if (this.entries.size > this.maxEntries && oldest !== undefined) this.entries.delete(oldest);
  }

  shareInFlight<R>(key: string, start: () => Promise<R>): Promise<R> {
    const running = this.inFlight.get(key);
    if (running) return running as Promise<R>;
    const created = start().finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, created);
    return created;
  }
}
