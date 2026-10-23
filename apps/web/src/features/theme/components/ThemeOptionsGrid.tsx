import type { ThemeOption } from "@repo/contracts";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { ThemeOptionCard } from "./ThemeOptionCard";

export function ThemeOptionsGrid({
  themes,
  selectedId,
  isPending,
  onSelect,
}: {
  themes: readonly ThemeOption[];
  selectedId: string | undefined;
  isPending: boolean;
  onSelect: (id: string) => void;
}) {
  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} className="h-80 w-full" />
        ))}
      </div>
    );
  }
  if (themes.length === 0) {
    return <p className="text-sm text-muted">No themes came back. Try describing the look below.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
      {themes.map((theme) => (
        <ThemeOptionCard
          key={theme.id}
          theme={theme}
          selected={theme.id === selectedId}
          onSelect={() => onSelect(theme.id)}
        />
      ))}
    </div>
  );
}
