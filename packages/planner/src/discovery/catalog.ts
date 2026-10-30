import { contactFieldsFor, contactPrefillFrom } from "./contact-fields";
import { serviceBusinessTopics } from "./service-topics";
import { siteContentTopics } from "./site-content-topics";
import { textTopic, topic } from "./topic";
import type { ExtractedFacts, MaterialTopic } from "./types";

const ORDERING_MODE = topic(
  "ordering-mode",
  "Ordering",
  "Should customers place orders, or is this a browse-only bakery site?",
  "This decides whether checkout, payments, and order tracking are built.",
  ["Browse only", "Pickup orders", "Delivery orders", "Pickup and delivery"],
  1,
);

const PAYMENT_METHOD = topic(
  "payment-method",
  "Payments",
  "How should customers pay?",
  "Payment choice changes checkout, refunds, and staff confirmation work.",
  ["Pay online", "Pay at pickup", "Online or at pickup"],
  2,
);

const GUEST_CHECKOUT = topic(
  "guest-checkout",
  "Accounts",
  "Can customers order as guests, or do they need an account?",
  "Guest checkout changes auth, order lookup, and saved-address work.",
  ["Guest checkout", "Customer accounts required", "Guest now, accounts later"],
  0,
);

const ORDER_ACCEPTANCE = topic(
  "order-acceptance",
  "Acceptance",
  "Should staff confirm each order before it is accepted?",
  "Auto-accept vs confirmation changes notifications and the staff dashboard.",
  ["Auto-accept orders", "Staff confirm each order"],
  1,
);

const PICKUP_SCHEDULING = topic(
  "pickup-scheduling",
  "Pickup",
  "How do customers choose a pickup time?",
  "Lead times and capacity need scheduling rules, not a free-text field.",
  ["Same-day walk-in", "Choose a pickup slot", "Date only, staff assign a time"],
  1,
);

const STANDARD_AVAILABILITY = topic(
  "standard-availability",
  "Availability",
  "Do standard items have limited daily quantities?",
  "Quantity limits need inventory and sold-out states on the menu.",
  ["Always available", "Daily quantity limits"],
  0,
  { importance: "optional" },
);

const CUSTOM_WORKFLOW = topic(
  "custom-workflow",
  "Custom orders",
  "How should custom cake or event requests work?",
  "Quotes, deposits, and approval are a different workflow from pickup orders.",
  ["Request a quote", "Quote then deposit", "Pay in full when requesting"],
  1,
);

const POPUP_MENUS = topic(
  "popup-menus",
  "Pop-ups",
  "Do pop-up dates have their own menus, hours, and pickup rules?",
  "Location-specific menus need a location model instead of one global catalog.",
  ["Same menu everywhere", "Location-specific menus and hours"],
  1,
);

const STAFF_ROLES = topic(
  "staff-roles",
  "Staff",
  "Who needs access to the admin dashboard?",
  "Roles change what order actions and audit history are allowed.",
  ["Owner only", "Owner and staff", "Owner, staff, and a baker role"],
  1,
  { importance: "optional" },
);

const NOTIFICATIONS = topic(
  "notifications",
  "Notifications",
  "How should customers hear about order status?",
  "Email vs SMS vs none changes providers and privacy requirements.",
  ["Email", "Email and SMS", "No notifications, status page only"],
  0,
);

const DASHBOARD_PRIORITY = topic(
  "dashboard-priority",
  "Dashboard",
  "What should staff see first when they open admin?",
  "The dashboard should be built around pending work, not generic tables.",
  ["Today's pickups", "Pending custom quotes", "Both pickups and quotes"],
  2,
  { importance: "optional" },
);

const BUSINESS_NAME = textTopic(
  "business-name",
  "Business name",
  "What is the business called?",
  "The name appears in the header, footer, receipts, and metadata.",
);

function contactsTopic(facts: ExtractedFacts): MaterialTopic {
  return topic(
    "business-contacts",
    "Contact",
    "How can customers reach you?",
    "These appear in the contact section and behind the main button.",
    [...contactFieldsFor(facts)],
    0,
    { inputType: "contacts", importance: "required", prefill: contactPrefillFrom(facts.answered) },
  );
}

const TODO_SHARING = topic(
  "sharing",
  "Sharing",
  "Should people share lists with others?",
  "Sharing changes auth, permissions, and real-time updates.",
  ["Just me", "Share with others"],
  0,
);

