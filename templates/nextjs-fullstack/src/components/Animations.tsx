"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface Props extends HTMLMotionProps<"div"> {
  children: ReactNode;
  delay?: number;
}

export const FadeIn = ({
  children,
  delay = 0,
  className = "",
  ...props
}: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, delay, ease: "easeOut" }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);

export const ClickScale = ({ children, className = "", ...props }: Props) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.95 }}
    className={className}
    {...props}
  >
    {children}
  </motion.div>
);
