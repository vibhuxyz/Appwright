import {
  assetRequestFrameSchema,
  deltaFrameSchema,
  messageFrameSchema,
  statusFrameSchema,
  usageFrameSchema,
  type ConversationStreamHandlers,
} from "./types";

// Owns the EventSource lifecycle so no React component reaches for
// `new EventSource` directly. Raw event → parse → validate → dispatch.
export function connectConversationStream(
  url: string,
  handlers: ConversationStreamHandlers,
): () => void {
  const source = new EventSource(url);

  source.addEventListener("message", (e) => {
    const frame = messageFrameSchema.parse(JSON.parse((e as MessageEvent).data));
    handlers.onMessage(frame);
  });

  source.addEventListener("status", (e) => {
    const frame = statusFrameSchema.parse(JSON.parse((e as MessageEvent).data));
    handlers.onStatus(frame);
  });

  source.addEventListener("delta", (e) => {
    const frame = deltaFrameSchema.parse(JSON.parse((e as MessageEvent).data));
    handlers.onDelta(frame);
  });

  source.addEventListener("usage", (e) => {
    const frame = usageFrameSchema.parse(JSON.parse((e as MessageEvent).data));
    handlers.onUsage(frame);
  });

  source.addEventListener("assetRequest", (e) => {
    const frame = assetRequestFrameSchema.parse(JSON.parse((e as MessageEvent).data));
    handlers.onAssetRequest?.(frame);
  });

  return () => source.close();
}
