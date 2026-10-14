import { X } from "lucide-react";

export function AnnouncementBar({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="relative flex items-center justify-center gap-4 bg-lime px-5 py-2.5 pr-12 text-background-deep">
      <span className="text-sm font-semibold tracking-tight">
        Ship your first app free — 3 projects, unlimited previews, no card.
      </span>
      <a
        href="#pricing"
        className="rounded-full bg-background-deep px-3.5 py-1.5 text-[13px] font-bold text-lime"
      >
        Start building
      </a>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss announcement"
        className="absolute top-1/2 right-4 -translate-y-1/2 cursor-pointer text-background-deep/65 hover:text-background-deep"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
