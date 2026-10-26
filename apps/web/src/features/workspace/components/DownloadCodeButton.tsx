import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { workspaceApi } from "../api/workspaceApi";

export function DownloadCodeButton({
  projectId,
  sessionId,
  projectName,
  onUpgrade,
}: {
  projectId: string;
  sessionId?: string;
  projectName?: string;
  onUpgrade: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const [isDownloading, setIsDownloading] = useState(false);
  const isFree = user?.plan === "FREE";

  const handleDownload = async () => {
    if (isFree) {
      onUpgrade();
      return;
    }

    setIsDownloading(true);
    try {
      const safeName = (projectName || "project")
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "-");
      await workspaceApi.downloadProject(projectId, sessionId, `${safeName}.zip`);
    } catch (err) {
      console.error("Codebase download failed:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const label = isFree ? "Upgrade to Pro to download codebase" : "Download project codebase (.zip)";

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDownloading}
      title={label}
      aria-label={label}
      className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg border border-border-soft bg-surface-2 text-lime transition-colors hover:border-lime/60 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isDownloading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
    </button>
  );
}
