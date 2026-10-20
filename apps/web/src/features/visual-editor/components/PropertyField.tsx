import { useId, useState } from "react";
import { describeTokenFit, parsePixels, snapToScale } from "../lib/token-scale";

interface PropertyFieldProps {
  property: string;
  currentValue: string;
  isChanged: boolean;
  onCommit: (value: string) => void;
  onRevert: () => void;
}

const FIT_LABEL = { token: "token", raw: "raw value", free: "" } as const;

export function PropertyField({ property, currentValue, isChanged, onCommit, onRevert }: PropertyFieldProps) {
  const inputId = useId();
  const [draft, setDraft] = useState<{ source: string; text: string }>({ source: currentValue, text: currentValue });
  const text = draft.source === currentValue ? draft.text : currentValue;
  const [isRawAllowed, setIsRawAllowed] = useState(false);
  const fit = describeTokenFit(property, text);

  const commit = () => {
    const pixels = parsePixels(text);
    const value =
      pixels !== null && !isRawAllowed ? `${snapToScale(property, pixels)}px` : text.trim();
    setDraft({ source: currentValue, text: value });
    if (value !== currentValue) onCommit(value);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-1">
      <label htmlFor={inputId} className="w-28 shrink-0 text-xs text-foreground-secondary">
        {property}
      </label>
      <input
        id={inputId}
        value={text}
        onChange={(event) => setDraft({ source: currentValue, text: event.target.value })}
        onBlur={commit}
        onKeyDown={(event) => event.key === "Enter" && commit()}
        className="min-w-0 flex-1 rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-foreground"
      />
      <label className="flex items-center gap-1 text-[11px] text-muted">
        <input
          type="checkbox"
          checked={isRawAllowed}
          onChange={(event) => setIsRawAllowed(event.target.checked)}
        />
        raw
      </label>
      {fit !== "free" && <span className="w-14 text-[11px] text-muted">{FIT_LABEL[fit]}</span>}
      {isChanged && (
        <button type="button" onClick={onRevert} aria-label={`Revert ${property}`} className="text-xs text-muted hover:text-foreground">
          ↺
        </button>
      )}
    </div>
  );
}
