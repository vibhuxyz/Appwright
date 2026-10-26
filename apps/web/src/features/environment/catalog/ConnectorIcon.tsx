import type { IntegrationCatalogEntry } from "@repo/contracts";
import { IntegrationLogo } from "@/shared/components/integration-logo";

export function ConnectorIcon({ entry }: { entry: IntegrationCatalogEntry }) {
  return <IntegrationLogo provider={entry.provider} className="size-6" />;
}
