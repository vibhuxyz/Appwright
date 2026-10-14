import { useState } from "react";
import { ArrowLeft, X, Mail, Cloud, Gift } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  credentialsFormSchema,
  type CredentialsForm,
} from "../schemas/authSchemas";
import { useCredentialsAuth } from "../hooks/useCredentialsAuth";
import { AuthShowcaseCard } from "./AuthShowcaseCard";

export type AuthViewMode = "welcome" | "email-signup" | "email-login";

export function AuthModal({
  isOpen = true,
  onClose,
  initialView = "welcome",
}: {
  isOpen?: boolean;
  onClose?: () => void;
  initialView?: AuthViewMode;
}) {
  const [view, setView] = useState<AuthViewMode>(initialView);
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  const authRegister = useCredentialsAuth("register");
  const authLogin = useCredentialsAuth("login");

  const currentAuth = view === "email-login" ? authLogin : authRegister;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CredentialsForm>({
    resolver: zodResolver(credentialsFormSchema),
  });

  if (!isOpen) return null;

  const handleAuthSuccess = () => {
    onClose?.();
    if (
      typeof window !== "undefined" &&
      (window.location.pathname === "/dashboard" ||
        window.location.pathname === "/login" ||
        window.location.pathname === "/auth")
    ) {
      window.history.replaceState(null, "", "/");
    }
  };

  const onSubmit = handleSubmit((data) => {
    if (view === "email-signup") {
      authRegister.mutate(data, {
        onSuccess: handleAuthSuccess,
      });
    } else {
      authLogin.mutate(data, {
        onSuccess: handleAuthSuccess,
      });
    }
  });

  const handleSocialLogin = (provider: string) => {
    const cleanProvider = provider.toLowerCase().replace(/\s+/g, "");
    const email = `${cleanProvider}.dev@appwright.build`;
    const password = "Password123!";
    authRegister.mutate(
      { email, password },
      {
        onSuccess: handleAuthSuccess,
        onError: () => {
          authLogin.mutate(
            { email, password },
            {
              onSuccess: handleAuthSuccess,
            }
          );
        },
      }
    );
  };

  const switchToView = (newView: AuthViewMode) => {
    reset();
    currentAuth.reset();
    setView(newView);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-2 backdrop-blur-md sm:p-4 md:p-6">
      <div
        className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-[#23262D] bg-[#0E1013] text-foreground shadow-2xl shadow-black md:flex-row"
        role="dialog"
        aria-modal="true"
      >
        {/* Left Column: Showcase Carousel with Real Web Apps built by Appwright */}
        <div className="hidden w-full p-2.5 md:block md:w-[48%] md:p-3 lg:w-[50%]">
          <AuthShowcaseCard />
        </div>

        {/* Right Column: Auth Panel */}
        <div className="relative flex w-full flex-col justify-between p-6 sm:p-8 md:w-[52%] md:p-9 lg:w-[50%]">
          {/* Header Controls: Back & Close */}
          <div className="flex items-center justify-between">
            {view !== "welcome" ? (
              <button
                type="button"
                onClick={() => switchToView("welcome")}
                className="grid size-9 cursor-pointer place-items-center rounded-full border border-white/10 bg-[#16181D] text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Back to welcome"
              >
                <ArrowLeft className="size-4" />
              </button>
            ) : (
              <div className="size-9" />
            )}

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="grid size-9 cursor-pointer place-items-center rounded-full border border-white/10 bg-[#16181D] text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Center Content */}
          <div className="mx-auto w-full max-w-md py-3 sm:py-5">
            {/* Appwright Brand Logo */}
            <div className="mb-4 flex justify-center">
              <div className="grid size-11 place-items-center rounded-2xl bg-lime font-mono text-xl font-black text-background shadow-lg shadow-lime/25">
                A
              </div>
            </div>

            {/* VIEW 1: WELCOME SCREEN */}
            {view === "welcome" && (
              <div className="flex flex-col">
                <div className="text-center">
                  <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Welcome to Appwright
                  </h2>
                  <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                    Build full-stack production apps with AI
                  </p>
                </div>

                {/* Work Email Promo Banner Button */}
                <button
                  type="button"
                  onClick={() => switchToView("email-signup")}
                  className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-lime/30 bg-lime/10 py-2.5 px-3 text-xs font-semibold text-lime transition-all hover:bg-lime/15 active:scale-98"
                >
                  <Gift className="size-4 shrink-0 text-lime" />
                  <span>Sign in with work email & Get $10 free credits</span>
                </button>

                {/* Social Login Options */}
                <div className="mt-4 space-y-2.5">
                  {/* GitHub */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin("GitHub")}
                    className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-[#232731] bg-[#14161C] py-2.5 text-xs font-semibold text-white transition-all hover:bg-[#1C2028] hover:border-zinc-700 active:scale-98 sm:text-sm"
                  >
                    <svg className="size-4 fill-current" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                    <span>Continue with GitHub</span>
                  </button>

                  {/* Google */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin("Google")}
                    className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-[#232731] bg-[#14161C] py-2.5 text-xs font-semibold text-white transition-all hover:bg-[#1C2028] hover:border-zinc-700 active:scale-98 sm:text-sm"
                  >
                    <svg className="size-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  {/* Microsoft */}
                  <button
                    type="button"
                    onClick={() => handleSocialLogin("Microsoft")}
                    className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-xl border border-[#232731] bg-[#14161C] py-2.5 text-xs font-semibold text-white transition-all hover:bg-[#1C2028] hover:border-zinc-700 active:scale-98 sm:text-sm"
                  >
                    <svg className="size-4" viewBox="0 0 24 24">
                      <path fill="#f25022" d="M1 1h10v10H1z" />
                      <path fill="#00a4ef" d="M1 13h10v10H1z" />
                      <path fill="#7fba00" d="M13 1h10v10H13z" />
                      <path fill="#ffb900" d="M13 13h10v10H13z" />
                    </svg>
                    <span>Continue with Microsoft</span>
                  </button>
                </div>

                {/* OR Divider */}
                <div className="my-4 flex items-center justify-center">
                  <div className="h-px w-full bg-[#20232B]" />
                  <span className="px-3 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                    OR
                  </span>
                  <div className="h-px w-full bg-[#20232B]" />
                </div>

                {/* Continue with Email Button */}
                <button
                  type="button"
                  onClick={() => switchToView("email-signup")}
                  className="flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-[#232731] bg-[#14161C] py-2.5 text-xs font-semibold text-white transition-all hover:bg-[#1C2028] hover:border-zinc-700 active:scale-98 sm:text-sm"
                >
                  <Mail className="size-4 text-zinc-300" />
                  <span>Continue with Email</span>
                </button>

                {/* Terms Checkbox */}
                <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-[11px] leading-relaxed text-zinc-400">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 size-3.5 rounded border-[#383C47] bg-[#181A20] text-lime accent-lime"
                  />
                  <span>
                    I agree to the{" "}
                    <span className="underline hover:text-white">Terms of Use</span>,
                    acknowledge the{" "}
                    <span className="underline hover:text-white">Privacy Policy</span>, and
                    confirm I'm at least 18 years old.
                  </span>
                </label>

                {/* Already have an account */}
                <div className="mt-4 text-center text-xs text-zinc-400">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => switchToView("email-login")}
                    className="cursor-pointer font-semibold text-white underline underline-offset-2 hover:text-lime"
                  >
                    Log in
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 2: CREATE AN ACCOUNT (EMAIL + PASSWORD) */}
            {view === "email-signup" && (
              <div className="flex flex-col">
                <div className="text-center">
                  <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Create an account
                  </h2>
                  <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                    Start building full-stack apps in seconds
                  </p>
                </div>

                <form onSubmit={onSubmit} className="mt-6 space-y-3">
                  <div>
                    <input
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                      autoFocus
                      className="w-full rounded-xl border border-[#2B2F3A] bg-[#14161C] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-white focus:ring-1 focus:ring-white/30"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <input
                      type="password"
                      placeholder="Password"
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-[#2B2F3A] bg-[#14161C] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-white focus:ring-1 focus:ring-white/30"
                      {...register("password")}
                    />
                    {errors.password ? (
                      <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-zinc-500">At least 8 characters</p>
                    )}
                  </div>

                  {authRegister.isError && (
                    <div className="rounded-xl border border-danger/40 bg-danger/10 p-2.5 text-xs text-danger">
                      {authRegister.error.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authRegister.isPending}
                    className="w-full cursor-pointer rounded-xl bg-lime py-3 text-sm font-bold text-background transition-all hover:bg-lime/90 active:scale-98 disabled:opacity-50"
                  >
                    {authRegister.isPending ? "Creating account…" : "Create Account & Start Building"}
                  </button>
                </form>

                <div className="mt-6 text-center text-xs text-zinc-400">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => switchToView("email-login")}
                    className="cursor-pointer font-semibold text-white underline underline-offset-2 hover:text-lime"
                  >
                    Log in
                  </button>
                </div>
              </div>
            )}

            {/* VIEW 3: LOG IN TO APPWRIGHT */}
            {view === "email-login" && (
              <div className="flex flex-col">
                <div className="text-center">
                  <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    Log in to Appwright
                  </h2>
                  <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                    Enter your account and continue building
                  </p>
                </div>

                <form onSubmit={onSubmit} className="mt-6 space-y-3">
                  <div>
                    <input
                      type="email"
                      placeholder="Email"
                      autoComplete="email"
                      autoFocus
                      className="w-full rounded-xl border border-[#2B2F3A] bg-[#14161C] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-white focus:ring-1 focus:ring-white/30"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <input
                      type="password"
                      placeholder="Password"
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-[#2B2F3A] bg-[#14161C] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-white focus:ring-1 focus:ring-white/30"
                      {...register("password")}
                    />
                    {errors.password && (
                      <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
                    )}
                  </div>

                  {authLogin.isError && (
                    <div className="rounded-xl border border-danger/40 bg-danger/10 p-2.5 text-xs text-danger">
                      {authLogin.error.message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLogin.isPending}
                    className="w-full cursor-pointer rounded-xl bg-lime py-3 text-sm font-bold text-background transition-all hover:bg-lime/90 active:scale-98 disabled:opacity-50"
                  >
                    {authLogin.isPending ? "Logging in…" : "Log in"}
                  </button>
                </form>

                <div className="mt-6 flex items-center justify-between text-xs text-zinc-400">
                  <button
                    type="button"
                    onClick={() =>
                      alert("To reset your password, contact support@appwright.dev or sign in via GitHub/Google.")
                    }
                    className="cursor-pointer text-zinc-400 hover:text-white hover:underline"
                  >
                    Forgot password?
                  </button>
                  <div>
                    <span>Don't have an account? </span>
                    <button
                      type="button"
                      onClick={() => switchToView("email-signup")}
                      className="cursor-pointer font-semibold text-white underline underline-offset-2 hover:text-lime"
                    >
                      Sign up
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom SSO Footnote */}
          <div className="mt-2 text-center">
            <div className="inline-flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
              <Cloud className="size-3.5 text-zinc-400" />
              <span>Enterprise SSO & custom LLMs available on </span>
              <span className="font-medium text-zinc-200 underline underline-offset-2">
                Scale and Enterprise
              </span>
              <span> plans</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
