import { Skeleton } from "@/shared/components/ui/Skeleton";

export function ProjectListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-12 border border-border" />
      ))}
    </div>
  );
}
