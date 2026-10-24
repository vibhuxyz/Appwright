import type { Entity, Page } from "@repo/contracts";
import type { TemplateAdditions } from "../universal/types";
import type { WorkflowSpec } from "./types";

const PRODUCT: Entity = {
  name: "Product",
  fields: [
    { name: "name", type: "String", required: true, unique: false },
    { name: "description", type: "String", required: false, unique: false },
    { name: "priceCents", type: "Int", required: true, unique: false },
    { name: "available", type: "Boolean", required: true, unique: false },
  ],
  relations: ["Category"],
};

const CATEGORY: Entity = {
  name: "Category",
  fields: [{ name: "name", type: "String", required: true, unique: true }],
  relations: ["Product"],
};

function orderEntity(includeLocation: boolean): Entity {
  return {
    name: "Order",
    fields: [
      { name: "status", type: "String", required: true, unique: false },
      { name: "pickupAt", type: "DateTime", required: false, unique: false },
      { name: "totalCents", type: "Int", required: true, unique: false },
      { name: "customerName", type: "String", required: true, unique: false },
    ],
    relations: includeLocation ? ["OrderItem", "Location"] : ["OrderItem"],
  };
}

const ORDER_ITEM: Entity = {
  name: "OrderItem",
  fields: [
    { name: "quantity", type: "Int", required: true, unique: false },
    { name: "unitPriceCents", type: "Int", required: true, unique: false },
  ],
  relations: ["Order", "Product"],
};

function customRequestEntity(includeLocation: boolean): Entity {
  return {
    name: "CustomRequest",
    fields: [
      { name: "status", type: "String", required: true, unique: false },
      { name: "eventDate", type: "DateTime", required: false, unique: false },
      { name: "details", type: "String", required: true, unique: false },
      { name: "quoteCents", type: "Int", required: false, unique: false },
      { name: "depositCents", type: "Int", required: false, unique: false },
    ],
    relations: includeLocation ? ["Location"] : [],
  };
}

const LOCATION: Entity = {
  name: "Location",
  fields: [
    { name: "name", type: "String", required: true, unique: false },
    { name: "kind", type: "String", required: true, unique: false },
    { name: "address", type: "String", required: false, unique: false },
    { name: "opensAt", type: "DateTime", required: false, unique: false },
    { name: "closesAt", type: "DateTime", required: false, unique: false },
  ],
  relations: [],
};

function inScope(workflows: readonly WorkflowSpec[], kind: WorkflowSpec["kind"]): boolean {
  return workflows.some((workflow) => workflow.kind === kind && workflow.inScope);
}

function standardOrderPages(workflows: readonly WorkflowSpec[]): Page[] {
  const pickup = inScope(workflows, "pickup-order");
  if (!pickup && !inScope(workflows, "delivery-order")) return [];
  return [
    {
      route: "/order",
      purpose: pickup
        ? "Place a standard order and choose pickup details"
        : "Place a standard order for delivery",
      components: ["OrderForm", "PickupSlotPicker", "OrderSummary"],
    },
    {
      route: "/order/[id]",
      purpose: pickup
        ? "Customer order status, cancellation, and pickup instructions"
        : "Customer order status and cancellation",
      components: ["OrderStatus", "CancelOrderButton"],
    },
  ];
}

export function workflowAdditions(workflows: readonly WorkflowSpec[]): TemplateAdditions {
  const pages: Page[] = [];
  const entities: Entity[] = [];
  const features: string[] = [];

  if (inScope(workflows, "browse-catalog")) {
    entities.push(CATEGORY, PRODUCT);
    pages.push({
      route: "/menu",
      purpose: "Browse items by category",
      components: ["CategoryNav", "ProductGrid", "ProductCard"],
    });
  }
  const includeLocation = inScope(workflows, "pop-up-locations");
  if (inScope(workflows, "pickup-order") || inScope(workflows, "delivery-order")) {
    entities.push(CATEGORY, PRODUCT, orderEntity(includeLocation), ORDER_ITEM);
    features.push("auth");
    pages.push(...standardOrderPages(workflows));
  }
  if (inScope(workflows, "custom-request")) {
    entities.push(customRequestEntity(includeLocation));
    pages.push({
      route: "/custom-order",
      purpose: "Request a custom cake or event quote",
      components: ["CustomOrderForm", "EventDateField", "QuoteStatus"],
    });
  }
  if (inScope(workflows, "pop-up-locations")) {
    entities.push(LOCATION);
    pages.push({
      route: "/locations",
      purpose: "Storefront and upcoming pop-up dates with location-specific hours",
      components: ["LocationList", "PopupCalendar", "LocationHours"],
    });
  }

  return { pages, entities, features, acceptance: {} };
}

export function dashboardComponents(workflows: readonly WorkflowSpec[]): string[] {
  const components = ["SummaryCards", "RecentActivity", "AlertsList"];
  if (inScope(workflows, "pickup-order")) components.push("PendingOrders", "TodaysPickups", "CapacityAlert");
  if (inScope(workflows, "custom-request")) components.push("PendingQuotes");
  if (inScope(workflows, "pop-up-locations")) components.push("UpcomingPopups");
  if (inScope(workflows, "inventory")) components.push("LowStockList");
  return components;
}
