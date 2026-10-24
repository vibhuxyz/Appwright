import { useEffect, useState } from "react";
import { Palette } from "lucide-react";
import { googleFontsUrl, type ThemeOption, type ThemeOptionsRequest } from "@repo/contracts";
import { Button } from "@/shared/components/ui/Button";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { useThemeOptions } from "../hooks/use-theme-options";
import { ThemeCustomControls } from "./ThemeCustomControls";
import { ThemeOptionsGrid } from "./ThemeOptionsGrid";

export function ThemePicker({
  request,
  isSubmitting,
  onChoose,
}: {
  request: ThemeOptionsRequest;
  isSubmitting: boolean;
  onChoose: (theme: ThemeOption) => void;
}) {
  const [overrides, setOverrides] = useState<Pick<ThemeOptionsRequest, "description" | "referenceColors">>({});
  const query = useThemeOptions({ ...request, ...overrides });
  const themes = query.data?.themes ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = themes.find((theme) => theme.id === selectedId) ?? themes[0];
  const fontUrl =
    themes.length > 0
      ? googleFontsUrl(themes.flatMap((theme) => [theme.fonts.heading, theme.fonts.body]))
      : null;

  useEffect(() => {
    if (!fontUrl) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontUrl;
    document.head.append(link);
    return () => link.remove();
  }, [fontUrl]);

  return (
    <Panel>
      <PanelHeader
        icon={<Palette className="size-4 text-muted" aria-hidden />}
        title="Pick a design system"
      />
      <div className="flex flex-col gap-3 p-4">
        <p className="text-sm text-muted">
          {query.data?.source === "preset"
            ? "Starter design systems for this brief. Scroll each one, or describe a look below to generate a new set."
            : "Five full design systems from your prompt and answers. Scroll each one: colour, contrast, type, radius, live components, and rules."}
        </p>
        {query.isError ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-danger">
              {query.error instanceof Error ? query.error.message : "Could not design themes."}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => void query.refetch()}>
              Try again
            </Button>
          </div>
        ) : (
          <ThemeOptionsGrid
            themes={themes}
            selectedId={selected?.id}
            isPending={query.isPending}
            onSelect={setSelectedId}
          />
        )}
        <ThemeCustomControls
          disabled={query.isPending || isSubmitting}
          onApply={(next) => {
            setSelectedId(null);
            setOverrides(next);
          }}
        />
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={!selected || isSubmitting || query.isPending}
            onClick={() => selected && onChoose(selected)}
          >
            {isSubmitting ? "Saving theme…" : "Use this theme"}
          </Button>
        </div>
      </div>
    </Panel>
  );
}
