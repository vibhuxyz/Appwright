export type ShellLayout = "sidebar-header" | "top-nav" | "split-pane" | "stacked" | "dashboard";

export interface LayoutShellConfig {
  id: ShellLayout;
  name: string;
  headerHeight: string;
  sidebarWidth?: string;
  mobileNav: "bottom" | "drawer" | "header";
  gridColumns: number;
}
