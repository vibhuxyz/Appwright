import { CONNECT_IMPORT_LINE, modelImportLine } from "@repo/admin-crud";
import type { Runtime } from "@repo/agent-core";
import type { Entity, EntityField } from "@repo/contracts";
import type { GeneratedAttempt } from "orchestrator";
import type { TaskDetail } from "./load-task-detail";

const SEED_ROWS_PER_ENTITY = 3;
const SEED_FILE = "scripts/seed.ts";

function seedValueFor(field: EntityField, index: number): string {
  switch (field.type) {
    case "String":
      return `"${field.name} ${index}"`;
    case "Int":
      return String(index);
    case "Boolean":
      return index % 2 === 0 ? "true" : "false";
    case "DateTime":
      return "new Date()";
    case "Json":
      return "{}";
    default: {
      const exhaustive: never = field.type;
      throw new Error(`Unhandled field type: ${exhaustive}`);
    }
  }
}

function seedRowsFor(entity: Entity): string {
  const rows = Array.from({ length: SEED_ROWS_PER_ENTITY }, (_, i) => {
    const index = i + 1;
    const fields = entity.fields.map((field) => `      ${field.name}: ${seedValueFor(field, index)},`).join("\n");
    return `    {\n${fields}\n    },`;
  }).join("\n");
  return `  await ${entity.name}.insertMany([\n${rows}\n  ]);`;
}

function buildSeedFile(entities: readonly Entity[]): string {
  const imports = entities.map(modelImportLine).join("\n");
  const calls = entities.map((entity) => seedRowsFor(entity)).join("\n\n");
  return `import mongoose from "mongoose";
${CONNECT_IMPORT_LINE}
${imports}

async function main() {
  await connectDb();
${calls}
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
`;
}

export async function generateSeedAttempt(
  task: TaskDetail,
  runtime: Runtime,
): Promise<GeneratedAttempt> {
  if (task.entities.length === 0) {
    return { kind: "failed", costCents: 0, error: "No entities to seed" };
  }

  await runtime.writeFile(SEED_FILE, buildSeedFile(task.entities));
  return { kind: "completed", costCents: 0, writtenPaths: [SEED_FILE] };
}
