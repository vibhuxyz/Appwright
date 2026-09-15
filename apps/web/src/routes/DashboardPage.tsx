import { AppHeader } from "@/app/layouts/AppHeader";
import { ProjectsDashboard } from "@/features/projects/components/ProjectsDashboard";

export function DashboardPage() {
  return (
    <>
      <AppHeader />
      <ProjectsDashboard />
    </>
  );
}
