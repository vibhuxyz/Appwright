import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// `cn` is not a style helper, it is a conflict resolver. `clsx` flattens
// conditionals; `twMerge` makes a later `p-6` actually beat an earlier
// `p-4` instead of both landing in the class list and letting CSS source
// order decide. Without it, every component's `className` prop is a
// suggestion rather than an override.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
