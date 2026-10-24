import type { ExtractedFacts, WorkflowSpec } from "./types";

function workflow(
  kind: WorkflowSpec["kind"],
  name: string,
  inScope: boolean,
  reason: string,
  actors: readonly string[],
  steps: readonly string[],
): WorkflowSpec {
  return { id: kind, kind, name, inScope, reason, actors, steps };
}

function ordersInScope(facts: ExtractedFacts): boolean {
  if (facts.signals.browseOnly || facts.exclusions.includes("ordering")) return false;
  const mode = facts.answered["ordering-mode"] ?? "";
  if (mode === "Browse only") return false;
  return facts.signals.ordering || mode.includes("Pickup") || mode.includes("Delivery");
}

function catalogInScope(facts: ExtractedFacts): boolean {
  return facts.signals.bakery || facts.signals.commerce || facts.signals.storefront;
}

export function workflowsFrom(facts: ExtractedFacts): WorkflowSpec[] {
  const ordering = ordersInScope(facts);
  const pickup = ordering && (facts.signals.pickup || (facts.answered["ordering-mode"] ?? "").includes("Pickup"));
  const delivery = ordering && (facts.signals.delivery || (facts.answered["ordering-mode"] ?? "").includes("Delivery"));
  const custom = facts.signals.customOrders && !facts.exclusions.includes("custom-orders");
  const popups = facts.signals.popups && !facts.exclusions.includes("popups");
  const catalog = catalogInScope(facts);
  const admin = ordering || custom || popups || facts.signals.bakery;

  return [
    workflow(
      "browse-catalog",
      "Browse the catalog",
      catalog,
      catalog ? "Customers need to see products or the menu" : "No product catalog is in scope",
      ["customer"],
      ["Open the site", "Browse categories", "View an item"],
    ),
    workflow(
      "pickup-order",
      "Standard pickup order",
      pickup,
      pickup ? "Customers can place standard pickup orders" : "Pickup ordering is out of scope",
      ["customer", "staff"],
      ["Choose items", "Pick a time", "Pay", "Staff prepare", "Customer collects"],
    ),
    workflow(
      "delivery-order",
      "Delivery order",
      delivery,
      delivery ? "Customers can order for delivery" : "Delivery is out of scope",
      ["customer", "staff"],
      ["Choose items", "Enter address", "Pay", "Staff dispatch", "Deliver"],
    ),
    workflow(
      "custom-request",
      "Custom cake or event request",
      custom,
      custom ? "Custom cake and event requests are in scope" : "Custom requests are out of scope",
      ["customer", "staff", "owner"],
      ["Submit request", "Staff quote", "Customer approve", "Deposit", "Produce", "Pickup"],
    ),
    workflow(
      "pop-up-locations",
      "Pop-up locations",
      popups,
      popups ? "The business runs pop-up dates with their own rules" : "Pop-ups are out of scope",
      ["owner", "staff", "customer"],
      ["Publish a date", "Set menu and hours", "Customers pick that location", "Fulfill on site"],
    ),
    workflow(
      "inventory",
      "Availability and quantity",
      ordering,
      ordering ? "Standard items may sell out" : "No order quantities to track",
      ["staff"],
      ["Set daily quantity", "Decrement on order", "Show sold out"],
    ),
    workflow(
      "notifications",
      "Customer notifications",
      ordering || custom,
      ordering || custom ? "Customers need status updates" : "No order status to send",
      ["system", "customer"],
      ["Accepted", "Ready", "Cancelled or delayed"],
    ),
    workflow(
      "admin-operations",
      "Staff operations dashboard",
      admin,
      admin ? "Staff need pending work, not generic tables" : "No staff operations required",
      ["owner", "staff"],
      ["See pending work", "Update status", "Search records", "Review activity"],
    ),
  ];
}
