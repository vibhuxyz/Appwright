import { describe, expect, it } from "bun:test";
import { extractFacts, extractIdentityFromPrompt, selectDiscoveryQuestions } from "../src/discovery";

const USER_PROMPT =
  "build full stack app for my bakery business where user can come see the product, menu store details and everything my business name is vibhuBakery wallah";

const USER_PROMPT_TYPED =
  "build full stack app for my bakery business where user can come see the product , menu store deatiles and everything my business name is vibhuBakery wallah";

describe("extractIdentityFromPrompt", () => {
  it("reads a business name that the user already wrote", () => {
    expect(extractIdentityFromPrompt(USER_PROMPT)["business-name"]).toBe("vibhuBakery wallah");
    expect(extractIdentityFromPrompt(USER_PROMPT_TYPED)["business-name"]).toBe("vibhuBakery wallah");
    expect(extractFacts(USER_PROMPT).answered["business-name"]).toBe("vibhuBakery wallah");
  });

  it("reads a name written as 'my <name> business' and skips descriptive words", () => {
    const prompt =
      "build landing page single app for my 100x school busines regading we run 100x schrrol super 30 boot cam";
    expect(extractIdentityFromPrompt(prompt)["business-name"]).toBe("100x school");
    expect(selectDiscoveryQuestions(prompt).map((question) => question.need)).not.toContain("business-name");
    expect(extractIdentityFromPrompt("a site for my Small business")["business-name"]).toBeUndefined();
    expect(extractIdentityFromPrompt("a site for my home planning business")["business-name"]).toBeUndefined();
    expect(extractIdentityFromPrompt("a site for our Acme Labs company")["business-name"]).toBe("Acme Labs");
    expect(extractIdentityFromPrompt("an app for our online bakery business")["business-name"]).toBeUndefined();
  });

  it("reads email, phone, address, and social when they are in the prompt", () => {
    const prompt =
      "Bakery called Rise. Email hello@rise.test phone 555-010-0199 whatsapp 555-010-0200 address 12 Oven Lane instagram @risebakery https://rise.test support@rise.test";
    const identity = extractIdentityFromPrompt(prompt);
    expect(identity["business-name"]).toBe("Rise");
    expect(identity["business-email"]).toBe("hello@rise.test");
    expect(identity["business-contact"]).toContain("555-010-0199");
    expect(identity["business-whatsapp"]).toContain("555-010-0200");
    expect(identity["business-address"]).toContain("12 Oven Lane");
    expect(identity["business-social"]).toMatch(/instagram|rise\.test/i);
    expect(identity["business-social"]).not.toMatch(/wa\.me/i);
    expect(identity["business-support"]).toBe("support@rise.test");
  });

  it("does not invent a name from a prompt that never gave one", () => {
    expect(extractIdentityFromPrompt("build full stack app for my bakery business")["business-name"]).toBeUndefined();
  });
});

describe("discovery uses extracted identity", () => {
  it("does not re-ask facts the prompt already gave, and asks only what is missing", () => {
    const needs = selectDiscoveryQuestions(USER_PROMPT).map((question) => question.need);
    expect(needs).not.toContain("business-name");
    expect(needs).toEqual(expect.arrayContaining(["business-contacts", "ordering-mode"]));
    const contacts = selectDiscoveryQuestions(USER_PROMPT).find(
      (question) => question.need === "business-contacts",
    );
    expect(contacts?.inputType).toBe("contacts");
    expect(contacts?.options).toEqual(["Phone", "WhatsApp", "Email", "Address"]);
    expect(needs[0]).not.toBe("business-name");
  });
});
