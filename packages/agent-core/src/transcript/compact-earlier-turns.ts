import type { Attachment } from "@repo/contracts";
import type { Message } from "../types";

type TextMessage = Extract<Message, { type: "text" }>;

function attachmentNote(attachments: readonly Attachment[]): string {
  const names = attachments.map((attachment) => `${attachment.name} (${attachment.type})`).join(", ");
  return `[Attached in an earlier turn: ${names}. Its content was used then; ask the user to attach it again if you need to see it.]`;
}

function compactText(message: TextMessage): TextMessage {
  const attachments = message.attachments ?? [];
  const content = attachments.length > 0 ? `${message.content}\n\n${attachmentNote(attachments)}` : message.content;
  return { role: message.role, type: "text", content };
}

export function compactEarlierTurns(messages: readonly Message[]): Message[] {
  return messages.flatMap((message) => (message.type === "text" ? [compactText(message)] : []));
}
