import { create } from "zustand";
import { setToken } from "@/shared/lib/httpClient";
import type { User } from "@/features/auth/schemas/authSchemas";

type PaidPlan = "pro" | "max";

interface AuthState {
  user: User | null;
  checking: boolean;
  setUser: (user: User | null) => void;
  setChecking: (checking: boolean) => void;
  updateCredits: (credits: number) => void;
  setUpgraded: (plan: PaidPlan) => void;
  signOut: () => void;
}

function getStoredPlan(userId: string): PaidPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(`appwright_upgraded_${userId}`);
    return stored === "pro" || stored === "max" ? stored : null;
  } catch {
    return null;
  }
}

// Client-owned session state — who is signed in. Server data about that
// user (projects, sessions) stays in TanStack Query, not here.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  checking: true,
  setUser: (user) => {
    if (!user) {
      set({ user: null });
      return;
    }
    const plan = user.plan ?? getStoredPlan(user.id) ?? "free";
    set({
      user: {
        ...user,
        isUpgraded: plan !== "free",
        plan,
      },
    });
  },
  setChecking: (checking) => set({ checking }),
  updateCredits: (credits) =>
    set((state) => (state.user ? { user: { ...state.user, credits } } : state)),
  setUpgraded: (plan) =>
    set((state) => {
      if (!state.user) return state;
      try {
        if (typeof window !== "undefined") {
          localStorage.setItem(`appwright_upgraded_${state.user.id}`, plan);
        }
      } catch {
        // ignore storage errors
      }
      return {
        user: {
          ...state.user,
          isUpgraded: true,
          plan,
        },
      };
    }),
  signOut: () => {
    setToken(null);
    set({ user: null });
  },
}));
