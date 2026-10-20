import type { LayoutShellConfig, ShellLayout } from "./types";

export const SHELL_LAYOUTS: Readonly<Record<ShellLayout, LayoutShellConfig>> = {
  "sidebar-header": {
    id: "sidebar-header",
    name: "Sidebar + Header",
    headerHeight: "72px",
    sidebarWidth: "240px",
    mobileNav: "bottom",
    gridColumns: 12,
  },
  "top-nav": {
    id: "top-nav",
    name: "Top Navigation",
    headerHeight: "64px",
    mobileNav: "header",
    gridColumns: 12,
  },
  "split-pane": {
    id: "split-pane",
    name: "Split Pane",
    headerHeight: "56px",
    sidebarWidth: "320px",
    mobileNav: "drawer",
    gridColumns: 12,
  },
  stacked: {
    id: "stacked",
    name: "Stacked Content",
    headerHeight: "64px",
    mobileNav: "header",
    gridColumns: 8,
  },
  dashboard: {
    id: "dashboard",
    name: "Metrics Dashboard",
    headerHeight: "72px",
    sidebarWidth: "260px",
    mobileNav: "bottom",
    gridColumns: 12,
  },
};

export function getLayoutShell(id: ShellLayout): LayoutShellConfig {
  return SHELL_LAYOUTS[id] ?? SHELL_LAYOUTS["sidebar-header"];
}
