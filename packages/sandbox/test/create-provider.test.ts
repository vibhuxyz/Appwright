import { afterEach, describe, expect, it } from "bun:test";
import {
  createSandboxProviderFromEnv,
  E2BSandboxProvider,
  LocalSandboxProvider,
} from "../src";

describe("createSandboxProviderFromEnv", () => {
  const original = process.env.SANDBOX_PROVIDER;

  afterEach(() => {
    if (original === undefined) delete process.env.SANDBOX_PROVIDER;
    else process.env.SANDBOX_PROVIDER = original;
  });

  it("returns LocalSandboxProvider when SANDBOX_PROVIDER is unset", () => {
    delete process.env.SANDBOX_PROVIDER;
    expect(createSandboxProviderFromEnv()).toBeInstanceOf(LocalSandboxProvider);
  });

  it("returns LocalSandboxProvider when SANDBOX_PROVIDER is local", () => {
    process.env.SANDBOX_PROVIDER = "local";
    expect(createSandboxProviderFromEnv()).toBeInstanceOf(LocalSandboxProvider);
  });

  it("returns E2BSandboxProvider when SANDBOX_PROVIDER is e2b", () => {
    process.env.SANDBOX_PROVIDER = "e2b";
    expect(createSandboxProviderFromEnv()).toBeInstanceOf(E2BSandboxProvider);
  });

  it("throws on an unknown SANDBOX_PROVIDER value", () => {
    process.env.SANDBOX_PROVIDER = "firecracker";
    expect(() => createSandboxProviderFromEnv()).toThrow(/Unknown SANDBOX_PROVIDER/);
  });
});
