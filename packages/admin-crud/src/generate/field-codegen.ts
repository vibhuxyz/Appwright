import type { EntityField } from "@repo/contracts";

function zodTypeFor(type: EntityField["type"]): string {
  switch (type) {
    case "String":
      return "z.string()";
    case "Int":
      return "z.number().int()";
    case "Boolean":
      return "z.boolean()";
    case "DateTime":
      return "z.coerce.date()";
    case "Json":
      return "z.unknown()";
    default: {
      const exhaustive: never = type;
      throw new Error(`Unhandled field type: ${exhaustive}`);
    }
  }
}

export function zodFieldExpr(field: EntityField): string {
  const base = zodTypeFor(field.type);
  return field.required ? base : `${base}.optional()`;
}

export function htmlInputTypeFor(type: EntityField["type"]): string {
  switch (type) {
    case "String":
      return "text";
    case "Int":
      return "number";
    case "Boolean":
      return "checkbox";
    case "DateTime":
      return "datetime-local";
    case "Json":
      return "text";
    default: {
      const exhaustive: never = type;
      throw new Error(`Unhandled field type: ${exhaustive}`);
    }
  }
}

export function formValueExprFor(field: EntityField, formVar: string): string {
  switch (field.type) {
    case "String":
    case "DateTime":
    case "Json":
      return `String(${formVar}.get("${field.name}") ?? "")`;
    case "Int":
      return `Number(${formVar}.get("${field.name}"))`;
    case "Boolean":
      return `${formVar}.get("${field.name}") === "on"`;
    default: {
      const exhaustive: never = field.type;
      throw new Error(`Unhandled field type: ${exhaustive}`);
    }
  }
}
