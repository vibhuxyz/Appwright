import { ElementSelectionSchema, type ElementSelection } from "@repo/contracts";
import { z } from "zod";

export const SET_EDIT_MODE_MESSAGE = "aw:edit-mode";

const SelectMessageSchema = z.object({
  type: z.literal("aw:select"),
  selection: ElementSelectionSchema,
});

const ReadyMessageSchema = z.object({ type: z.literal("aw:ready") });

const InspectorMessageSchema = z.union([SelectMessageSchema, ReadyMessageSchema]);

export type InspectorMessage =
  | { type: "select"; selection: ElementSelection }
  | { type: "ready" };

export function parseInspectorMessage(
  event: MessageEvent<unknown>,
  frameWindow: Window | null,
): InspectorMessage | null {
  if (frameWindow === null || event.source !== frameWindow) return null;
  const parsed = InspectorMessageSchema.safeParse(event.data);
  if (!parsed.success) return null;
  return parsed.data.type === "aw:select"
    ? { type: "select", selection: parsed.data.selection }
    : { type: "ready" };
}

export function describeSelection(selection: ElementSelection): string {
  const text = selection.text.slice(0, 32);
  return text ? `${selection.tag} · “${text}”` : selection.tag;
}
