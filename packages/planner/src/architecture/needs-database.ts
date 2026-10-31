import { extractFacts, workflowsFrom } from "../discovery";
import { detectScope } from "../universal/scope";

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
  const scope = detectScope(text);
  const facts = extractFacts(prompt, answers);
  if (scope.isStatic || facts.exclusions.includes("database")) return false;
  if (EXPLICIT_DATABASE.test(text)) return true;

  const catalogOnly =
    facts.signals.browseOnly ||
    facts.exclusions.includes("ordering") ||
    facts.answered["ordering-mode"] === "Browse only";
  const storesWorkflow = workflowsFrom(facts).some(
    (workflow) => workflow.inScope && STORED_WORKFLOWS.has(workflow.kind),
  );
  if (!catalogOnly && storesWorkflow) return true;

  const wantsAccounts =
    facts.signals.accountsMentioned && !facts.exclusions.includes("accounts");
  const wantsAdmin = facts.signals.adminMentioned && !facts.exclusions.includes("admin");
  if (catalogOnly) return wantsAdmin || wantsAccounts;
  if (scope.isSinglePage) return wantsAccounts || wantsAdmin;
  if (wantsAccounts) return true;
  if (facts.signals.paymentsMentioned && !facts.exclusions.includes("ordering")) return true;
  if (facts.signals.todoApp) return true;
  return PERSISTED_APP.test(text);
}
