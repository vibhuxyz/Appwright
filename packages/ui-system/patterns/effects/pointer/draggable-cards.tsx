import { motion } from "framer-motion";
import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/components/ui/utils";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

const KEY_STEP_PX = 24;
const DRAG_ELASTIC = 0.2;
const RELEASE_SPRING = { bounceStiffness: 300, bounceDamping: 24 } as const;
const KEY_OFFSETS: Readonly<Record<string, readonly [number, number]>> = {
  ArrowLeft: [-KEY_STEP_PX, 0],
  ArrowRight: [KEY_STEP_PX, 0],
  ArrowUp: [0, -KEY_STEP_PX],
  ArrowDown: [0, KEY_STEP_PX],
};

export interface DraggableCard {
  id: string;
  label: string;
  content: ReactNode;
  left: number;
  top: number;
  rotate?: number;
}

export interface DraggableCardsProps {
  cards: readonly DraggableCard[];
  label: string;
  className?: string;
  cardClassName?: string;
}

type Offset = { x: number; y: number };

export function DraggableCards({
  cards,
  label,
  className,
  cardClassName,
}: DraggableCardsProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();
  const [order, setOrder] = useState<readonly string[]>(cards.map((card) => card.id));
  const [offsets, setOffsets] = useState<Readonly<Record<string, Offset>>>({});

  function raise(id: string) {
    setOrder((current) => [...current.filter((entry) => entry !== id), id]);
  }

  function handleKey(id: string, event: KeyboardEvent<HTMLDivElement>) {
    const step = KEY_OFFSETS[event.key];
    if (!step) return;
    event.preventDefault();
    raise(id);
    setOffsets((current) => {
      const previous = current[id] ?? { x: 0, y: 0 };
      return { ...current, [id]: { x: previous.x + step[0], y: previous.y + step[1] } };
    });
  }

  return (
    <div
      ref={stageRef}
      role="group"
      aria-label={label}
      data-testid="draggable-stage"
      className={cn("relative isolate overflow-hidden", className)}
    >
      {cards.map((card) => (
        <motion.div
          key={card.id}
          role="button"
          tabIndex={0}
          aria-label={`${card.label}. Drag, or use the arrow keys to move it.`}
          data-testid="draggable-card"
          drag
          dragConstraints={stageRef}
          dragElastic={DRAG_ELASTIC}
          dragMomentum={!shouldReduceMotion}
          dragTransition={RELEASE_SPRING}
          onPointerDown={() => raise(card.id)}
          onKeyDown={(event) => handleKey(card.id, event)}
          animate={offsets[card.id] ?? { x: 0, y: 0 }}
          whileDrag={shouldReduceMotion ? undefined : { scale: 1.03 }}
          className={cn(
            "absolute cursor-grab touch-none select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:cursor-grabbing",
            cardClassName,
          )}
          style={{
            left: `${card.left}%`,
            top: `${card.top}%`,
            rotate: card.rotate ?? 0,
            zIndex: order.indexOf(card.id) + 1,
          }}
        >
          {card.content}
        </motion.div>
      ))}
    </div>
  );
}
