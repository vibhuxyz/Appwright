import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        // Lime is THE product action: create, generate, continue, send.
        // One per screen region — never a lime border, icon or heading.
        primary: "bg-lime text-background-deep hover:brightness-110",
        // Pink means money/premium/promotion — deploy to production, upgrade.
        premium:
          "bg-linear-to-r from-pink to-pink-light text-white shadow-lg shadow-pink/20 hover:brightness-110",
        secondary: "bg-surface-3 text-foreground hover:bg-surface-2",
        danger: "bg-danger text-white hover:brightness-110",
        ghost: "border border-border bg-surface text-foreground hover:bg-surface-3",
        outline: "border border-border bg-transparent text-foreground-secondary hover:text-foreground",
        link: "text-muted underline hover:text-foreground",
      },
      // "sm"/"md" match the small pill-style action buttons used across
      // panels; "lg" matches the full-width form-submit buttons (auth,
      // create-project) that were plain text-sized before this primitive
      // existed — keep that size to avoid a visual regression there.
      size: {
        sm: "px-2.5 py-1 text-xs",
        md: "px-4 py-1.5 text-xs",
        lg: "w-full px-4 py-2.5 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
