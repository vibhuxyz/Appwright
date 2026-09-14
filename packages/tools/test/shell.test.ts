import { describe, expect, test } from "bun:test";
import { guardBashArgv } from "../src/shell";

describe("guardBashArgv (D24 — no installing packages the agent invented)", () => {
  test("rejects a package not on deps.allow.json", () => {
    expect(() => guardBashArgv(["npm", "install", "left-pad"])).toThrow();
  });

  test("allows a listed package and forces --ignore-scripts", () => {
    const argv = guardBashArgv(["npm", "install", "zod"]);
    expect(argv).toContain("--ignore-scripts");
  });

  test("does not touch non-install commands", () => {
    const argv = ["npm", "run", "build"];
    expect(guardBashArgv(argv)).toEqual(argv);
  });

  test("does not touch non-package-manager commands", () => {
    const argv = ["ls", "-la"];
    expect(guardBashArgv(argv)).toEqual(argv);
  });
});
