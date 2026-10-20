import { parseComponentFileAst } from "./parse-component-ast";
import type { ComponentEdge, ComponentGraph, ComponentNode } from "./types";

function computeEdges(nodes: Record<string, ComponentNode>): ComponentEdge[] {
  const edgeMap = new Map<string, number>();

  for (const node of Object.values(nodes)) {
    for (const childName of node.children) {
      if (childName in nodes) {
        const key = `${node.name}->${childName}`;
        edgeMap.set(key, (edgeMap.get(key) ?? 0) + 1);
      }
    }
  }

  const edges: ComponentEdge[] = [];
  for (const [key, count] of edgeMap.entries()) {
    const parts = key.split("->");
    const from = parts[0] ?? "";
    const to = parts[1] ?? "";
    edges.push({ from, to, usageCount: count });
  }
  return edges;
}

export function buildComponentGraph(files: readonly { path: string; content: string }[]): ComponentGraph {
  const nodes: Record<string, ComponentNode> = {};

  for (const file of files) {
    if (!/\.(tsx|jsx)$/.test(file.path)) continue;
    const fileNodes = parseComponentFileAst(file.path, file.content);
    for (const node of fileNodes) {
      nodes[node.name] = node;
    }
  }

  return {
    nodes,
    edges: computeEdges(nodes),
  };
}

export function updateComponentGraph(
  current: ComponentGraph,
  changedFiles: readonly { path: string; content: string }[],
): ComponentGraph {
  const updatedNodes = { ...current.nodes };
  const changedPaths = new Set(changedFiles.map((f) => f.path));

  for (const [name, node] of Object.entries(updatedNodes)) {
    if (changedPaths.has(node.filePath)) {
      delete updatedNodes[name];
    }
  }

  for (const file of changedFiles) {
    if (!/\.(tsx|jsx)$/.test(file.path)) continue;
    const fileNodes = parseComponentFileAst(file.path, file.content);
    for (const node of fileNodes) {
      updatedNodes[node.name] = node;
    }
  }

  return {
    nodes: updatedNodes,
    edges: computeEdges(updatedNodes),
  };
}
