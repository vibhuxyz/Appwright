import type * as React from "react";
import { cn } from "@/components/ui/utils";
import { Skeleton } from "@/components/ui/skeleton";

const CARD_PLACEHOLDER_KEYS = ["a", "b", "c"] as const;
const ROW_PLACEHOLDER_KEYS = ["a", "b", "c", "d", "e"] as const;

export function CardGridSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {CARD_PLACEHOLDER_KEYS.map((key) => (
        <div
          key={key}
          className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
        >
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <Skeleton className="h-10 w-full" />
      {ROW_PLACEHOLDER_KEYS.map((key) => (
        <Skeleton key={key} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function DetailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-8 md:grid-cols-2", className)}>
      <Skeleton className="aspect-square w-full" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-1/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-10 w-40" />
      </div>
    </div>
  );
}

export type PageSkeletonVariant = "page" | "cards" | "table" | "detail";

export interface PageSkeletonProps extends React.ComponentProps<"div"> {
  variant?: PageSkeletonVariant;
}

function PageSkeletonBody({ variant }: { variant: PageSkeletonVariant }) {
  switch (variant) {
    case "cards":
      return <CardGridSkeleton />;
    case "table":
      return <TableSkeleton />;
    case "detail":
      return <DetailSkeleton />;
    case "page":
      return (
        <>
          <div className="flex flex-col items-center gap-4 py-8">
            <Skeleton className="h-10 w-2/3 max-w-xl" />
            <Skeleton className="h-5 w-1/2 max-w-md" />
          </div>
          <CardGridSkeleton />
        </>
      );
    default: {
      const unreachable: never = variant;
      return unreachable;
    }
  }
}

export function PageSkeleton({
  variant = "page",
  className,
  ...props
}: PageSkeletonProps) {
  return (
    <div
      data-slot="page-skeleton"
      role="status"
      aria-busy="true"
      aria-label="Loading content"
      className={cn("mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10", className)}
      {...props}
    >
      <PageSkeletonBody variant={variant} />
      <span className="sr-only">Loading content</span>
    </div>
  );
}
