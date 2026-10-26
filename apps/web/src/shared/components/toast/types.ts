export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title: string;
  description?: string;
  durationMs?: number;
}

export interface ToastItem extends ToastOptions {
  id: string;
  variant: ToastVariant;
  createdAt: number;
}
