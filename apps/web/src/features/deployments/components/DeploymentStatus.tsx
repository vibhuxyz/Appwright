import type { Deployment } from "../schemas/deploymentSchemas";

const host = (url: string) =>
  url.replace(/^https?:\/\//, "").replace(/\/$/, "");

function statusLabel(readyState: string): string {
  if (readyState === "READY") return "Live";
  if (readyState === "ERROR") return "Failed";
  if (readyState === "CANCELED") return "Canceled";
  return "Building…";
}

export function DeploymentStatus({ deployment }: { deployment: Deployment }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span
        className={
          deployment.readyState === "READY" ? "text-success" : "text-muted"
        }
      >
        {statusLabel(deployment.readyState)}
      </span>
      {deployment.aliasUrl && (
        <a
          href={deployment.aliasUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Production URL — the same for every deploy"
          className={
            deployment.readyState === "READY"
              ? "text-blue-bright underline"
              : "text-muted underline"
          }
        >
          {host(deployment.aliasUrl)}
        </a>
      )}
      <a
        href={deployment.url}
        target="_blank"
        rel="noopener noreferrer"
        title={`This build only — ${host(deployment.url)}`}
        className="text-muted underline"
      >
        this build
      </a>
      {deployment.errorMessage && (
        <span className="text-danger">{deployment.errorMessage}</span>
      )}
    </div>
  );
}
