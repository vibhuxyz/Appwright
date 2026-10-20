export interface ComponentNode {
  name: string;
  filePath: string;
  isDefaultExport: boolean;
  isNamedExport: boolean;
  children: string[];
  props: string[];
}

export interface ComponentEdge {
  from: string;
  to: string;
  usageCount: number;
}

export interface ComponentGraph {
  nodes: Record<string, ComponentNode>;
  edges: ComponentEdge[];
}
