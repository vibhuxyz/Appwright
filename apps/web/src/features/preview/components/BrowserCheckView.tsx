import { useBrowserLive } from "../hooks/use-browser-live";
import { PreviewLoadingState } from "./PreviewLoadingState";

interface BrowserCheckViewProps {
  sessionId: string;
  label: string;
}

export function BrowserCheckView({ sessionId, label }: BrowserCheckViewProps) {
  const { src, error } = useBrowserLive(sessionId);
  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-background">
      <p className="flex items-center gap-2 border-b border-border-soft px-3 py-2 text-xs text-foreground-secondary">
        <span className="size-1.5 shrink-0 animate-pulse rounded-full bg-lime" />
        <span className="truncate" aria-live="polite">{label}</span>
      </p>
      {src ? (
        <img
          src={src}
          alt="Live browser check"
          draggable={false}
          className="min-h-0 flex-1 bg-background object-contain"
        />
      ) : (
        <PreviewLoadingState
          title="Opening the check browser…"
          subtitle={error ?? "Scrolls, clicks, and form fills show up here as they happen."}
        />
      )}
    </div>
  );
}
