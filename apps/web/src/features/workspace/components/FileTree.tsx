import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, File, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface Node {
  name: string;
  path: string;
  children?: Node[];
}

// The API hands back a flat list of paths; the tree shape is a view concern,
// so it is derived here rather than asked for from the server.
function buildTree(paths: string[]): Node[] {
  const roots: Node[] = [];

  for (const path of [...paths].sort()) {
    const parts = path.split("/");
    let level = roots;
    parts.forEach((name, i) => {
      const isLeaf = i === parts.length - 1;
      const soFar = parts.slice(0, i + 1).join("/");
      let node = level.find((n) => n.name === name && !!n.children === !isLeaf);
      if (!node) {
        node = isLeaf ? { name, path: soFar } : { name, path: soFar, children: [] };
        level.push(node);
      }
      if (!isLeaf) level = node.children!;
    });
  }

  const sort = (nodes: Node[]): Node[] =>
    nodes
      .map((n) => (n.children ? { ...n, children: sort(n.children) } : n))
      .sort((a, b) => Number(!!b.children) - Number(!!a.children) || a.name.localeCompare(b.name));

  return sort(roots);
}

const EXT_COLOR: Record<string, string> = {
  tsx: "text-blue-bright",
  jsx: "text-blue-bright",
  ts: "text-blue",
  js: "text-warning",
  css: "text-pink-light",
  json: "text-warning",
  md: "text-foreground-secondary",
  html: "text-pink",
};

function fileColor(name: string) {
  return EXT_COLOR[name.split(".").pop() ?? ""] ?? "text-muted";
}

function Row({
  node,
  depth,
  selected,
  touched,
  collapsed,
  toggle,
  onSelect,
}: {
  node: Node;
  depth: number;
  selected: string | null;
  touched: Set<string>;
  collapsed: Set<string>;
  toggle: (path: string) => void;
  onSelect: (path: string) => void;
}) {
  const isFolder = !!node.children;
  const isOpen = isFolder && !collapsed.has(node.path);
  const isSelected = selected === node.path;

  return (
    <>
      <button
        type="button"
        onClick={() => (isFolder ? toggle(node.path) : onSelect(node.path))}
        style={{ paddingLeft: 8 + depth * 14 }}
        className={cn(
          "flex w-full cursor-pointer items-center gap-1.5 rounded-lg py-[5px] pr-2 text-[13px] transition-colors",
          isSelected
            ? "bg-surface-3 text-foreground"
            : "text-foreground-secondary hover:bg-surface-2",
        )}
      >
        {isFolder ? (
          <>
            {isOpen ? (
              <ChevronDown className="size-3.5 shrink-0 text-muted" />
            ) : (
              <ChevronRight className="size-3.5 shrink-0 text-muted" />
            )}
            {isOpen ? (
              <FolderOpen className="size-4 shrink-0 text-muted" />
            ) : (
              <Folder className="size-4 shrink-0 text-muted" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5 shrink-0" />
            <File className={cn("size-4 shrink-0", fileColor(node.name))} />
          </>
        )}
        <span className="truncate">{node.name}</span>
        {touched.has(node.path) && (
          <span className="ml-auto size-1.5 shrink-0 rounded-full bg-lime" title="Changed by the agent" />
        )}
      </button>

      {isFolder &&
        isOpen &&
        node.children!.map((child) => (
          <Row
            key={child.path}
            node={child}
            depth={depth + 1}
            selected={selected}
            touched={touched}
            collapsed={collapsed}
            toggle={toggle}
            onSelect={onSelect}
          />
        ))}
    </>
  );
}

export function FileTree({
  paths,
  selected,
  touched,
  onSelect,
}: {
  paths: string[];
  selected: string | null;
  touched: Set<string>;
  onSelect: (path: string) => void;
}) {
  const tree = useMemo(() => buildTree(paths), [paths]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (path: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (!next.delete(path)) next.add(path);
      return next;
    });

  if (paths.length === 0) {
    return <div className="p-4 text-[13px] text-muted">No files yet.</div>;
  }

  return (
    <div className="flex-1 overflow-auto p-1.5">
      {tree.map((node) => (
        <Row
          key={node.path}
          node={node}
          depth={0}
          selected={selected}
          touched={touched}
          collapsed={collapsed}
          toggle={toggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
