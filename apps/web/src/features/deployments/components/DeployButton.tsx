import { useState, type ReactNode } from "react";
import {
  useConnectVercel,
  useDeploy,
  useDeploymentStatus,
  useVercelStatus,
} from "../hooks/useDeployment";
import { DeploymentStatus } from "./DeploymentStatus";
import { Button } from "@/shared/components/ui/Button";

// Shipping to production is the "premium" moment in the product — it is the
// one place outside billing where pink is the right color.
export function DeployButton({ projectId, icon }: { projectId: string; icon?: ReactNode }) {
  const { data: vercelStatus } = useVercelStatus();
  const connectVercel = useConnectVercel();
  const deploy = useDeploy(projectId);
  const [deploymentId, setDeploymentId] = useState<string>();
  const { data: deployment } = useDeploymentStatus(projectId, deploymentId);

  if (vercelStatus === undefined) return null;

  if (!vercelStatus.connected) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="premium"
          size="md"
          className="gap-2 px-5 py-2 text-[13px]"
          onClick={() => connectVercel.mutate(projectId)}
          disabled={connectVercel.isPending}
        >
          {icon}
          {connectVercel.isPending ? "Opening…" : "Connect Vercel"}
        </Button>
        {connectVercel.isError && (
          <span className="text-xs text-danger">{connectVercel.error.message}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="premium"
        size="md"
        className="gap-2 px-5 py-2 text-[13px]"
        onClick={() =>
          deploy.mutate(undefined, {
            onSuccess: (d) => setDeploymentId(d.id),
          })
        }
        disabled={deploy.isPending}
      >
        {icon}
        {deploy.isPending ? "Deploying…" : "Deploy"}
      </Button>
      {deployment && <DeploymentStatus deployment={deployment} />}
      {deploy.isError && <span className="text-xs text-danger">{deploy.error.message}</span>}
    </div>
  );
}
