import { Monitor, Smartphone, Tablet } from "lucide-react";
import type { PreviewDevice } from "@/stores/workspaceStore";
import { cn } from "@/shared/lib/cn";

const DEVICES: { id: PreviewDevice; icon: typeof Monitor; label: string }[] = [
  { id: "desktop", icon: Monitor, label: "Desktop" },
  { id: "mobile", icon: Smartphone, label: "Mobile (iPhone)" },
  { id: "tablet", icon: Tablet, label: "Tablet (iPad)" },
];

interface DeviceSwitcherProps {
  device: PreviewDevice;
  onSelect: (device: PreviewDevice) => void;
}

export function DeviceSwitcher({ device, onSelect }: DeviceSwitcherProps) {
  return (
    <div className="ml-1 flex items-center gap-0.5 rounded-lg border border-border-soft bg-surface-2 p-0.5">
      {DEVICES.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          title={label}
          onClick={() => onSelect(id)}
          className={cn(
            "grid size-7 cursor-pointer place-items-center rounded-md transition-colors",
            device === id
              ? "bg-surface-3 text-foreground"
              : "text-muted hover:text-foreground-secondary",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}
