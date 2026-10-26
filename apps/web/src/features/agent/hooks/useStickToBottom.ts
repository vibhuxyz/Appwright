import { useEffect, type RefObject } from "react";

const PINNED_THRESHOLD_PX = 80;

export function useStickToBottom(listRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let isPinned = true;
    let frameHandle = 0;
    const scrollToBottom = () => {
      frameHandle = 0;
      if (isPinned) list.scrollTop = list.scrollHeight;
    };
    const schedule = () => {
      if (frameHandle === 0) frameHandle = requestAnimationFrame(scrollToBottom);
    };
    const onScroll = () => {
      isPinned = list.scrollHeight - list.scrollTop - list.clientHeight < PINNED_THRESHOLD_PX;
    };
    list.addEventListener("scroll", onScroll, { passive: true });
    const mutations = new MutationObserver(schedule);
    mutations.observe(list, { childList: true, subtree: true, characterData: true });
    const resizes = new ResizeObserver(schedule);
    resizes.observe(list);
    schedule();
    return () => {
      list.removeEventListener("scroll", onScroll);
      mutations.disconnect();
      resizes.disconnect();
      if (frameHandle !== 0) cancelAnimationFrame(frameHandle);
    };
  }, [listRef]);
}
