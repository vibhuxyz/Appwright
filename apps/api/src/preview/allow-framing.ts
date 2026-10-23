import type { OutgoingHttpHeaders } from "node:http";

const FRAME_ANCESTORS_DIRECTIVE = /^\s*frame-ancestors(\s|$)/i;

function withoutFrameAncestors(policy: string): string {
  return policy
    .split(";")
    .filter((directive) => !FRAME_ANCESTORS_DIRECTIVE.test(directive))
    .join(";")
    .trim();
}

function policyValues(value: OutgoingHttpHeaders[string]): string[] {
  if (value === undefined) return [];
  return (Array.isArray(value) ? value : [value]).map(String);
}

export function allowFraming(headers: OutgoingHttpHeaders): OutgoingHttpHeaders {
  const { "x-frame-options": _frameOptions, "content-security-policy": policy, ...rest } = headers;
  const policies = policyValues(policy).map(withoutFrameAncestors).filter((value) => value.length > 0);
  return policies.length > 0 ? { ...rest, "content-security-policy": policies.join(", ") } : rest;
}
