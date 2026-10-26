export interface IntakeEvalCase {
  readonly name: string;
  readonly prompt: string;
  readonly mustNotAsk: readonly string[];
  readonly mustMention: readonly RegExp[];
  readonly maxQuestions: number;
  readonly maxContactFields: number;
}

export const INTAKE_EVAL_CASES: readonly IntakeEvalCase[] = [
  {
    name: "engineer-bootcamp-landing",
    prompt:
      "build landing page single app for my 100x school busines regading we run 100x schrrol super 30 boot cam if any of fouder startup or company what to hide they can hire our good crazy enginerrs make this landing page more virraly apear less text more visual",
    mustNotAsk: ["business-name", "work-showcase", "site-language"],
    mustMention: [/hir|compan|startup|engineer/i],
    maxQuestions: 4,
    maxContactFields: 2,
  },
  {
    name: "home-planner-service",
    prompt: "Create a website for my home planning business in Ranchi. Visitors enquire by phone.",
    mustNotAsk: ["site-language"],
    mustMention: [/plan|design|project|home/i],
    maxQuestions: 5,
    maxContactFields: 3,
  },
  {
    name: "named-bakery-pickup",
    prompt: "Build a site for our bakery called Sunrise Loaves. Customers order cakes for pickup and pay at pickup.",
    mustNotAsk: ["business-name", "ordering-mode", "payment-method"],
    mustMention: [/cake|order|pickup|menu/i],
    maxQuestions: 8,
    maxContactFields: 4,
  },
  {
    name: "saas-analytics-landing",
    prompt: "Landing page for Metricly, a product analytics SaaS for startups. Free trial, three pricing tiers.",
    mustNotAsk: ["business-name", "work-showcase", "site-language"],
    mustMention: [/trial|pricing|plan|signup|demo/i],
    maxQuestions: 4,
    maxContactFields: 2,
  },
  {
    name: "dental-clinic",
    prompt: "Website for Bright Smile Dental clinic in Pune, patients should book appointments online.",
    mustNotAsk: ["business-name", "work-showcase", "site-language"],
    mustMention: [/appointment|book|slot|treatment|patient/i],
    maxQuestions: 6,
    maxContactFields: 4,
  },
  {
    name: "personal-todo",
    prompt: "build me a todo app",
    mustNotAsk: ["business-name", "business-contacts"],
    mustMention: [/task|list|due|share/i],
    maxQuestions: 4,
    maxContactFields: 0,
  },
];
