function blueprintIdFromData(data: unknown): string | undefined {
  if (!data || typeof data !== "object" || !("blueprintId" in data)) return undefined;
  const value = (data as { blueprintId: unknown }).blueprintId;
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function approvedBlueprintIdFromRows(rows: readonly { data: unknown }[]): string | undefined {
  for (let index = rows.length - 1; index >= 0; index--) {
    const blueprintId = blueprintIdFromData(rows[index]?.data);
    if (blueprintId) return blueprintId;
  }
  return undefined;
}
