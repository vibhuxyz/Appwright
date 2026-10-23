import type { UpgradePlanRequest } from "@repo/contracts";
import { httpClient } from "@/shared/lib/httpClient";
import {
  addCreditsResponseSchema,
  creditsResponseSchema,
  upgradePlanResponseSchema,
} from "../schemas/billingSchemas";

export const billingApi = {
  getCredits: () =>
    httpClient.get("/user/credits").then(creditsResponseSchema.parse),
  addCredits: (amount: number) =>
    httpClient
      .post("/user/credits/add", { amount })
      .then(addCreditsResponseSchema.parse),
  upgradePlan: (request: UpgradePlanRequest) =>
    httpClient.post("/user/plan", request).then(upgradePlanResponseSchema.parse),
};
