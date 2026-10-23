export function scopedMongoUri(params: {
  adminUri: string;
  databaseName: string;
  username?: string;
  password?: string;
}): string {
  const url = new URL(params.adminUri);
  url.pathname = `/${params.databaseName}`;
  if (params.username && params.password) {
    url.username = params.username;
    url.password = params.password;
    url.searchParams.set("authSource", params.databaseName);
  }
  return url.toString();
}

export function mongoUriDatabaseName(uri: string): string | null {
  try {
    const pathname = new URL(uri).pathname.replace(/^\//, "");
    return pathname.length > 0 ? pathname : null;
  } catch {
    return null;
  }
}
