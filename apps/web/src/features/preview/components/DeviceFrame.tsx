import type { ReactNode } from "react";
import { Wifi } from "lucide-react";
import type { PreviewDevice } from "@/stores/workspaceStore";

function IPhone15StatusBar() {
  return (
    <div className="relative flex h-11 w-full shrink-0 items-center justify-between bg-black px-6 select-none">
      {/* Time */}
      <span className="font-mono text-xs font-semibold tracking-tight text-white">
        9:41
      </span>

      {/* iPhone 15 Dynamic Island */}
      <div className="flex h-7 w-28 items-center justify-between rounded-full bg-[#08080A] px-2.5 shadow-inner ring-1 ring-white/10">
        <span className="size-2.5 rounded-full bg-[#121316] ring-1 ring-white/15" />
        <span className="size-2 rounded-full bg-[#0A1A2F]" />
      </div>

      {/* Status Icons */}
      <div className="flex items-center gap-1.5 text-white">
        {/* Signal */}
        <div className="flex h-2.5 items-end gap-0.5">
          <span className="h-1 w-0.5 rounded-xs bg-white" />
          <span className="h-1.5 w-0.5 rounded-xs bg-white" />
          <span className="h-2 w-0.5 rounded-xs bg-white" />
          <span className="h-2.5 w-0.5 rounded-xs bg-white" />
        </div>
        {/* WiFi */}
        <Wifi className="size-3 text-white" />
        {/* Battery */}
        <div className="flex items-center">
          <div className="flex h-2.5 w-5 items-center rounded-xs border border-white/80 p-0.5">
            <div className="size-full rounded-[1px] bg-white" />
          </div>
          <div className="h-1.5 w-0.5 rounded-r-xs bg-white/80" />
        </div>
      </div>
    </div>
  );
}

function IPadStatusBar() {
  return (
    <div className="relative flex h-7 w-full shrink-0 items-center justify-between bg-black px-4 text-[11px] text-white/80 select-none">
      <span>9:41</span>
      {/* iPad Camera dot */}
      <span className="size-2.5 rounded-full bg-[#121316] ring-1 ring-white/15" />
      <div className="flex items-center gap-1.5">
        <Wifi className="size-3 text-white/80" />
        <div className="flex items-center">
          <div className="flex h-2 w-4.5 items-center rounded-xs border border-white/70 p-0.5">
            <div className="size-full rounded-[1px] bg-white/80" />
          </div>
          <div className="h-1 w-0.5 rounded-r-xs bg-white/70" />
        </div>
      </div>
    </div>
  );
}

export function DeviceFrame({
  device,
  children,
}: {
  device: PreviewDevice;
  children: ReactNode;
}) {
  if (device === "desktop") {
    return <div className="size-full overflow-hidden">{children}</div>;
  }

  if (device === "mobile") {
    return (
      <div className="flex min-h-full w-full items-start justify-center p-6 sm:items-center">
        {/* iPhone 15 frame */}
        <div className="relative flex h-205 w-[393px] shrink-0 flex-col overflow-hidden rounded-[50px] border-8 border-[#1F232B] bg-black shadow-2xl ring-1 shadow-black ring-white/10">
          <IPhone15StatusBar />
          {/* Screen area */}
          <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-background">
            {children}
          </div>
          {/* Home indicator */}
          <div className="flex h-5 shrink-0 items-center justify-center bg-black select-none">
            <div className="h-1 w-32 rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    );
  }

  // Tablet / iPad frame
  return (
    <div className="flex min-h-full w-full items-start justify-center p-6 sm:items-center">
      {/* iPad chassis */}
      <div className="relative flex h-205 w-3xl max-w-full shrink-0 flex-col overflow-hidden rounded-[36px] border-10 border-[#1F232B] bg-black shadow-2xl ring-1 shadow-black ring-white/10">
        <IPadStatusBar />
        {/* Screen area */}
        <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-background">
          {children}
        </div>
        {/* Home indicator */}
        <div className="flex h-4 shrink-0 items-center justify-center bg-black select-none">
          <div className="h-1 w-36 rounded-full bg-white/40" />
        </div>
      </div>
    </div>
  );
}
