import { cn } from "@/shared/lib/cn";
import type { TreeNode } from "../lib/component-tree";
import { useDesignState } from "../store/design-state";

const INDENT_REM = 0.75;

export function LayerNode({ tree, depth }: { tree: TreeNode; depth: number }) {
  const isSelected = useDesignState((s) => s.selectedId === tree.node.id);
  const select = useDesignState((s) => s.select);

  return (
    <li role="treeitem" aria-selected={isSelected} aria-expanded={tree.children.length > 0 || undefined}>
      <button
        type="button"
        onClick={() => select(tree.node.id)}
        style={{ paddingLeft: `${depth * INDENT_REM + 0.5}rem` }}
        className={cn(
          "w-full truncate rounded-md py-1 pr-2 text-left text-xs",
          isSelected ? "bg-surface-3 text-foreground" : "text-foreground-secondary hover:bg-surface-2",
        )}
      >
        {tree.node.id}
      </button>
      {tree.children.length > 0 && (
        <ul role="group">
          {tree.children.map((child) => (
            <LayerNode key={child.node.id} tree={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}
