import { useEffect, useState, type RefObject } from "react";
import { REVEAL_ROOT_MARGIN } from "@/components/patterns/shared/motion";

export type RevealState = "idle" | "armed" | "shown";

function isBelowViewport(element: Element): boolean {
  return element.getBoundingClientRect().top > window.innerHeight;
}

export function useRevealState(
  ref: RefObject<Element | null>,
  isEnabled: boolean,
): RevealState {
  const [state, setState] = useState<RevealState>("idle");
  useEffect(() => {
    const element = ref.current;
    if (!element || !isEnabled || !isBelowViewport(element)) return;
    setState("armed");
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setState("shown");
        observer.disconnect();
      },
      { rootMargin: REVEAL_ROOT_MARGIN },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, isEnabled]);
  return isEnabled ? state : "idle";
}
