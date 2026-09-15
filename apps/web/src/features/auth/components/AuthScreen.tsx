import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  credentialsFormSchema,
  type CredentialsForm,
} from "../schemas/authSchemas";
import { useCredentialsAuth } from "../hooks/useCredentialsAuth";
import { Button } from "@/shared/components/ui/Button";

type Mode = "login" | "register";

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const auth = useCredentialsAuth(mode);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CredentialsForm>({ resolver: zodResolver(credentialsFormSchema) });

  const submit = handleSubmit((values) => auth.mutate(values));

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <form onSubmit={submit} className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold">Appwright</h1>
        <p className="mb-6 text-sm text-muted">
          {mode === "login"
            ? "Sign in to your projects."
            : "Create an account to get started."}
        </p>

        <label className="mb-1 block text-xs text-muted">Email</label>
        <input
          type="email"
          autoComplete="email"
          className="mb-1 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm transition-colors outline-none focus:border-surface-3"
          {...register("email")}
        />
        {errors.email && (
          <p className="mb-3 text-xs text-danger">{errors.email.message}</p>
        )}

        <label className="mb-1 block text-xs text-muted">Password</label>
        <input
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="mb-2 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm transition-colors outline-none focus:border-surface-3"
          {...register("password")}
        />
        {errors.password ? (
          <p className="mb-4 text-xs text-danger">{errors.password.message}</p>
        ) : (
          mode === "register" && (
            <p className="mb-4 text-xs text-muted">At least 8 characters.</p>
          )
        )}

        {auth.isError && (
          <p className="mb-4 text-sm text-danger">{auth.error.message}</p>
        )}

        <Button type="submit" size="lg" disabled={auth.isPending}>
          {auth.isPending ? "…" : mode === "login" ? "Sign in" : "Create account"}
        </Button>

        <Button
          type="button"
          variant="link"
          size="lg"
          className="mt-4 text-sm text-muted hover:text-foreground"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login"
            ? "No account? Register"
            : "Already have an account? Sign in"}
        </Button>
      </form>
    </div>
  );
}
