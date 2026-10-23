export function rawPhoto(id: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id,
    description: null,
    alt_description: "a loaf of bread on a table",
    width: 4000,
    height: 2667,
    urls: {
      small: `https://images.unsplash.com/photo-${id}?w=400`,
      regular: `https://images.unsplash.com/photo-${id}?w=1080`,
    },
    user: { name: "Ada Baker", links: { html: "https://unsplash.com/@adabaker" } },
    links: {
      html: `https://unsplash.com/photos/${id}`,
      download_location: `https://api.unsplash.com/photos/${id}/download?ixid=abc`,
    },
    ...overrides,
  };
}

export function searchBody(results: readonly unknown[], total = results.length): string {
  return JSON.stringify({ total, total_pages: total === 0 ? 0 : 1, results });
}

export function jsonResponse(body: string, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(body, { status, headers: { "Content-Type": "application/json", ...headers } });
}
