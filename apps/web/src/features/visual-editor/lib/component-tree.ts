import type { ComponentNode } from "../schemas/editor-schemas";

export interface TreeNode {
  readonly node: ComponentNode;
  readonly children: readonly TreeNode[];
}

export function buildComponentTree(components: readonly ComponentNode[]): readonly TreeNode[] {
  const ids = new Set(components.map((component) => component.id));
  const childrenByParent = new Map<string | null, ComponentNode[]>();
  for (const component of [...components].sort((a, b) => a.id.localeCompare(b.id))) {
    const parentKey = component.parentId !== null && ids.has(component.parentId) ? component.parentId : null;
    childrenByParent.set(parentKey, [...(childrenByParent.get(parentKey) ?? []), component]);
  }
  const visited = new Set<string>();
  const toTree = (parent: ComponentNode): TreeNode => {
    visited.add(parent.id);
    const children = (childrenByParent.get(parent.id) ?? []).filter((child) => !visited.has(child.id));
    return { node: parent, children: children.map(toTree) };
  };
  return (childrenByParent.get(null) ?? []).map(toTree);
}
