import { useAuthStore } from "@/stores/authStore";
import { useBillingModalStore } from "@/features/billing/store/billingModalStore";
import { CreditsBadge } from "@/features/billing/components/CreditsBadge";
import { ProjectList } from "./ProjectList";

export function ProjectsDashboard() {
  const user = useAuthStore((s) => s.user)!;
  const openAddCredits = useBillingModalStore((s) => s.openAddCredits);

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
            <p className="mt-1 text-sm text-muted">
              One sentence in, a running app out. Pick up where you left off.
            </p>
          </div>
          <CreditsBadge credits={user.credits ?? 0} onClick={openAddCredits} />
        </div>

        <ProjectList />
      </div>
    </div>
  );
}
