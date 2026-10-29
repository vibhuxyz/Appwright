import { Eye, Upload } from "lucide-react";
import { useConnectVercel, useDeploy, useVercelStatus } from "@/features/deployments/hooks/useDeployment";
import { useWorkspaceStore } from "@/stores/workspaceStore";

export function SummaryCard({
  title,
  bullets,
  note,
  projectId,
}: {
  title: string;
  bullets: readonly string[];
  note?: string;
  projectId?: string;
}) {
  const setActiveTab = useWorkspaceStore((state) => state.setActiveTab);
  return (
    <div className="max-w-xl space-y-3">
      <h3 className="text-[15px] font-semibold text-foreground">{title}</h3>
      {bullets.length > 0 && (
        <ul className="list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-foreground-secondary">
          {bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
        </ul>
      )}
      {note ? <p className="text-[13px] leading-relaxed text-foreground-secondary">Note: {note}</p> : null}
      <div className="flex gap-2">
        {projectId ? <PublishAction projectId={projectId} /> : null}
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-surface-3 px-3 py-1.5 text-[13px] font-medium text-foreground"
        >
          <Eye aria-hidden="true" className="size-3.5" /> Preview
        </button>
      </div>
    </div>
  );
}

function PublishAction({ projectId }: { projectId: string }) {
  const { data: vercelStatus } = useVercelStatus();
  const connect = useConnectVercel();
  const deploy = useDeploy(projectId);
  const isConnected = vercelStatus?.connected === true;
  const isPending = connect.isPending || deploy.isPending;
  return (
    <button
      type="button"
      disabled={vercelStatus === undefined || isPending}
      onClick={() => {
        if (!isConnected) {
          connect.mutate(projectId);
          return;
        }
        deploy.mutate();
      }}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-info px-3 py-1.5 text-[13px] font-medium text-background disabled:opacity-60"
    >
      <Upload aria-hidden="true" className="size-3.5" /> {isPending ? "Publishing…" : "Publish"}
    </button>
  );
}
