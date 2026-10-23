import type { Viewport } from "../findings";
import type {
  ActionResult,
  ClickTarget,
  FieldDescriptor,
  FormDescriptor,
  InteractionOutcome,
} from "./interaction-types";

export interface PageMeasurements {
  readonly viewportWidth: number;
  readonly scrollWidth: number;
  readonly bodyTextLength: number;
  readonly overflowing: readonly string[];
  readonly brokenImages: readonly string[];
  readonly unlabelledControls: readonly string[];
  readonly links: readonly string[];
}

export interface BadResponse {
  readonly url: string;
  readonly status: number;
}

export interface ObservedEvents {
  readonly consoleErrors: readonly string[];
  readonly pageErrors: readonly string[];
  readonly failedRequests: readonly string[];
  readonly badResponses: readonly BadResponse[];
}

export interface NavigationResult {
  readonly status: number | null;
  readonly error?: string;
}

export interface BrowserPage {
  navigate(url: string): Promise<NavigationResult>;
  scrollThrough(): Promise<void>;
  measure(): Promise<PageMeasurements>;
  snapshot(): Promise<string>;
  screenshot(filePath: string): Promise<void>;
  drainEvents(): ObservedEvents;
  listForms(): Promise<FormDescriptor[]>;
  listClickTargets(): Promise<ClickTarget[]>;
  fillField(formIndex: number, field: FieldDescriptor, value: string): Promise<ActionResult<void>>;
  submitForm(formIndex: number): Promise<ActionResult<InteractionOutcome>>;
  clickTarget(index: number): Promise<ActionResult<InteractionOutcome>>;
  close(): Promise<void>;
}

export interface BrowserSession {
  openPage(viewport: Viewport): Promise<BrowserPage>;
  close(): Promise<void>;
}

export class BrowserUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BrowserUnavailableError";
  }
}
