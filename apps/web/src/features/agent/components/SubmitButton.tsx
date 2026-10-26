import { Play, Square } from "lucide-react";

export function SubmitButton({
  running,
  disabled,
  onSubmit,
  onStop,
}: {
  running: boolean;
  disabled: boolean;
  onSubmit: () => void;
  onStop: () => void;
}) {
  if (running) {
    return (
      <button
        type="button"
        onClick={onStop}
        title="Stop AI execution"
        className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#E3FC18] px-3.5 py-1.5 text-xs font-semibold text-background transition-all hover:brightness-105 active:scale-95"
      >
        <Square className="size-3 fill-current" />
        <span>Stop</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onSubmit}
      disabled={disabled}
      title="Send — Enter"
      className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#C16848] px-3.5 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-[#D27655] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Play className="size-3 fill-current" />
      <span>Send</span>
    </button>
  );
}
