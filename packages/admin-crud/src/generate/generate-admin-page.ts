import type { Entity } from "@repo/contracts";
import { formValueExprFor, htmlInputTypeFor } from "./field-codegen";
import { CONNECT_IMPORT_LINE, modelImportLine } from "./mongoose-codegen";
import { toSlug } from "./slug";
import type { GeneratedFile } from "./types";

function formFields(entity: Entity): string {
  return entity.fields
    .map(
      (field) =>
        `        <label className="flex flex-col gap-1 text-sm">
          ${field.name}
          <input name="${field.name}" type="${htmlInputTypeFor(field.type)}" required={${field.required}} className="rounded border px-2 py-1" />
        </label>`,
    )
    .join("\n");
}

function parseFormFields(entity: Entity): string {
  return entity.fields.map((field) => `      ${field.name}: ${formValueExprFor(field, "form")},`).join("\n");
}

function tableHeaders(entity: Entity): string {
  return entity.fields.map((field) => `              <th className="p-2 text-left">${field.name}</th>`).join("\n");
}

function tableCells(entity: Entity): string {
  return entity.fields.map((field) => `                <td className="p-2">{String(item.${field.name})}</td>`).join("\n");
}

export function generateAdminView(entity: Entity): GeneratedFile {
  const slug = toSlug(entity.name);
  const content = `import { revalidatePath } from "next/cache";
${CONNECT_IMPORT_LINE}
${modelImportLine(entity)}

async function create${entity.name}(mountPath: string, form: FormData) {
  "use server";
  await connectDb();
  await ${entity.name}.create({
${parseFormFields(entity)}
  });
  revalidatePath(mountPath);
}

async function delete${entity.name}(mountPath: string, id: string) {
  "use server";
  await connectDb();
  await ${entity.name}.findByIdAndDelete(id);
  revalidatePath(mountPath);
}

export default async function ${entity.name}AdminView({ mountPath }: { mountPath: string }) {
  await connectDb();
  const items = await ${entity.name}.find().sort({ createdAt: -1 });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold">${entity.name}</h1>

      <form action={create${entity.name}.bind(null, mountPath)} className="flex flex-col gap-2">
${formFields(entity)}
        <button type="submit" className="rounded bg-foreground px-3 py-1.5 text-background">
          Add ${entity.name}
        </button>
      </form>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
${tableHeaders(entity)}
            <th className="p-2" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-t">
${tableCells(entity)}
              <td className="p-2 text-right">
                <form action={delete${entity.name}.bind(null, mountPath, item.id)}>
                  <button type="submit" className="text-red-600">
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
`;
  return { path: `src/admin/${slug}/index.tsx`, content };
}
