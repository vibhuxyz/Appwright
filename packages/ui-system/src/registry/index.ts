// The vocabulary. Exported as DATA, not as a prompt string, because the same
// object has two jobs: it is summarised into the system prompt now (V1.1),
// and it is what V4's per-task verification checks a diff against. A
// hand-written prompt paragraph plus a separate validator list is two
// definitions that drift (D10).
//
// Keep this list to primitives a generated page actually imports.
// An unused registry entry is inventory with no demand.

export interface RegistryEntry {
  /** Where the implementation comes from. `shadcn/ui` means the source is
   *  vendored into the template under `src/components/ui/`. */
  source: "shadcn/ui";
  /** Files the template must contain for this entry to be composable. */
  file: string;
  /** The props that change how it looks. Anything not listed is an
   *  invention, and at V4 an invention is a failed check. */
  variants?: string[];
  sizes?: string[];
  /** Sub-components exported from the same file. */
  parts?: string[];
  allowed: boolean;
  /** One line. This ships in the prompt, so it competes for context with
   *  everything else the agent needs to know (O8). */
  use: string;
}

export const registry = {
  Button: {
    source: "shadcn/ui",
    file: "src/components/ui/button.tsx",
    variants: [
      "default",
      "secondary",
      "outline",
      "ghost",
      "link",
      "destructive",
    ],
    sizes: ["sm", "default", "lg", "icon"],
    allowed: true,
    use: "clickable action; `asChild` wraps a link; `isLoading` during requests",
  },
  Card: {
    source: "shadcn/ui",
    file: "src/components/ui/card.tsx",
    parts: [
      "CardHeader",
      "CardTitle",
      "CardDescription",
      "CardContent",
      "CardFooter",
    ],
    allowed: true,
    use: "a bounded surface — pricing tier, stat, list item",
  },
  Input: {
    source: "shadcn/ui",
    file: "src/components/ui/input.tsx",
    allowed: true,
    use: "single-line text entry",
  },
  Label: {
    source: "shadcn/ui",
    file: "src/components/ui/label.tsx",
    allowed: true,
    use: "always pair with an Input; htmlFor is not optional",
  },
  Select: {
    source: "shadcn/ui",
    file: "src/components/ui/select.tsx",
    parts: ["SelectTrigger", "SelectValue", "SelectContent", "SelectItem"],
    allowed: true,
    use: "pick one of a known set",
  },
  Dialog: {
    source: "shadcn/ui",
    file: "src/components/ui/dialog.tsx",
    parts: [
      "DialogTrigger",
      "DialogContent",
      "DialogHeader",
      "DialogTitle",
      "DialogDescription",
      "DialogFooter",
    ],
    allowed: true,
    use: "modal; Radix handles focus trap and Escape",
  },
  Badge: {
    source: "shadcn/ui",
    file: "src/components/ui/badge.tsx",
    variants: ["default", "secondary", "outline", "destructive"],
    allowed: true,
    use: "short status or category label",
  },
  Table: {
    source: "shadcn/ui",
    file: "src/components/ui/table.tsx",
    parts: [
      "TableHeader",
      "TableBody",
      "TableRow",
      "TableHead",
      "TableCell",
      "TableCaption",
    ],
    allowed: true,
    use: "tabular data with a header row",
  },
  Tabs: {
    source: "shadcn/ui",
    file: "src/components/ui/tabs.tsx",
    parts: ["TabsList", "TabsTrigger", "TabsContent"],
    allowed: true,
    use: "switch between sibling views in one place",
  },
  Modal: {
    source: "shadcn/ui",
    file: "src/components/ui/modal.tsx",
    parts: ["ConfirmModal"],
    allowed: true,
    use: "popup (trigger, title); ConfirmModal for destructive confirms",
  },
  Toast: {
    source: "shadcn/ui",
    file: "src/components/ui/toast.tsx",
    parts: ["Toaster", "toast"],
    allowed: true,
    use: "action feedback: toast.success(title), toast.error(title); Toaster is in the layout",
  },
  Carousel: {
    source: "shadcn/ui",
    file: "src/components/ui/carousel.tsx",
    parts: ["CarouselContent", "CarouselItem", "CarouselPrevious", "CarouselNext"],
    allowed: true,
    use: "sliding gallery or featured items; autoPlayMs optional",
  },
  Testimonials: {
    source: "shadcn/ui",
    file: "src/components/ui/testimonials.tsx",
    parts: ["TestimonialCard"],
    allowed: true,
    use: "reviews carousel; items=[{quote,name,role,rating}]",
  },
  Skeleton: {
    source: "shadcn/ui",
    file: "src/components/ui/skeleton.tsx",
    allowed: true,
    use: "placeholder while data loads",
  },
  PageSkeleton: {
    source: "shadcn/ui",
    file: "src/components/ui/page-skeleton.tsx",
    variants: ["page", "cards", "table", "detail"],
    parts: ["CardGridSkeleton", "TableSkeleton", "DetailSkeleton"],
    allowed: true,
    use: "whole-page loading; use in every loading.tsx",
  },
  Spinner: {
    source: "shadcn/ui",
    file: "src/components/ui/spinner.tsx",
    sizes: ["sm", "default", "lg"],
    allowed: true,
    use: "inline wait indicator",
  },
} as const satisfies Record<string, RegistryEntry>;

export type PrimitiveName = keyof typeof registry;

export const ICON_LIBRARY = "lucide-react";

export function allowedPrimitives(): PrimitiveName[] {
  return (Object.keys(registry) as PrimitiveName[]).filter(
    (n) => registry[n].allowed,
  );
}
