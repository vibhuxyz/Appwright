export interface RawEscapeLocation {
  file?: string;
  line: number;
}

export interface RawEscape {
  value: string;
  count: number;
  locations: RawEscapeLocation[];
  recommendation?: string;
}

export interface ValidationIssue {
  type: "off_scale_value" | "unregistered_component" | "rule_violation";
  message: string;
  file?: string;
  line?: number;
  raw?: string;
}

export interface UiValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  escapes: RawEscape[];
  missingTokenSuggestions: string[];
}
