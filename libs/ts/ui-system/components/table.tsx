import type * as React from "react";
import { cn } from "@/components/ui/utils";

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  // The wrapper is not decoration. A table has an intrinsic minimum width;
  // without an overflow container it forces the whole page to scroll
  // sideways on a phone instead of scrolling inside its own box.
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table data-slot="table" className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b", className)} {...props} />;
}

export function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("border-b border-border transition-colors hover:bg-muted/50", className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn("h-10 px-2 text-left align-middle text-sm font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td data-slot="table-cell" className={cn("p-2 align-middle", className)} {...props} />;
}

export function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption data-slot="table-caption" className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  );
}
