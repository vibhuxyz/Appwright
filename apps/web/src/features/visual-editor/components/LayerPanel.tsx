import { Layers } from "lucide-react";
import { Panel, PanelHeader } from "@/shared/components/ui/Panel";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { buildComponentTree } from "../lib/component-tree";
import { useComponents } from "../hooks/use-components";
import { LayerNode } from "./LayerNode";

export function LayerPanel({ projectId }: { projectId: string }) {
  const { data, isPending, error } = useComponents(projectId);
  const tree = data ? buildComponentTree(data) : [];

  return (
    <Panel className="w-64 shrink-0">
      <PanelHeader icon={<Layers className="size-4 text-muted" aria-hidden />} title="Layers" />
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {isPending && <Skeleton className="h-24" />}
        {error && <p className="p-2 text-sm text-danger">{error.message}</p>}
        {data && tree.length === 0 && (
          <p className="p-2 text-sm text-muted">No components found in this project yet.</p>
        )}
        <ul role="tree" aria-label="Component layers">
          {tree.map((root) => (
            <LayerNode key={root.node.id} tree={root} depth={0} />
          ))}
        </ul>
      </div>
    </Panel>
  );
}
