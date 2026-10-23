export type ResourceKind = "file" | "db" | "port" | "env";

export interface CanonicalResource {
  kind: ResourceKind;
  value: string;
}

export class InvalidOwnershipDeclarationError extends Error {
  constructor(raw: string, reason: string) {
    super(`Invalid ownership declaration "${raw}": ${reason}`);
    this.name = "InvalidOwnershipDeclarationError";
  }
}
