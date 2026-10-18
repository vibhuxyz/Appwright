export interface TaskGraphNode {
  id: string;
  owns: string[];
  reads: string[];
}

export interface ComputedEdges {
  dependsOn: Map<string, string[]>;
  ownershipConflicts: [string, string][];
}

export class CycleDetectedError extends Error {
  constructor(public readonly cycleMembers: string[]) {
    super(`Dependency cycle detected among tasks: ${cycleMembers.join(", ")}`);
    this.name = "CycleDetectedError";
  }
}
