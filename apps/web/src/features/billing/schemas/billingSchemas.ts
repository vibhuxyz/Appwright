import { z } from "zod";

export const creditsResponseSchema = z.object({ credits: z.number() });

export const addCreditsResponseSchema = z.object({
  ok: z.boolean(),
  credits: z.number(),
});

export const customAmountFormSchema = z.object({
  amount: z
    .string()
    .refine(
      (v) => Number.isInteger(Number(v)) && Number(v) > 0,
      "Enter a positive number of credits",
    ),
});
export type CustomAmountForm = z.infer<typeof customAmountFormSchema>;

export interface CreditPackage {
  id: string;
  title: string;
  credits: number;
  appsEstimate: string;
  description: string;
  badge: string | null;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "starter",
    title: "Starter Pack",
    credits: 50_000,
    appsEstimate: "~1 Full App",
    description:
      "Ideal for a complete Todo, Notes, or small React app with full TypeScript verification.",
    badge: null,
  },
  {
    id: "builder",
    title: "Builder Pack",
    credits: 150_000,
    appsEstimate: "~3 Full Apps",
    description:
      "Standard welcome size. Easily builds 3 complete applications or a medium multi-view project.",
    badge: "Most Popular",
  },
  {
    id: "pro",
    title: "Pro / Scale Pack",
    credits: 500_000,
    appsEstimate: "~10+ Apps / Large Project",
    description:
      "Heavy multi-file architecture, API integration, auth flows, and extensive iterations.",
    badge: "Best Value",
  },
];
