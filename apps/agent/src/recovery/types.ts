export type RestoreOutcome =
  | { readonly kind: "intact"; readonly sha: string }
  | { readonly kind: "restored"; readonly sha: string }
  | { readonly kind: "nothing-to-restore" }
  | { readonly kind: "failed"; readonly reason: string };
