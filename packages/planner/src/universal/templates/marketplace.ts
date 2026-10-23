import type { ProjectTemplate } from "../types";

export const marketplaceTemplate: ProjectTemplate = (_blueprint, scope) => ({
  pages: [],
  entities: [],
  features: scope.isBrowseOnly ? ["auth"] : ["auth", "payments"],
  acceptance: {
    admin: ["Admins moderate sellers and listings"],
    security: [
      "Sellers can only modify their own listings",
      ...(scope.isBrowseOnly
        ? []
        : ["Prices and totals are computed on the server and payment events are signature verified"]),
    ],
    testing: ["Ownership and authorization rules have negative tests"],
  },
});
