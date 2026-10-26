import type { KeyboardEvent, MouseEvent, ReactNode, RefObject } from "react";

interface IntegrationDialogFrameProps {
  title: ReactNode;
  description: string;
  instructions: readonly string[];
  dialogRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
}

function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>, onClose: () => void) {
  if (event.key === "Escape") onClose();
  if (event.key !== "Tab") return;
  const focusable = event.currentTarget.querySelectorAll<HTMLElement>(
    "button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex='-1'])",
  );
  const first = focusable.item(0);
  const last = focusable.item(focusable.length - 1);
  if (!first || !last) return;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function stopDialogClose(event: MouseEvent<HTMLElement>) {
  event.stopPropagation();
}

export function IntegrationDialogFrame({
  title,
  description,
  instructions,
  dialogRef,
  onClose,
  children,
}: IntegrationDialogFrameProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="integration-setup-title"
        ref={dialogRef}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl"
        onMouseDown={stopDialogClose}
        onKeyDown={(event) => handleDialogKeyDown(event, onClose)}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="integration-setup-title" className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted">{description}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted">
              {instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}
            </ul>
          </div>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label="Close setup"
            className="rounded-md px-2 py-1 text-muted hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-lime"
          >×</button>
        </div>
        {children}
      </section>
    </div>
  );
}
