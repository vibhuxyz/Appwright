import { useEffect, type RefObject } from "react";
import { useSelectionStore } from "../store/selection-store";
import { parseInspectorMessage, SET_EDIT_MODE_MESSAGE } from "../lib/inspector-protocol";

export function useInspector(frameRef: RefObject<HTMLIFrameElement | null>, frameKey: string) {
  const isEditMode = useSelectionStore((s) => s.isEditMode);
  const select = useSelectionStore((s) => s.select);

  useEffect(() => {
    const tellFrame = () =>
      frameRef.current?.contentWindow?.postMessage(
        { type: SET_EDIT_MODE_MESSAGE, enabled: isEditMode },
        "*",
      );
    const onMessage = (event: MessageEvent<unknown>) => {
      const message = parseInspectorMessage(event, frameRef.current?.contentWindow ?? null);
      if (message === null) return;
      if (message.type === "ready") tellFrame();
      else select(message.selection);
    };
    window.addEventListener("message", onMessage);
    tellFrame();
    return () => window.removeEventListener("message", onMessage);
  }, [frameRef, frameKey, isEditMode, select]);
}
