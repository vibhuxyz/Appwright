import { motion } from 'framer-motion';

export const Spinner = ({ className = "" }: { className?: string }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
    className={`inline-block size-6 rounded-full border-2 border-solid border-current border-r-transparent ${className}`}
    role="status"
  >
    <span className="sr-only">Loading…</span>
  </motion.div>
);
