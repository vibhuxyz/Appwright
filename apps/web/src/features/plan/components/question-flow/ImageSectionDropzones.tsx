import { useState, type DragEvent } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import { Button } from "@/shared/components/ui/Button";
import { cn } from "@/shared/lib/cn";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_EXTENSION = /\.(png|jpe?g)$/i;
const IMAGE_RULE = "Upload a PNG, JPEG, or JPG under 5 MB.";

interface ImageSectionDropzonesProps {
  sections: readonly string[];
  isSubmitting: boolean;
  onContinue: (value: string) => void;
}

interface SlotState {
  file: File | null;
  previewUrl: string | null;
  error: string | null;
}

function emptySlots(sections: readonly string[]): Record<string, SlotState> {
  return Object.fromEntries(
    sections.map((section) => [section, { file: null, previewUrl: null, error: null }]),
  );
}

function clipName(name: string): string {
  if (name.length <= 24) return name;
  const extIndex = name.lastIndexOf(".");
  const ext = extIndex >= 0 ? name.slice(extIndex) : "";
  return `${name.slice(0, Math.max(8, 24 - ext.length - 1))}…${ext}`;
}

export function encodeImageAnswer(
  sections: readonly string[],
  slots: Readonly<Record<string, SlotState>>,
): string {
  const parts = sections.map((section) => {
    const file = slots[section]?.file;
    return `${section}: ${file ? clipName(file.name) : "generate"}`;
  });
  const joined = parts.join("; ");
  if (joined.length <= 200) return joined;
  const uploaded = sections.filter((section) => slots[section]?.file).length;
  return `${uploaded} uploaded, rest generate`;
}

function readDroppedFile(event: DragEvent<HTMLElement>): File | null {
  const file = event.dataTransfer.files.item(0);
  return file ?? null;
}

export function ImageSectionDropzones({
  sections,
  isSubmitting,
  onContinue,
}: ImageSectionDropzonesProps) {
  const [slots, setSlots] = useState(() => emptySlots(sections));

  const assignFile = (section: string, file: File | null) => {
    setSlots((current) => {
      const previous = current[section];
      if (previous?.previewUrl) URL.revokeObjectURL(previous.previewUrl);
      if (!file) {
        return { ...current, [section]: { file: null, previewUrl: null, error: null } };
      }
      const typeOk =
        ACCEPTED_IMAGE_TYPES.includes(file.type) ||
        (file.type === "" && IMAGE_EXTENSION.test(file.name));
      if (!typeOk) {
        return {
          ...current,
          [section]: { file: null, previewUrl: null, error: IMAGE_RULE },
        };
      }
      if (file.size > MAX_IMAGE_BYTES) {
        return {
          ...current,
          [section]: { file: null, previewUrl: null, error: `That file is over 5 MB. ${IMAGE_RULE}` },
        };
      }
      return {
        ...current,
        [section]: { file, previewUrl: URL.createObjectURL(file), error: null },
      };
    });
  };

  return (
    <div className="flex flex-col gap-3 border-t border-border-soft p-3">
      <p className="text-xs text-muted">
        Drop a PNG, JPEG, or JPG on a section, up to 5 MB, or choose one from your computer. Empty
        boxes are generated to match that section.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {sections.map((section) => {
          const slot = slots[section] ?? { file: null, previewUrl: null, error: null };
          const inputId = `section-image-${section.replace(/[^a-z0-9]+/gi, "-")}`;
          return (
            <div key={section} className="flex flex-col gap-1">
              <label
                htmlFor={inputId}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (isSubmitting) return;
                  assignFile(section, readDroppedFile(event));
                }}
                className={cn(
                  "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-surface-2 px-3 py-4 text-center transition hover:bg-surface-3",
                  slot.file && "border-solid border-lime/40",
                  isSubmitting && "pointer-events-none opacity-50",
                )}
              >
                {slot.previewUrl ? (
                  <img
                    src={slot.previewUrl}
                    alt={`${section} preview`}
                    width={160}
                    height={96}
                    className="h-16 w-full rounded-lg object-cover"
                  />
                ) : (
                  <ImagePlus className="size-5 text-muted" aria-hidden />
                )}
                <span className="text-xs font-medium text-foreground">{section}</span>
                <span className="text-[11px] text-muted">
                  {slot.file ? clipName(slot.file.name) : "Drop or choose a photo"}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-foreground-secondary">
                  <Upload className="size-3" aria-hidden />
                  Choose from computer
                </span>
                <input
                  id={inputId}
                  type="file"
                  accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                  className="sr-only"
                  disabled={isSubmitting}
                  onChange={(event) => {
                    assignFile(section, event.target.files?.item(0) ?? null);
                    event.target.value = "";
                  }}
                />
              </label>
              {slot.file && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 self-start text-[11px] text-muted hover:text-foreground"
                  disabled={isSubmitting}
                  onClick={() => assignFile(section, null)}
                >
                  <X className="size-3" aria-hidden />
                  Remove
                </button>
              )}
              {slot.error && (
                <p className="text-[11px] text-danger" role="alert">
                  {slot.error}
                </p>
              )}
            </div>
          );
        })}
      </div>
      <Button
        type="button"
        size="sm"
        disabled={isSubmitting}
        onClick={() => onContinue(encodeImageAnswer(sections, slots))}
      >
        Continue
      </Button>
    </div>
  );
}
