import { useEffect } from "react";
import { Outlet } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import { getToken } from "@/shared/lib/httpClient";
import { authApi } from "@/features/auth/api/authApi";
import { AuthScreen } from "@/features/auth/components/AuthScreen";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";

export function RootLayout() {
  const user = useAuthStore((s) => s.user);
  const checking = useAuthStore((s) => s.checking);
  const setUser = useAuthStore((s) => s.setUser);
  const setChecking = useAuthStore((s) => s.setChecking);
  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    if (!getToken()) {
      setChecking(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => signOut())
      .finally(() => setChecking(false));
  }, [setUser, setChecking, signOut]);

  // Any 401 from any call drops us back to the login screen, so an expired
  // token cannot leave the UI stuck on a page that will never load.
  useEffect(() => {
    window.addEventListener("appwright:unauthorized", signOut);
    return () => window.removeEventListener("appwright:unauthorized", signOut);
  }, [signOut]);

  // Ensure /dashboard redirects to root "/" after login or direct navigation
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname === "/dashboard") {
      window.history.replaceState(null, "", "/");
    }
  }, [user]);

  if (checking) return null;
  if (!user) return <AuthScreen />;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
