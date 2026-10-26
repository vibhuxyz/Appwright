import { create } from "zustand";
import type { ToastItem, ToastOptions, ToastVariant } from "./types";

const MAX_TOASTS = 5;
const DEFAULT_DURATION_MS = 4200;

interface ToastState {
  toasts: ToastItem[];
  addToast: (variant: ToastVariant, options: ToastOptions) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (variant, options) => {
    const id = crypto.randomUUID();
    const item: ToastItem = {
      id,
      variant,
      title: options.title,
      description: options.description,
      durationMs: options.durationMs ?? DEFAULT_DURATION_MS,
      createdAt: Date.now(),
    };
    set((state) => ({
      toasts: [...state.toasts, item].slice(-MAX_TOASTS),
    }));
    return id;
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}));

export const toast = {
  success: (title: string, description?: string, durationMs?: number) =>
    useToastStore.getState().addToast("success", { title, description, durationMs }),
  error: (title: string, description?: string, durationMs?: number) =>
    useToastStore.getState().addToast("error", { title, description, durationMs }),
  warning: (title: string, description?: string, durationMs?: number) =>
    useToastStore.getState().addToast("warning", { title, description, durationMs }),
  info: (title: string, description?: string, durationMs?: number) =>
    useToastStore.getState().addToast("info", { title, description, durationMs }),
  dismiss: (id: string) => useToastStore.getState().removeToast(id),
};
