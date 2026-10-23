import { useQuery } from "@tanstack/react-query";
import { databaseApi } from "../api/databaseApi";

export function collectionDocumentsQueryKey(
  projectId: string,
  collectionName: string,
  skip: number,
  limit: number,
) {
  return ["collection-documents", projectId, collectionName, skip, limit] as const;
}

export function useCollectionDocuments(
  projectId: string | undefined,
  collectionName: string | undefined,
  page = 0,
  limit = 25,
) {
  const skip = page * limit;
  return useQuery({
    queryKey: collectionDocumentsQueryKey(
      projectId ?? "",
      collectionName ?? "",
      skip,
      limit,
    ),
    queryFn: ({ signal }) =>
      databaseApi.getDocuments(
        projectId ?? "",
        collectionName ?? "",
        { limit, skip },
        signal,
      ),
    enabled: Boolean(projectId && collectionName),
  });
}
