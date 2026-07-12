import fs from "node:fs";

export type ProviderName = "openai" | "gemini" | "anthropic";
type AuthEntry = string | { type?: string; key?: unknown };

export class AuthStorage {
  private static readonly AUTH_FILE = "auth.json";

  private static readData(): Record<string, AuthEntry> {
    if (!fs.existsSync(this.AUTH_FILE)) {
      return {};
    }

    try {
      return JSON.parse(fs.readFileSync(this.AUTH_FILE, "utf-8"));
    } catch (error) {
      return {};
    }
  }

  public static getApiKey(provider: ProviderName): string {
    const data = this.readData();
    const entry = data[provider];

    if (typeof entry === "string") {
      return entry;
    }

    if (entry && typeof entry === "object" && typeof entry.key === "string") {
      return entry.key;
    }

    // Default trial key if no key is set for gemini
    if (provider === "gemini") {
        return "";
    }

    return "";
  }

  public static setApiKey(provider: ProviderName, key: string): void {
    const data = this.readData();
    data[provider] = { type: "api", key: key };
    fs.writeFileSync(this.AUTH_FILE, JSON.stringify(data, null, 2));
  }

  public static deleteApiKey(provider: ProviderName): void {
    const data = this.readData();
    delete data[provider];
    fs.writeFileSync(this.AUTH_FILE, JSON.stringify(data, null, 2));
  }

  public static getAuthenticatedProviders(): ProviderName[] {
    return (["openai", "gemini"] as ProviderName[]).filter((provider) =>
      this.isAuthenticated(provider),
    );
  }

  public static isAuthenticated(provider: ProviderName): boolean {
    return !!this.getApiKey(provider);
  }

  public static hasStoredApiKey(provider: ProviderName): boolean {
    const data = this.readData();
    return !!data[provider];
  }

  // Maintaining compatibility for trial methods used in chat.ts
  public static isTrialActive(): boolean {
      return true;
  }

  public static setTrialActive(active: boolean): void {}
  public static getTrialRemainingTokens(): number { return 5000; }
  public static updateTrialUsage(tokens: number): void {}
}
