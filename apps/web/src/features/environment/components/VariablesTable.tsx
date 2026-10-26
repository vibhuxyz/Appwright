import { useState } from "react";
import { Plus } from "lucide-react";
import {
  ALL_INTEGRATION_CREDENTIAL_KEYS,
  type DatabaseSource,
  type IntegrationEnvironment,
  type ProjectEnvironmentVariableResponse,
  type VariableScope,
} from "@repo/contracts";
import { cn } from "@/shared/lib/cn";
import { AddVariableForm } from "./AddVariableForm";
import { DatabaseSourceRow } from "./DatabaseSourceRow";
import { VariableRow } from "./VariableRow";

type SecretSection = "system" | "project" | "integration";

const SECTIONS: readonly SecretSection[] = ["system", "project", "integration"];
const SYSTEM_KEY_PREFIX = "APPWRITE_";
const TABLE_COLUMNS = ["Key", "Source", "Type", "Current Value", "Requirement"] as const;

interface VariablesTableProps {
  variables: readonly ProjectEnvironmentVariableResponse[];
  database: DatabaseSource;
  selectedEnv: IntegrationEnvironment;
  onSetVariable: (input: { environment: VariableScope; key: string; value: string; isSecret: boolean }) => void;
  onDeleteVariable: (input: { environment: VariableScope; key: string }) => void;
}

function sectionOf(key: string): SecretSection {
  if (key.startsWith(SYSTEM_KEY_PREFIX)) return "system";
  return ALL_INTEGRATION_CREDENTIAL_KEYS.has(key) ? "integration" : "project";
}

function emptyMessage(section: SecretSection, environment: IntegrationEnvironment): string {
  if (section === "system") return "Appwright platform credentials stay in the server secret store and are never listed here.";
  if (section === "integration") return `No integration credentials are saved for ${environment}. Manage them from Connectors.`;
  return `No project variables are registered for ${environment}.`;
}

export function VariablesTable({ variables, database, selectedEnv, onSetVariable, onDeleteVariable }: VariablesTableProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [section, setSection] = useState<SecretSection>("project");
  const rows = variables.filter((variable) => sectionOf(variable.key) === section);
  const showsDatabase = section === "integration" && database.source !== "NOT_REQUIRED";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground">Environment Variables</h2>
          <p className="text-xs text-muted">Values and masked secrets for the {selectedEnv} environment.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-border hover:bg-surface-2"
        >
          <Plus className="size-3.5 text-lime" />
          <span>Add Variable</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Secret categories">
        {SECTIONS.map((item) => (
          <button
            key={item}
            id={`secret-tab-${item}`}
            type="button"
            role="tab"
            aria-selected={section === item}
            aria-controls="secret-category-panel"
            onClick={() => setSection(item)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs capitalize focus-visible:outline-2 focus-visible:outline-lime",
              section === item ? "border-lime bg-lime/10 text-lime" : "border-border text-muted hover:text-foreground",
            )}
          >
            {item} keys
          </button>
        ))}
      </div>

      {isAdding && section === "project" && (
        <AddVariableForm
          selectedEnv={selectedEnv}
          onSave={(input) => {
            onSetVariable(input);
            setIsAdding(false);
          }}
          onCancel={() => setIsAdding(false)}
        />
      )}

      <div id="secret-category-panel" role="tabpanel" aria-labelledby={`secret-tab-${section}`} className="overflow-hidden rounded-2xl border border-border/70 bg-surface">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-border/60 bg-surface-2/40 text-[11px] font-semibold text-muted">
            <tr>
              {TABLE_COLUMNS.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-foreground">
            {showsDatabase && <DatabaseSourceRow database={database} environment={selectedEnv} />}
            {rows.length === 0 && !showsDatabase ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-xs text-muted">{emptyMessage(section, selectedEnv)}</td>
              </tr>
            ) : (
              rows.map((variable) => (
                <VariableRow
                  key={`${variable.environment}-${variable.key}`}
                  variable={variable}
                  sourceLabel={section === "integration" ? "Integration" : "Project"}
                  canDelete={section === "project"}
                  onDelete={onDeleteVariable}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
