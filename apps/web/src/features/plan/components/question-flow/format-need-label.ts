const NEED_LABELS: Readonly<Record<string, string>> = {
  auth: "Accounts",
  payments: "Payments",
  realtime: "Live updates",
  admin: "Admin area",
  search: "Search and filters",
  fileUpload: "File uploads",
};

const WORD_BOUNDARY = /([a-z0-9])([A-Z])/g;

export function formatNeedLabel(need: string): string {
  const known = NEED_LABELS[need];
  if (known) return known;
  if (need.length === 0) return need;
  const spaced = need.replace(WORD_BOUNDARY, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
