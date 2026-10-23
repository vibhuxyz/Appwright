import { extractFacts, workflowsFrom } from "../discovery";

const EXPLICIT_DATABASE =
  /\b(databases?|mongo(?:db)?|mongoose|postgres(?:ql)?|prisma)\b/i;

const PERSISTED_APP =
  /\b(full[- ]stack|accounts?|log ?ins?|sign[- ]?ups?|bookings?|reservations?|appointments?|inventory|todos?|to-dos?|task lists?|chats?|checkouts?|subscriptions?|crm|user profiles?|wallets?|ledgers?|marketplaces?)\b/i;

const STORED_WORKFLOWS = new Set([
  "pickup-order",
  "delivery-order",
  "custom-request",
  "inventory",
  "pop-up-locations",
]);

export function appNeedsDatabase(
  prompt: string,
  answers: Readonly<Record<string, string>> = {},
): boolean {
  const text = [prompt, ...Object.values(answers)].join("\n");
  if (EXPLICIT_DATABASE.test(text)) return true;

  const facts = extractFacts(prompt, answers);
  const storesWorkflow = workflowsFrom(facts).some(
    (workflow) => workflow.inScope && STORED_WORKFLOWS.has(workflow.kind),
  );
  if (storesWorkflow) return true;

  const browseOnly =
    facts.signals.browseOnly ||
    facts.exclusions.includes("ordering") ||
    facts.answered["ordering-mode"] === "Browse only";
  const wantsAccounts =
    facts.signals.accountsMentioned && !facts.exclusions.includes("accounts");
  if (browseOnly) return facts.signals.adminMentioned || wantsAccounts;
  if (wantsAccounts) return true;
  if (facts.signals.paymentsMentioned && !facts.exclusions.includes("ordering")) return true;
  if (facts.signals.todoApp) return true;
  return PERSISTED_APP.test(text);
}
