import { Loader2 } from "lucide-react";

interface PhotoSearchStatusProps {
  isLoading: boolean;
  error: Error | null;
  isEmpty: boolean;
  query: string;
}

export function PhotoSearchStatus({ isLoading, error, isEmpty, query }: PhotoSearchStatusProps) {
  if (isLoading) {
    return (
      <p className="flex items-center gap-1.5 text-[11px] text-muted">
        <Loader2 className="size-3 animate-spin" aria-hidden /> Searching…
      </p>
    );
  }
  if (error) {
    return (
      <p className="text-[11px] text-danger" role="alert">
        {error.message || "Photo search failed."}
      </p>
    );
  }
  if (isEmpty) {
    return <p className="text-[11px] text-muted">No photos found for “{query}”. Try a different search.</p>;
  }
  return null;
}
