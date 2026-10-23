import z from "zod";

export const ELEMENT_SELECTION_LIMITS = {
  route: 200,
  tag: 40,
  text: 300,
  classes: 400,
  selector: 400,
  html: 1500,
} as const;

export const ElementSelectionSchema = z.object({
  route: z.string().max(ELEMENT_SELECTION_LIMITS.route),
  tag: z.string().min(1).max(ELEMENT_SELECTION_LIMITS.tag),
  text: z.string().max(ELEMENT_SELECTION_LIMITS.text),
  classes: z.string().max(ELEMENT_SELECTION_LIMITS.classes),
  selector: z.string().max(ELEMENT_SELECTION_LIMITS.selector),
  html: z.string().max(ELEMENT_SELECTION_LIMITS.html),
});

export type ElementSelection = z.infer<typeof ElementSelectionSchema>;

export const INSPECTOR_ACCENT_COLOR = "#e3fc18";

export const INSPECTOR_CURSOR_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"><g stroke="#080809" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4.1 12 6"/><path d="m5.1 8-2.9-.8"/><path d="m6 12-1.9 2"/><path d="M7.2 2.2 8 5.1"/><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" fill="#080809"/></g><g stroke="#e3fc18" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4.1 12 6"/><path d="m5.1 8-2.9-.8"/><path d="m6 12-1.9 2"/><path d="M7.2 2.2 8 5.1"/><path d="M9.037 9.69a.498.498 0 0 1 .653-.653l11 4.5a.5.5 0 0 1-.074.949l-4.349 1.041a1 1 0 0 0-.74.739l-1.04 4.35a.5.5 0 0 1-.95.074z" fill="#e3fc18"/></g></svg>';

export const INSPECTOR_CURSOR_BASE64 =
  "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj48ZyBzdHJva2U9IiMwODA4MDkiIHN0cm9rZS13aWR0aD0iMy41IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Ik0xNCA0LjEgMTIgNiIvPjxwYXRoIGQ9Im01LjEgOC0yLjktLjgiLz48cGF0aCBkPSJtNiAxMi0xLjkgMiIvPjxwYXRoIGQ9Ik03LjIgMi4yIDggNS4xIi8+PHBhdGggZD0iTTkuMDM3IDkuNjlhLjQ5OC40OTggMCAwIDEgLjY1My0uNjUzbDExIDQuNWEuNS41IDAgMCAxLS4wNzQuOTQ5bC00LjM0OSAxLjA0MWExIDEgMCAwIDAtLjc0LjczOWwtMS4wNCA0LjM1YS41LjUgMCAwIDEtLjk1LjA3NHoiIGZpbGw9IiMwODA4MDkiLz48L2c+PGcgc3Ryb2tlPSIjZTNmYzE4IiBzdHJva2Utd2lkdGg9IjEuNzUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE0IDQuMSAxMiA2Ii8+PHBhdGggZD0ibTUuMSA4LTIuOS0uOCIvPjxwYXRoIGQ9Im02IDEyLTEuOSAyIi8+PHBhdGggZD0iTTcuMiAyLjIgOCA1LjEiLz48cGF0aCBkPSJNOS4wMzcgOS42OWEuNDk4LjQ5OCAwIDAgMSAuNjUzLS42NTNsMTEgNC41YS41LjUgMCAwIDEtLjA3NC45NDlsLTQuMzQ5IDEuMDQxYTEgMSAwIDAgMC0uNzQuNzM5bC0xLjA0IDQuMzVhLjUuNSAwIDAgMS0uOTUuMDc0eiIgZmlsbD0iI2UzZmMxOCIvPjwvZz48L3N2Zz4=";

export const INSPECTOR_CURSOR_CSS = `url("data:image/svg+xml;base64,${INSPECTOR_CURSOR_BASE64}") 9 9, crosshair`;
