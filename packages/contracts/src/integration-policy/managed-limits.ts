import type { IntegrationProvider } from "../environment";

export interface ManagedUsageLimit {
  readonly provider: IntegrationProvider;
  readonly operation: string;
  readonly limit: number;
}

export const MANAGED_EMAIL_OPERATION = "send_transactional";
export const MANAGED_RAZORPAY_OPERATION = "create_order";
export const MANAGED_CLOUDINARY_OPERATION = "upload";

export const MANAGED_USAGE_LIMITS = [
  { provider: "email", operation: MANAGED_EMAIL_OPERATION, limit: 10 },
  { provider: "razorpay", operation: MANAGED_RAZORPAY_OPERATION, limit: 10 },
  { provider: "cloudinary", operation: MANAGED_CLOUDINARY_OPERATION, limit: 10 },
] as const satisfies readonly ManagedUsageLimit[];

const LIMIT_BY_PROVIDER: ReadonlyMap<IntegrationProvider, number> = new Map(
  MANAGED_USAGE_LIMITS.map((entry) => [entry.provider, entry.limit]),
);

export function managedUsageLimit(provider: IntegrationProvider): number {
  return LIMIT_BY_PROVIDER.get(provider) ?? 0;
}
