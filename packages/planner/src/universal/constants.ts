import type { ProjectType, RequirementArea } from "@repo/contracts";

export const MAX_TOTAL_PAGES = 24;
export const MAX_TOTAL_ENTITIES = 12;
export const MAX_ADMIN_ENTITY_PAGES = 8;

export const PRIVATE_ROUTE_PATTERN = /^\/(admin|dashboard|account|settings)(\/|$)/;
export const IMAGERY_PATTERN = /\b(hero|banner|gallery|photo|image|logo|avatar|thumbnail|cover)\b/i;

export const BROWSE_ONLY_PATTERNS: readonly RegExp[] = [
  /\bbrowse[- ]only\b/i,
  /\b(only browse|browsing only)\b/i,
  /\bno (online )?(ordering|orders|checkout|payments?|cart)\b/i,
  /\b(catalog|informational) only\b/i,
  /\bwithout (online )?(ordering|checkout|payments?)\b/i,
  /\bnot (taking|accepting) (online )?orders\b/i,
  /\benquir(?:y|ies)[- ]only\b/i,
  /\bcontact[- ]form (for all|only)\b/i,
];

export const SINGLE_PAGE_PATTERNS: readonly RegExp[] = [
  /\b(single|one)[- ]page (website|site|landing|landing page)\b/i,
  /\b(one|single)[- ]page only\b/i,
  /\bone page only\b/i,
  /\bonly (one|a single) page\b/i,
  /\ba single[- ]page\b/i,
];

export const NO_BACKEND_PATTERNS: readonly RegExp[] = [
  /\bno (database|data ?base|backend|back-end|cms)\b/i,
  /\bwithout (a |any )?(database|backend|back-end|cms)\b/i,
  /\b(static|frontend[- ]only|front-end only) (site|website|page)\b/i,
];

export const PROJECT_TYPE_KEYWORDS: readonly (readonly [ProjectType, RegExp])[] = [
  ["wallet", /\b(wallet|ledger|fintech|banking|crypto)\b/i],
  ["marketplace", /\b(marketplace|multi-?vendor|sellers?|classifieds|listings?)\b/i],
  ["saas", /\b(saas|dashboard|crm|subscription|b2b|workspace|todo|task-?manager)\b/i],
  ["portfolio", /\b(portfolio|resume|cv|freelancer|photographer|personal-?(site|website))\b/i],
  [
    "business-site",
    /\b(bakery|restaurant|cafe|shop|store|salon|clinic|business|landing[- ]?pages?|brand|catalog)\b/i,
  ],
];

export const ADMIN_PROJECT_TYPES: ReadonlySet<ProjectType> = new Set([
  "business-site",
  "marketplace",
  "wallet",
]);

export const MEDIA_PROJECT_TYPES: ReadonlySet<ProjectType> = new Set([
  "business-site",
  "portfolio",
  "marketplace",
]);

export const UNMANAGED_ENTITIES: ReadonlySet<string> = new Set([
  "User",
  "Account",
  "Session",
  "VerificationToken",
  "AuditLog",
  "LedgerEntry",
  "SiteSettings",
  "ContactMessage",
  "OrderItem",
  "LineItem",
  "Payment",
  "Notification",
]);

export const AREA_ORDER: readonly RequirementArea[] = [
  "security",
  "admin",
  "media",
  "seo",
  "testing",
  "deploy",
];
