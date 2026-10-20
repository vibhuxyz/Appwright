import { useEffect, useRef, useState, type RefObject } from "react";
import { originOf, parseFrameSelection } from "../lib/frame-message";
import { useDesignState } from "../store/design-state";
import type { FrameSelection } from "../schemas/editor-schemas";

export function useFrameSelection(frameRef: RefObject<HTMLIFrameElement | null>, previewUrl: string) {
  const [selection, setSelection] = useState<FrameSelection | null>(null);
  const select = useDesignState((s) => s.select);
  const selectRef = useRef(select);

  useEffect(() => {
    selectRef.current = select;
  }, [select]);

  useEffect(() => {
    const frameOrigin = originOf(previewUrl);
    if (frameOrigin === null) return;
    const onMessage = (event: MessageEvent<unknown>) => {
      const next = parseFrameSelection(event, frameRef.current?.contentWindow ?? null, frameOrigin);
      if (next === null) return;
      setSelection(next);
      selectRef.current(next.awId);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [frameRef, previewUrl]);

  return selection;
}
