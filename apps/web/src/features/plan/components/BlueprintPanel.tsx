import { useState } from "react";
import { Blocks } from "lucide-react";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { Button } from "@/shared/components/ui/Button";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { useBlueprint } from "../hooks/use-blueprint";
import { summarizeBlueprint } from "../lib/blueprint-summary";

export function BlueprintPanel({ blueprintId }: { blueprintId: string }) {
  const { data: blueprint, isPending, error } = useBlueprint(blueprintId);
  const [isRawVisible, setIsRawVisible] = useState(false);

  return (
    <Panel>
      <PanelHeader
        icon={<Blocks className="size-4 text-muted" aria-hidden />}
        title="Blueprint"
        badge={blueprint && <span className="text-xs text-muted">v{blueprint.blueprintVersion}</span>}
        actions={
          blueprint && (
            <Button
              variant="outline"
              size="sm"
              aria-pressed={isRawVisible}
              onClick={() => setIsRawVisible((visible) => !visible)}
            >
              {isRawVisible ? "Summary" : "Raw JSON"}
            </Button>
          )
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isPending && <Skeleton className="h-24" />}
        {error && <p className="text-sm text-danger">{error.message}</p>}
        {blueprint && isRawVisible && (
          <pre className="overflow-x-auto rounded-lg bg-surface-2 p-3 font-mono text-xs whitespace-pre-wrap text-foreground-secondary">
            {JSON.stringify(blueprint, null, 2)}
          </pre>
        )}
        {blueprint && !isRawVisible && (
          <dl className="flex flex-col gap-2.5 text-sm">
            {summarizeBlueprint(blueprint).map((line) => (
              <div key={line.label}>
                <dt className="text-xs text-muted">{line.label}</dt>
                <dd className="text-foreground">{line.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Panel>
  );
}
