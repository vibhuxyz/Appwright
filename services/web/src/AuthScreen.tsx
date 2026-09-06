import { useState } from "react";
import { api, setToken, type User } from "./api";

type Mode = "login" | "register";

export function AuthScreen({ onAuthed }: { onAuthed: (user: User) => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result =
        mode === "login"
          ? await api.login(email.trim(), password)
          : await api.register(email.trim(), password);
      setToken(result.token);
      onAuthed(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-zinc-100">
      <form onSubmit={submit} className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold">Appwright</h1>
        <p className="mb-6 text-sm text-zinc-500">
          {mode === "login" ? "Sign in to your projects." : "Create an account to get started."}
        </p>

        <label className="mb-1 block text-xs text-zinc-400">Email</label>
        <input
          type="email"
          autoComplete="email"
          required
          className="mb-4 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="mb-1 block text-xs text-zinc-400">Password</label>
        <input
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          minLength={8}
          className="mb-2 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none focus:border-zinc-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {mode === "register" && (
          <p className="mb-4 text-xs text-zinc-500">At least 8 characters.</p>
        )}

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded bg-blue-600 px-4 py-2 font-medium disabled:opacity-50"
        >
          {busy ? "…" : mode === "login" ? "Sign in" : "Create account"}
        </button>

        <button
          type="button"
          className="mt-4 w-full text-sm text-zinc-400 hover:text-zinc-200"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
        >
          {mode === "login" ? "No account? Register" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
