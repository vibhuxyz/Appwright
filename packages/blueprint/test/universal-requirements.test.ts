import { describe, expect, it } from "bun:test";
import { FakeProvider } from "@repo/agent-core";
import { buildBlueprint } from "../src";

const FIELD = { type: "String", required: true, unique: false };

function entity(name: string, relations: string[] = []) {
  return { name, fields: [{ name: "name", ...FIELD }], relations };
}

function content(options: {
  entities: ReturnType<typeof entity>[];
  routes: string[];
  features?: string[];
}) {
  return JSON.stringify({
    entities: options.entities,
    pages: options.routes.map((route) => ({
      route,
      purpose: `Page ${route}`,
      components: ["Section"],
    })),
    features: options.features ?? [],
    theme: { preset: "warm", primary: "#C2410C" },
  });
}

async function plan(options: {
  prompt: string;
  intent: { type: string; domain: string; projectType?: string };
  content: string;
}) {
  const provider = new FakeProvider([
    { kind: "text", text: JSON.stringify({ complexity: "complex", ...options.intent }) },
    { kind: "text", text: options.content },
  ]);
  return buildBlueprint(options.prompt, { provider });
}

function taskTypes(result: Awaited<ReturnType<typeof plan>>): string[] {
  return result.tasks.map((task) => task.type);
}

function routes(result: Awaited<ReturnType<typeof plan>>): string[] {
  return result.blueprint.pages.map((page) => page.route);
}

const BAKERY_CONTENT = content({
  entities: [entity("Product", ["Category"]), entity("Category", ["Product"])],
  routes: ["/", "/products", "/products/[slug]"],
});

describe("universal requirements", () => {
  it("plans admin, media, seo, security, tests and deploy for a browse-only bakery", async () => {
    const result = await plan({
      prompt: "Build a landing page for my bakery. Visitors only browse, no online ordering.",
      intent: { type: "new-app", domain: "bakery" },
      content: BAKERY_CONTENT,
    });

    expect(result.blueprint.projectType).toBe("business-site");
    expect(taskTypes(result)).toEqual(
      expect.arrayContaining(["media", "seo", "security", "testing", "deploy"]),
    );
    expect(taskTypes(result)).not.toContain("payment");
    expect(taskTypes(result)).not.toContain("admin");
    expect(taskTypes(result)).not.toContain("auth");
    expect(taskTypes(result)).not.toContain("schema");
    expect(routes(result)).toContain("/contact");
    expect(routes(result).some((route) => route.startsWith("/admin"))).toBe(false);
    expect(result.blueprint.entities).toEqual([]);
    expect(result.blueprint.stack.db).toBe("none");
  });

  it("drops payments the model proposed when the request is browse-only", async () => {
    const result = await plan({
      prompt: "Bakery catalog only, no checkout or payments.",
      intent: { type: "new-app", domain: "bakery" },
      content: content({
        entities: [entity("Product")],
        routes: ["/", "/products"],
        features: ["payments"],
      }),
    });

    expect(result.blueprint.features).not.toContain("payments");
    expect(taskTypes(result)).not.toContain("payment");
  });

  it("orders admin pages after the admin task", async () => {
    const result = await plan({
      prompt: "Bakery website where customers place pickup orders.",
      intent: { type: "new-app", domain: "bakery" },
      content: BAKERY_CONTENT,
    });

    expect(result.graph.dependsOn.get("page-admin-product")).toContain("admin");
    expect(result.graph.dependsOn.get("page-admin-media")).toContain("media");
  });

  it("keeps payments and adds seller moderation for a marketplace with payments", async () => {
    const result = await plan({
      prompt: "A marketplace where sellers list handmade goods and buyers pay online.",
      intent: { type: "new-app", domain: "handmade-marketplace" },
      content: content({
        entities: [entity("Listing")],
        routes: ["/", "/listings"],
        features: ["auth", "payments"],
      }),
    });

    const admin = result.blueprint.requirements?.find((item) => item.area === "admin");
    expect(result.blueprint.projectType).toBe("marketplace");
    expect(taskTypes(result)).toEqual(expect.arrayContaining(["payment", "admin", "auth"]));
    expect(admin?.acceptance.join(" ")).toContain("moderate sellers and listings");
  });

  it("adds a contact flow and media slots for a portfolio without an admin panel", async () => {
    const result = await plan({
      prompt: "A portfolio website for a freelance photographer.",
      intent: { type: "new-app", domain: "photography-portfolio" },
      content: content({ entities: [entity("Project")], routes: ["/", "/work"] }),
    });

    expect(result.blueprint.projectType).toBe("portfolio");
    expect(routes(result)).toContain("/contact");
    expect(taskTypes(result)).toEqual(expect.arrayContaining(["media", "seo", "testing"]));
    expect(taskTypes(result)).not.toContain("admin");
  });

  it("requires auth, a settings page and permission checks for a saas dashboard", async () => {
    const result = await plan({
      prompt: "A CRM dashboard for small sales teams.",
      intent: { type: "new-app", domain: "crm", projectType: "saas" },
      content: content({
        entities: [entity("Contact")],
        routes: ["/", "/contacts"],
      }),
    });

    const security = result.blueprint.requirements?.find((item) => item.area === "security");
    expect(result.blueprint.projectType).toBe("saas");
    expect(taskTypes(result)).toContain("auth");
    expect(routes(result)).toContain("/settings");
    expect(security?.acceptance.join(" ")).toContain("Roles and permissions");
  });

  it("adds a ledger and idempotency requirements for a wallet", async () => {
    const result = await plan({
      prompt: "A wallet app to send and receive money between friends.",
      intent: { type: "new-app", domain: "wallet" },
      content: content({ entities: [entity("Account")], routes: ["/", "/send"] }),
    });

    const security = result.blueprint.requirements?.find((item) => item.area === "security");
    expect(result.blueprint.projectType).toBe("wallet");
    expect(result.blueprint.entities.map((item) => item.name)).toContain("LedgerEntry");
    expect(security?.acceptance.join(" ")).toContain("idempotency key");
  });

  it("records not-applicable areas instead of dropping them", async () => {
    const result = await plan({
      prompt: "A small internal tool to track tasks.",
      intent: { type: "new-app", domain: "todo-list" },
      content: content({ entities: [entity("Todo")], routes: ["/dashboard"] }),
    });

    const levels = new Map(
      (result.blueprint.requirements ?? []).map((item) => [item.area, item.level]),
    );
    expect(levels.get("seo")).toBe("not-applicable");
    expect(levels.get("admin")).toBe("not-applicable");
    expect(taskTypes(result)).not.toContain("seo");
  });
});
