import type { Entity } from "@repo/contracts";
import type { ProjectTemplate } from "../types";

const LEDGER_ENTRY: Entity = {
  name: "LedgerEntry",
  fields: [
    { name: "amountMinor", type: "Int", required: true, unique: false },
    { name: "currency", type: "String", required: true, unique: false },
    { name: "kind", type: "String", required: true, unique: false },
    { name: "idempotencyKey", type: "String", required: true, unique: true },
    { name: "createdAt", type: "DateTime", required: true, unique: false },
  ],
  relations: [],
};

export const walletTemplate: ProjectTemplate = () => ({
  pages: [],
  entities: [LEDGER_ENTRY],
  features: ["auth"],
  acceptance: {
    security: [
      "Money is stored as integer minor units with a currency, never as floats",
      "Balance changes are append-only ledger rows; mistakes are fixed with reversing entries",
      "Every money-moving request accepts an idempotency key",
    ],
    testing: ["Duplicate and concurrent requests with the same idempotency key apply once"],
  },
});
