import type { IntegrationCatalogEntry, IntegrationCategory } from "@repo/contracts";

export type CatalogFilter = "all" | IntegrationCategory;

export function filterIntegrationCatalog(
  catalog: readonly IntegrationCatalogEntry[],
  category: CatalogFilter,
  searchText: string,
): IntegrationCatalogEntry[] {
  const query = searchText.trim().toLowerCase();
  return catalog.filter((entry) => {
    if (category !== "all" && entry.category !== category) return false;
    if (!query) return true;
    const searchableText = [entry.name, entry.description, ...entry.capabilities]
      .join(" ")
      .toLowerCase();
    return searchableText.includes(query);
  });
}
