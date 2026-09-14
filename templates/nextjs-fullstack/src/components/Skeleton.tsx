import { motion } from "framer-motion";

export const Skeleton = ({ className = "" }: { className?: string }) => (
  <motion.div
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
    className={`rounded-md bg-muted ${className}`}
  />
);
