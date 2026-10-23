import { PlanIdSchema, creditsToUsd, usdToCredits } from "@repo/contracts";
import { z } from "zod";

export const creditsResponseSchema = z.object({ credits: z.number() });

export const addCreditsResponseSchema = z.object({
  ok: z.boolean(),
  credits: z.number(),
});

export const upgradePlanResponseSchema = z.object({
  ok: z.boolean(),
  credits: z.number(),
  plan: PlanIdSchema,
});

export const customAmountFormSchema = z.object({
  amount: z
    .string()
    .refine(
      (v) => !Number.isNaN(Number(v)) && Number(v) > 0,
      "Enter a positive dollar amount (e.g. 10)",
    ),
});
export type CustomAmountForm = z.infer<typeof customAmountFormSchema>;

export interface CreditPackage {
  id: string;
  title: string;
  priceDollars: number;
  credits: number;
  dollarValue: string;
  appsEstimate: string;
  description: string;
  badge: string | null;
}

export function formatCreditsToDollars(credits: number): string {
  const dollars = creditsToUsd(credits);
  if (credits > 0 && dollars < 0.01) {
    return "< $0.01";
  }
  return `$${dollars.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "starter",
    title: "$10 Starter Pack",
    priceDollars: 10,
    credits: usdToCredits(10),
    dollarValue: "$10.00",
    appsEstimate: "~5 Full Apps",
    description:
      "Ideal for quick apps, components, and small React tools with full TypeScript verification.",
    badge: null,
  },
  {
    id: "builder",
    title: "$25 Builder Pack",
    priceDollars: 25,
    credits: usdToCredits(25),
    dollarValue: "$25.00",
    appsEstimate: "~15 Full Apps",
    description:
      "Most popular choice. Easily builds full-stack multi-view projects and active databases.",
    badge: "Most Popular",
  },
  {
    id: "pro",
    title: "$50 Pro Scale Pack",
    priceDollars: 50,
    credits: usdToCredits(50),
    dollarValue: "$50.00",
    appsEstimate: "~35+ Apps / Scaled",
    description:
      "Heavy multi-file architecture, API integration, auth flows, and extensive iterations.",
    badge: "Best Value",
  },
];
