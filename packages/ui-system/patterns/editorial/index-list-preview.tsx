import { motion, useSpring, type MotionValue } from "framer-motion";
import { useEffect } from "react";
import { Media, type MediaImage } from "@/components/patterns/shared/media";
import { usePrefersReducedMotion } from "@/components/patterns/shared/reduced-motion";

const FOLLOW_SPRING = { stiffness: 300, damping: 22, mass: 0.4 } as const;
const PREVIEW_OFFSET_PX = 24;

export interface IndexListPreviewProps {
  images: readonly (MediaImage | undefined)[];
  activeIndex: number | null;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
}

export function IndexListPreview({ images, activeIndex, pointerX, pointerY }: IndexListPreviewProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const springX = useSpring(pointerX, FOLLOW_SPRING);
  const springY = useSpring(pointerY, FOLLOW_SPRING);
  const x = shouldReduceMotion ? pointerX : springX;
  const y = shouldReduceMotion ? pointerY : springY;
  const isActive = activeIndex !== null;
  useEffect(() => {
    if (!isActive) return;
    springX.jump(pointerX.get());
    springY.jump(pointerY.get());
  }, [isActive, pointerX, pointerY, springX, springY]);
  return (
    <motion.div
      aria-hidden="true"
      style={{ x, y, marginLeft: PREVIEW_OFFSET_PX, marginTop: PREVIEW_OFFSET_PX }}
      className={`pointer-events-none fixed top-0 left-0 z-30 hidden aspect-4/3 w-72 overflow-hidden bg-muted transition-opacity duration-200 ease-out md:block ${isActive ? "opacity-100" : "opacity-0"}`}
    >
      {images.map((image, index) =>
        image ? (
          <div
            key={`${image.alt}-${index}`}
            className={`absolute inset-0 transition-opacity duration-200 ease-out ${activeIndex === index ? "opacity-100" : "opacity-0"}`}
          >
            <Media image={image} fill ratio="4:3" />
          </div>
        ) : null,
      )}
    </motion.div>
  );
}
