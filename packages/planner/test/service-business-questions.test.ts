import { describe, expect, it } from "bun:test";
import { selectDiscoveryQuestions } from "../src";

describe("service business discovery", () => {
  it("recognises a landing page written with a space and asks only the service questions that change the build", () => {
    const needs = selectDiscoveryQuestions("RK Home Planner landing page to show his 2D and 3D naksha work in Ranchi").map((question) => question.need);
    expect(needs).toEqual(["business-name", "business-contacts", "primary-action"]);
  });

  it("keeps the ordering questions for a business that sells goods", () => {
    const needs = selectDiscoveryQuestions("build a bakery website with a menu").map((question) => question.need);
    expect(needs).toContain("ordering-mode");
    expect(needs).not.toContain("primary-action");
  });
});
