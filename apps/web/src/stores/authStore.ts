import { create } from "zustand";
import { setToken } from "@/shared/lib/httpClient";
import type { User } from "@/features/auth/schemas/authSchemas";

interface AuthState {
  user: User | null;
  checking: boolean;
  setUser: (user: User | null) => void;
  setChecking: (checking: boolean) => void;
  updateCredits: (credits: number) => void;
  signOut: () => void;
}

// Client-owned session state — who is signed in. Server data about that
// user (projects, sessions) stays in TanStack Query, not here.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  checking: true,
  setUser: (user) => set({ user }),
  setChecking: (checking) => set({ checking }),
  updateCredits: (credits) =>
    set((state) => (state.user ? { user: { ...state.user, credits } } : state)),
  signOut: () => {
    setToken(null);
    set({ user: null });
  },
}));
