import { Database, AlertCircle, Sparkles } from "lucide-react";

export function DatabaseEmptyState({
  templateId,
  isFailed,
  isReady = true,
  errorMessage,
  onRetry,
}: {
  templateId?: string;
  isFailed?: boolean;
  isReady?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}) {
  const isClientOnly = templateId === "vite-react";

  return (
    <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-[#121622]/60 p-8 text-center">
      <div className="grid size-14 place-items-center rounded-2xl border border-border/80 bg-surface text-muted">
        {isFailed ? (
          <AlertCircle className="size-6 text-rose-400" />
        ) : (
          <Database className="size-6 text-amber-400" />
        )}
      </div>

      <h3 className="mt-4 text-base font-bold text-white">
        {isFailed
          ? "Database Provisioning Issue"
          : isClientOnly
            ? "Frontend-Only Project Template"
            : isReady
              ? "No Database Collections Configured"
              : "No Database Yet"}
      </h3>

      <p className="mt-2 max-w-md text-xs text-muted">
        {isFailed
          ? errorMessage ?? "Could not connect or provision the MongoDB database for this project."
          : isClientOnly
            ? "This project was initialized with Vite + React. To use a database, create a project with Next.js Fullstack or ask the AI agent to integrate backend endpoints."
            : isReady
              ? "Your MongoDB database is provisioned and ready. As the agent builds your models and runs seed scripts, your tables and collections will automatically populate here."
              : "This app has no database yet. It is created automatically the first time the app stores data, and its collections will appear here."}
      </p>

      {isFailed && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-xl bg-lime px-4 py-2 text-xs font-bold text-black shadow-md hover:bg-lime/90"
        >
          Retry Provisioning
        </button>
      )}

      {isClientOnly && (
        <div className="mt-5 flex items-center gap-1.5 rounded-full border border-lime/30 bg-lime/10 px-3 py-1 text-xs font-semibold text-lime">
          <Sparkles className="size-3.5" />
          <span>Fullstack Next.js includes MongoDB automatically</span>
        </div>
      )}
    </div>
  );
}
