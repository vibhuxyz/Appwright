import { create } from "zustand";
import { setToken } from "@/shared/lib/httpClient";
import type { PlanId } from "@repo/contracts";
import type { User } from "@/features/auth/schemas/authSchemas";

interface AuthState {
  user: User | null;
  checking: boolean;
  setUser: (user: User | null) => void;
  setChecking: (checking: boolean) => void;
  updateCredits: (credits: number) => void;
  setPlan: (plan: PlanId) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  checking: true,
  setUser: (user) => set({ user }),
  setChecking: (checking) => set({ checking }),
  updateCredits: (credits) =>
    set((state) => (state.user ? { user: { ...state.user, credits } } : state)),
  setPlan: (plan) =>
    set((state) => (state.user ? { user: { ...state.user, plan } } : state)),
  signOut: () => {
    setToken(null);
    set({ user: null });
  },
}));
