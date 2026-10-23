import { lazy, Suspense } from "react";
import { createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router";
import { RootLayout } from "@/app/layouts/RootLayout";
import { DashboardPage } from "@/routes/DashboardPage";
import { ProjectPage } from "@/routes/ProjectPage";

const SectionCatalogPage = lazy(() =>
  import("@/features/section-catalog").then((module) => ({ default: module.SectionCatalogPage })),
);

function SectionCatalogRoute() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted">Loading sections</p>}>
      <SectionCatalogPage />
    </Suspense>
  );
}

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

const sectionCatalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sections",
  component: SectionCatalogRoute,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  dashboardRedirectRoute,
  projectRoute,
  sectionCatalogRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
