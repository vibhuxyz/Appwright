import type { ProjectMemoryRows } from "@repo/contracts";
import { MAX_PATH_CHARS, SHORT_SHA_LENGTH, VERIFICATION_RETRY_MARKER } from "./constants";
import {
  CheckpointDataSchema,
  FeaturesSchema,
  IntentSchema,
  OwnsSchema,
  PagesSchema,
  QuestionItemsSchema,
  RequirementsSchema,
  VerificationSchema,
  parseOr,
} from "./schemas";
import { flatten, isoDate } from "./text";
import type { WorkLedger } from "./work-ledger";

type Blueprint = NonNullable<ProjectMemoryRows["blueprint"]>;

function isUserStatement(data: unknown): boolean {
  return typeof data === "object" && data !== null && !(VERIFICATION_RETRY_MARKER in data);
}

export function confirmedItems(userRows: ProjectMemoryRows["userRows"]): string[] {
  return userRows
    .filter((row) => isUserStatement(row.data))
    .map((row) => `"${flatten(row.content)}" (${isoDate(row.createdAt)})`);
}

export function openItems(rows: Pick<ProjectMemoryRows, "questions" | "pendingIntegrations">): string[] {
  const questions = rows.questions
    .filter((row) => row.status === "PENDING")
    .flatMap((row) => parseOr(QuestionItemsSchema, row.questions, []))
    .map((item) => `${flatten(item.label)}: ${flatten(item.text)}`);
  const integrations = rows.pendingIntegrations.map(
    (row) => `Connect ${flatten(row.provider)}: ${flatten(row.reason)}`,
  );
  return [...questions, ...integrations];
}

export function assumedItems(questions: ProjectMemoryRows["questions"]): string[] {
  return questions
    .filter((row) => row.status !== "PENDING")
    .flatMap((row) => parseOr(QuestionItemsSchema, row.questions, []))
    .map((item) => `${flatten(item.label)} → ${flatten(item.options[item.defaultOptionIndex] ?? "no default")}`);
}

export function goalItems(blueprint: Blueprint): string[] {
  const intent = IntentSchema.safeParse(blueprint.intent);
  const approval = blueprint.isApproved
    ? "The user approved this plan."
    : "Not approved by the user yet; treat it as a proposal.";
  if (!intent.success) return [approval];
  const { type, domain, complexity } = intent.data;
  return [`${flatten(type)} for ${flatten(domain)} (${flatten(complexity)})`, approval];
}

export function taskItems(blueprint: Blueprint): string[] {
  return blueprint.tasks.map((task) => {
    const owns = parseOr(OwnsSchema, task.owns, []).map((path) => flatten(path, MAX_PATH_CHARS));
    return `[${task.status}] ${flatten(task.title)}${owns.length > 0 ? ` — owns: ${owns.join(", ")}` : ""}`;
  });
}

export function lastCommitItems(assistantRows: ProjectMemoryRows["assistantRows"]): string[] {
  for (const row of assistantRows) {
    const parsed = CheckpointDataSchema.safeParse(row.data);
    if (parsed.success) return [`Last turn commit: ${parsed.data.checkpoint.sha.slice(0, SHORT_SHA_LENGTH)} (${isoDate(row.createdAt)})`];
  }
  return [];
}

export function verificationItems(assistantRows: ProjectMemoryRows["assistantRows"]): string[] {
  for (const row of assistantRows) {
    const parsed = VerificationSchema.safeParse(row.data);
    if (!parsed.success) continue;
    return parsed.data.verification.map((result) =>
      `${flatten(result.check)}: ${result.ok ? "passed" : `failed (${result.errors.length} errors)`} (${isoDate(row.createdAt)})`,
    );
  }
  return [];
}

export function changedFileItems(ledger: WorkLedger): string[] {
  return ledger.changed.map(([path, count]) => `${flatten(path, MAX_PATH_CHARS)} (${count})`);
}

export function readFileItems(ledger: WorkLedger): string[] {
  return ledger.readOnly.map((path) => flatten(path, MAX_PATH_CHARS));
}

export function acceptanceItems(blueprint: Blueprint): string[] {
  return parseOr(RequirementsSchema, blueprint.requirements, [])
    .filter((requirement) => requirement.level !== "not-applicable")
    .flatMap((requirement) =>
      requirement.acceptance.map((item) => `[${flatten(requirement.level)}] ${flatten(requirement.area)}: ${flatten(item)}`),
    );
}

export function pageItems(blueprint: Blueprint): string[] {
  return parseOr(PagesSchema, blueprint.pages, []).map((page) => `${flatten(page.route)} — ${flatten(page.purpose)}`);
}

export function featureItems(blueprint: Blueprint): string[] {
  return parseOr(FeaturesSchema, blueprint.features, []).map((feature) => flatten(feature));
}
