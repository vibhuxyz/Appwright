// Slot ids are `${pageRoute}:${component}:${index}`, and page routes start with
// `/`. A raw slash adds a path segment, so Express answers 404 Not Found.
export function assetSlotPath(assetRequestId: string, slotId: string, action: string): string {
  return `/asset-requests/${encodeURIComponent(assetRequestId)}/slots/${encodeURIComponent(slotId)}/${action}`;
}
