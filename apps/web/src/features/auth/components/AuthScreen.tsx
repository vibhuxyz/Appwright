import { useState } from "react";
import { LandingPage } from "@/features/landing/components/LandingPage";
import { AuthModal, type AuthViewMode } from "./AuthModal";

type AuthModalState = { open: false } | { open: true; view: AuthViewMode };

export function AuthScreen() {
  const [authModal, setAuthModal] = useState<AuthModalState>({ open: false });

  return (
    <>
      <LandingPage
        onLoginClick={() => setAuthModal({ open: true, view: "email-login" })}
        onGetStartedClick={() => setAuthModal({ open: true, view: "welcome" })}
      />
      {authModal.open && (
        <AuthModal
          key={authModal.view}
          isOpen
          initialView={authModal.view}
          onClose={() => setAuthModal({ open: false })}
        />
      )}
    </>
  );
}
