export interface LiveViewOptions {
  readonly onFrame: (jpeg: Buffer) => void;
  readonly onError?: (reason: string) => void;
}
