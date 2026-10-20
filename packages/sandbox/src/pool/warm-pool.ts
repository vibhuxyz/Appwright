export interface WarmPoolOptions<T> {
  size: number;
  boot: () => Promise<T>;
  dispose: (item: T) => Promise<void>;
  onBootError: (error: unknown) => void;
}

export class WarmPool<T> {
  private readonly ready: T[] = [];
  private bootingCount = 0;
  private isClosed = false;

  constructor(private readonly options: WarmPoolOptions<T>) {}

  get readyCount(): number {
    return this.ready.length;
  }

  take(): T | undefined {
    const item = this.ready.shift();
    this.refill();
    return item;
  }

  refill(): void {
    while (!this.isClosed && this.ready.length + this.bootingCount < this.options.size) {
      this.bootingCount += 1;
      void this.bootOne();
    }
  }

  async close(): Promise<void> {
    this.isClosed = true;
    const items = this.ready.splice(0);
    await Promise.all(items.map((item) => this.options.dispose(item)));
  }

  private async bootOne(): Promise<void> {
    try {
      const item = await this.options.boot();
      if (this.isClosed) {
        await this.options.dispose(item);
        return;
      }
      this.ready.push(item);
    } catch (error) {
      this.options.onBootError(error);
    } finally {
      this.bootingCount -= 1;
    }
  }
}
