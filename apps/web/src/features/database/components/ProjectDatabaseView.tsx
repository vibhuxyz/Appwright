import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useDatabaseOverview } from "../hooks/useDatabaseOverview";
import { DatabaseHeaderBanner } from "./DatabaseHeaderBanner";
import { DatabaseCollectionsList } from "./DatabaseCollectionsList";
import { DatabaseCollectionDetail } from "./DatabaseCollectionDetail";
import { DatabaseEmptyState } from "./DatabaseEmptyState";

export function ProjectDatabaseView({
  projectId,
  templateId,
}: {
  projectId?: string;
  projectName?: string;
  templateId?: string;
}) {
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"structure" | "records">("structure");

  const { data: overview, isLoading, refetch } = useDatabaseOverview(projectId);

  if (templateId === "vite-react") {
    return (
      <div className="space-y-6">
        <DatabaseEmptyState templateId={templateId} />
      </div>
    );
  }

  if (isLoading && !overview) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-xs text-muted">
        <Loader2 className="size-6 animate-spin text-amber-400" />
        <span>Loading database schema and collections…</span>
      </div>
    );
  }

  const collections = overview?.collections ?? [];
  const currentCollection =
    collections.find((c) => c.name === selectedCollection) ?? collections[0] ?? null;

  return (
    <div className="space-y-6">
      <DatabaseHeaderBanner
        overview={overview}
        isLoading={isLoading}
        onRefresh={() => void refetch()}
      />

      {overview?.status === "failed" ? (
        <DatabaseEmptyState
          isFailed
          errorMessage="Could not connect to the database instance."
          onRetry={() => void refetch()}
        />
      ) : collections.length === 0 ? (
        <DatabaseEmptyState
          templateId={templateId}
          onRetry={() => void refetch()}
        />
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <DatabaseCollectionsList
            collections={collections}
            selectedCollectionName={currentCollection?.name ?? null}
            onSelectCollection={(name) => {
              setSelectedCollection(name);
              setActiveTab("structure");
            }}
          />

          {currentCollection ? (
            <DatabaseCollectionDetail
              collection={currentCollection}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              projectId={projectId}
            />
          ) : (
            <div className="flex-1 rounded-2xl border border-border/70 bg-[#121622]/90 p-12 text-center text-xs text-muted">
              Select a collection to view its schema.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
