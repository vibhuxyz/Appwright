import { createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router";
import { RootLayout } from "@/app/layouts/RootLayout";
import { DashboardPage } from "@/routes/DashboardPage";
import { ProjectPage } from "@/routes/ProjectPage";

const rootRoute = createRootRoute({ component: RootLayout });

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

const dashboardRedirectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});

interface ProjectSearch {
  view?: "editor" | "console";
}

const projectRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/p/$projectId",
  validateSearch: (search: Record<string, unknown>): ProjectSearch => ({
    view: search.view === "editor" || search.view === "console" ? search.view : undefined,
  }),
  component: () => {
    const { projectId } = projectRoute.useParams();
    const search = projectRoute.useSearch();
    return <ProjectPage projectId={projectId} initialView={search.view} />;
  },
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  dashboardRedirectRoute,
  projectRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
