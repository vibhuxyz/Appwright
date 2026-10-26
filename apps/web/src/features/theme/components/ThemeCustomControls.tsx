import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { readImageColors } from "../lib/read-image-colors";

export function ThemeCustomControls({
  disabled,
  onApply,
}: {
  disabled: boolean;
  onApply: (input: { description?: string; referenceColors?: string[] }) => void;
}) {
  const [description, setDescription] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [colors, setColors] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const apply = () => {
    const trimmed = description.trim();
    if (!trimmed && colors.length === 0) {
      setError("Describe the look you want, or upload a brand image.");
      return;
    }
    setError(null);
    onApply({
      ...(trimmed ? { description: trimmed } : {}),
      ...(colors.length > 0 ? { referenceColors: colors } : {}),
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-soft p-3">
      <p className="text-xs text-muted">
        Want something else? Describe it, or upload a logo or photo. We generate four new systems from that.
      </p>
      <label className="flex flex-col gap-1 text-xs text-muted">
        Describe the look
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={400}
          rows={2}
          disabled={disabled}
          placeholder="Warm bakery, cream paper, dark chocolate headings…"
          className="resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-lime"
        />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            void readImageColors(file)
              .then((next) => {
                setFileName(file.name);
                setColors(next);
                setError(null);
              })
              .catch((cause: unknown) => {
                setError(cause instanceof Error ? cause.message : "Could not read that image.");
              });
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="size-3.5" aria-hidden />
          Upload image
        </Button>
        {fileName && <span className="text-[11px] text-muted">{fileName}</span>}
        {colors.map((color) => (
          <span
            key={color}
            className="size-4 rounded-full border border-border"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        <Button type="button" size="sm" disabled={disabled} onClick={apply}>
          Generate from this
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
