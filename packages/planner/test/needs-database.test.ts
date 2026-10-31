import { describe, expect, it } from "bun:test";
import { appNeedsDatabase } from "../src";

describe("appNeedsDatabase", () => {
  it("stays off for a browse-only bakery, even when the prompt says full stack", () => {
    const prompt = "Build a full stack app for my bakery vibhuBakery. Show the menu and store details.";
    expect(appNeedsDatabase(prompt, { "ordering-mode": "Browse only" })).toBe(false);
    expect(appNeedsDatabase(`${prompt}\n\nBrowse only`)).toBe(false);
  });

  it("stays off for a static site", () => {
    expect(appNeedsDatabase("A landing page for a photographer")).toBe(false);
    expect(appNeedsDatabase("Build a bakery website to browse the menu. Catalog only, no online ordering.")).toBe(false);
  });

  it("turns on when the user asks for a database", () => {
    expect(appNeedsDatabase("Browse only bakery, but store the menu in a database")).toBe(true);
  });

  it("turns on for orders, accounts, and other stored data", () => {
    expect(appNeedsDatabase("Build a bakery where customers can place standard pickup orders.")).toBe(true);
    expect(appNeedsDatabase("Todo app for my team")).toBe(true);
    expect(appNeedsDatabase("Clinic site where patients book appointments")).toBe(true);
    expect(appNeedsDatabase("Build a full stack app for my bakery")).toBe(true);
  });

  it("stays off when the user chose enquiry-only even if unselected options mention pop-ups", () => {
    const prompt = [
      "Build a single-page website for Arbor & Oak with booking enquiries.",
      "1. Ordering — How do customers work with you?",
      "   a) Enquiry-only (contact form for all business units)",
      "   b) Online checkout with modal popups",
      "   c) Pickup orders",
    ].join("\n");
    const answers = { "ordering-mode": "Enquiry-only (contact form for all business units)" };
    expect(appNeedsDatabase(prompt, answers)).toBe(false);
  });
});
