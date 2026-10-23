import type { Entity, EntityField } from "@repo/contracts";
import { toSlug } from "./slug";
import type { GeneratedFile } from "./types";

export const CONNECT_IMPORT_LINE = 'import { connectDb } from "@/lib/mongoose";';

export function modelImportLine(entity: Entity): string {
  return `import { ${entity.name} } from "@/models/${toSlug(entity.name)}";`;
}

function schemaTypeFor(type: EntityField["type"]): string {
  switch (type) {
    case "String":
      return "String";
    case "Int":
      return "Number";
    case "Boolean":
      return "Boolean";
    case "DateTime":
      return "Date";
    case "Json":
      return "Schema.Types.Mixed";
    default: {
      const exhaustive: never = type;
      throw new Error(`Unhandled field type: ${exhaustive}`);
    }
  }
}

function schemaFieldLine(field: EntityField): string {
  const options = [`type: ${schemaTypeFor(field.type)}`, `required: ${field.required}`];
  if (field.type === "Int") {
    options.push('validate: { validator: Number.isInteger, message: "must be an integer" }');
  }
  if (field.unique) {
    options.push("unique: true");
    if (!field.required) options.push("sparse: true");
  }
  return `    ${field.name}: { ${options.join(", ")} },`;
}

export function generateModelFile(entity: Entity): GeneratedFile {
  const name = entity.name;
  const fields = entity.fields.map(schemaFieldLine).join("\n");
  const content = `import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const ${name}Schema = new Schema(
  {
${fields}
  },
  { timestamps: true },
);

${name}Schema.set("toJSON", {
  versionKey: false,
  transform: (_document, serialized) => {
    const { _id, ...fields } = serialized;
    return { id: String(_id), ...fields };
  },
});

export type ${name}Doc = InferSchemaType<typeof ${name}Schema>;

export const ${name}: Model<${name}Doc> =
  (models.${name} as Model<${name}Doc> | undefined) ?? model<${name}Doc>("${name}", ${name}Schema);
`;
  return { path: `src/models/${toSlug(name)}.ts`, content };
}