const TODO_DUE_DATES = topic(
  "due-dates",
  "Due dates",
  "Do tasks need due dates?",
  "Due dates change the data model, reminders, and list sorting.",
  ["No due dates", "Due dates on tasks"],
  1,
);

const TODO_COLLABORATION = topic(
  "collaboration",
  "Collaboration",
  "Can more than one person edit a list at the same time?",
  "Live collaboration is a different architecture from a personal list.",
  ["One person at a time", "Several people can edit"],
  0,
  { importance: "optional" },
);

function isExcluded(facts: ExtractedFacts, topicId: string): boolean {
  if (topicId === "payment-method" && facts.exclusions.includes("ordering")) return true;
  if (topicId === "payment-method" && facts.exclusions.includes("payments")) return true;
  if (topicId === "guest-checkout" && facts.exclusions.includes("accounts")) return true;
  if (topicId === "custom-workflow" && facts.exclusions.includes("custom-orders")) return true;
  if (topicId === "popup-menus" && facts.exclusions.includes("popups")) return true;
  return false;
}

const MENU_WORDS = /\bmenu\b/i;
const OPENING_HOURS_WORDS = /\b(opening hours|open hours|hours|restaurant|cafe|bakery|salon|clinic|gym|barber|pharmacy|open (daily|late|7))\b/i;

function isIrrelevantToBrief(facts: ExtractedFacts, topicId: string): boolean {
  if (topicId === "site-pages") return facts.signals.singlePage;
  if (topicId === "menu-structure") return !facts.signals.bakery && !MENU_WORDS.test(facts.prompt);
  if (topicId === "opening-hours") return !facts.signals.bakery && !facts.signals.storefront && !OPENING_HOURS_WORDS.test(facts.prompt);
  return false;
}

function isAnswered(facts: ExtractedFacts, topicId: string): boolean {
  const value = facts.answered[topicId];
  return typeof value === "string" && value.length > 0;
}

function isBusinessApp(facts: ExtractedFacts): boolean {
  return facts.signals.bakery || facts.signals.commerce || facts.projectType === "business-site";
}

function sellsGoods(facts: ExtractedFacts): boolean {
  return (
    facts.signals.bakery ||
    facts.signals.commerce ||
    facts.signals.storefront ||
    facts.signals.ordering
  );
}

function goodsTopics(facts: ExtractedFacts): MaterialTopic[] {
  const topics: MaterialTopic[] = [];
  if (!facts.signals.browseOnly && !isAnswered(facts, "ordering-mode")) topics.push(ORDERING_MODE);
  const ordersInScope = ordersAreInScope(facts);
  if (ordersInScope) {
    topics.push(PAYMENT_METHOD, GUEST_CHECKOUT, ORDER_ACCEPTANCE);
    if (facts.signals.pickup || (facts.answered["ordering-mode"] ?? "").includes("Pickup")) {
      topics.push(PICKUP_SCHEDULING);
    }
    topics.push(STANDARD_AVAILABILITY);
  }
  if (facts.signals.customOrders) topics.push(CUSTOM_WORKFLOW);
  if (facts.signals.popups) topics.push(POPUP_MENUS);
  if (ordersInScope && !facts.signals.existingAdmin) {
    topics.push(STAFF_ROLES, NOTIFICATIONS, DASHBOARD_PRIORITY);
  } else if (ordersInScope) {
    topics.push(NOTIFICATIONS);
  }
  if (facts.signals.browseOnly || isAnswered(facts, "ordering-mode")) topics.push(...siteContentTopics());
  return topics;
}

function ordersAreInScope(facts: ExtractedFacts): boolean {
  if (facts.signals.browseOnly || facts.exclusions.includes("ordering")) return false;
  const mode = facts.answered["ordering-mode"] ?? "";
  if (mode === "Browse only") return false;
  return facts.signals.ordering || mode.includes("Pickup") || mode.includes("Delivery");
}

export function materialTopics(facts: ExtractedFacts): MaterialTopic[] {
  const topics: MaterialTopic[] = [];
  if (facts.signals.todoApp) {
    topics.push(TODO_SHARING, TODO_DUE_DATES, TODO_COLLABORATION);
  }

  if (isBusinessApp(facts)) {
    topics.push(BUSINESS_NAME, contactsTopic(facts));
    topics.push(...(sellsGoods(facts) ? goodsTopics(facts) : serviceBusinessTopics()));
  }

  return topics.filter((item) => !isAnswered(facts, item.id) && !isExcluded(facts, item.id) && !isIrrelevantToBrief(facts, item.id));
}
