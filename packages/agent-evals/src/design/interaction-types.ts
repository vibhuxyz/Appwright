export type InteractionCheckId = "drag-card" | "image-compare-keyboard" | "image-compare-labels" | "canvas-reduced-motion" | "content-after-scroll" | "mobile-tap-targets";

export interface InteractionResult {
  readonly id: InteractionCheckId;
  readonly passed: boolean;
  readonly detail: string;
}
