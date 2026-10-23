import type { Finding, Viewport } from "../findings";
import type { BrowserSession } from "../session";

export interface ExploreOptions {
  readonly baseUrl: string;
  readonly routes: readonly string[];
  readonly session: BrowserSession;
  readonly outputDir: string;
  readonly viewports?: readonly Viewport[];
  readonly interact?: boolean;
  readonly onActivity?: (label: string) => void;
}

export interface ExploreReport {
  readonly routes: readonly string[];
  readonly pagesChecked: number;
  readonly formsTested: number;
  readonly buttonsClicked: number;
  readonly findings: readonly Finding[];
  readonly screenshots: readonly string[];
  readonly notes: readonly string[];
}

export interface DiscoveredLink {
  readonly href: string;
  readonly from: string;
}

export interface VisitResult {
  readonly findings: readonly Finding[];
  readonly links: readonly DiscoveredLink[];
}
