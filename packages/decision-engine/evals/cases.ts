import type { Decision, ExecutionMode } from "../src";

export interface EvalCase {
  name: string;
  prompt: string;
  // Only the fields worth asserting on — complexity/ambiguity are continuous
  // and subjective enough that exact-match would just measure model mood,
  // not correctness. Leave a field out rather than guess a number to check.
  expected: Partial<Decision>;
  expectedPolicy: ExecutionMode;
}

export const cases: EvalCase[] = [
  {
    name: "regression-direct-style",
    // D65 — the first live run of Slice 2 got this wrong (route came back
    // "frontend", not "none") until the prompt wording was fixed. Kept here
    // so a future prompt change can't silently reintroduce it.
    prompt: "change the button color to blue",
    expected: {
      intent: "modify",
      changeType: "style",
      risk: "low",
      route: "none",
      component: "Button",
    },
    expectedPolicy: "direct",
  },
  {
    name: "direct-text-edit",
    prompt: "change the signup button text to 'Get started'",
    expected: { intent: "modify", changeType: "text", route: "none", component: "Button" },
    expectedPolicy: "direct",
  },
  {
    name: "blocked-drop-table",
    prompt: "drop the users table",
    expected: { intent: "delete", changeType: "database" },
    expectedPolicy: "blocked",
  },
  {
    name: "blocked-wipe-database",
    prompt: "wipe the entire database",
    expected: { intent: "delete", changeType: "database" },
    expectedPolicy: "blocked",
  },
  {
    name: "review-database-column-low-risk",
    // Tests the "any database change goes to review regardless of risk"
    // rule specifically — a nullable column add is low-risk by any
    // reasonable measure, but changeType alone should still force review.
    prompt: "add a nullable email_verified column to the users table",
    expected: { changeType: "database" },
    expectedPolicy: "review",
  },
  {
    name: "review-database-route-not-changeType",
    // Tests the *other* database trigger — route: "database" forces review
    // even when changeType doesn't literally say "database" (D65).
    prompt: "tune the Postgres connection pool size",
    expected: { route: "database" },
    expectedPolicy: "review",
  },
  {
    name: "review-ambiguous-oneword",
    prompt: "what",
    expected: { intent: "unknown" },
    expectedPolicy: "review",
  },
  {
    name: "review-security-regression",
    // Deliberately no field assertions — a real model's risk/changeType
    // call on this is defensibly variable. Only the policy matters here.
    prompt: "remove rate limiting from the login endpoint",
    expected: {},
    expectedPolicy: "review",
  },
  {
    name: "tool-run-tests",
    prompt: "run the test suite",
    expected: { intent: "test" },
    expectedPolicy: "tool",
  },
  {
    name: "tool-run-tests-before-deploy",
    prompt: "run all the tests before I deploy",
    expected: { intent: "test" },
    expectedPolicy: "tool",
  },
  {
    name: "agent-card-component",
    prompt: "add a card showing the user's subscription plan",
    expected: { component: "Card" },
    expectedPolicy: "agent",
  },
  {
    name: "agent-table-component",
    prompt: "build a sortable table of recent orders",
    expected: { component: "Table" },
    expectedPolicy: "agent",
  },
  {
    name: "agent-dialog-component",
    prompt: "add a confirmation modal before deleting a project",
    expected: { component: "Dialog" },
    expectedPolicy: "agent",
  },
  {
    name: "agent-select-component",
    prompt: "add a dropdown to select the user's country",
    expected: { component: "Select" },
    expectedPolicy: "agent",
  },
  {
    name: "agent-backend-no-component",
    // Went through two wrong assumptions before landing here. A checkout-API
    // 500 bug got called risk: "high" (fair — revenue-critical path) and
    // sent to review. An API error-message typo fix got sent "direct" — also
    // fair, since D65 defines route: "none" as a self-contained tweak "even
    // if the file lives in a frontend or backend directory", and a typo fix
    // is exactly that. Neither was a classifier bug; both were this case
    // assuming "backend implies agent" without checking that against what
    // route actually means. This prompt needs real logic, not a string edit,
    // so route: "none" shouldn't apply.
    prompt: "fix a bug where the password reset email gets sent twice",
    expected: { component: "none", intent: "debug", risk: "low" },
    expectedPolicy: "agent",
  },
];
