import type { Entity } from "@repo/contracts";
import { zodFieldExpr } from "./field-codegen";
import { CONNECT_IMPORT_LINE, modelImportLine } from "./mongoose-codegen";
import { toSlug } from "./slug";
import type { GeneratedFile } from "./types";

function zodSchemaBody(entity: Entity): string {
  return entity.fields
    .map((field) => `  ${field.name}: ${zodFieldExpr(field)},`)
    .join("\n");
}

export function collectionRouteSource(entity: Entity): string {
  return `import { NextResponse } from "next/server";
import { z } from "zod";
${CONNECT_IMPORT_LINE}
${modelImportLine(entity)}

const ${entity.name}Input = z.object({
${zodSchemaBody(entity)}
});

export async function GET() {
  await connectDb();
  const items = await ${entity.name}.find().sort({ createdAt: -1 });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const parsed = ${entity.name}Input.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Invalid ${entity.name} payload", details: parsed.error.flatten() } },
      { status: 400 },
    );
  }
  await connectDb();
  const item = await ${entity.name}.create(parsed.data);
  return NextResponse.json(item, { status: 201 });
}
`;
}

export function itemReadRouteSource(entity: Entity): string {
  return `import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
${CONNECT_IMPORT_LINE}
${modelImportLine(entity)}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDb();
  const item = isValidObjectId(id) ? await ${entity.name}.findById(id) : null;
  if (!item) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "${entity.name} not found" } }, { status: 404 });
  }
  return NextResponse.json(item);
}
`;
}

function itemRoute(entity: Entity): string {
  return `import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
${CONNECT_IMPORT_LINE}
${modelImportLine(entity)}

const ${entity.name}Update = z.object({
${zodSchemaBody(entity)}
}).partial();

function notFound() {
  return NextResponse.json({ error: { code: "NOT_FOUND", message: "${entity.name} not found" } }, { status: 404 });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) return notFound();
  await connectDb();
  const item = await ${entity.name}.findById(id);
  return item ? NextResponse.json(item) : notFound();
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) return notFound();
  const parsed = ${entity.name}Update.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Invalid ${entity.name} payload", details: parsed.error.flatten() } },
      { status: 400 },
    );
  }
  await connectDb();
  const item = await ${entity.name}.findByIdAndUpdate(id, parsed.data, { new: true, runValidators: true });
  return item ? NextResponse.json(item) : notFound();
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidObjectId(id)) return notFound();
  await connectDb();
  const deleted = await ${entity.name}.findByIdAndDelete(id);
  return deleted ? new NextResponse(null, { status: 204 }) : notFound();
}
`;
}

export function generateAdminApiRoutes(entity: Entity): GeneratedFile[] {
  const slug = toSlug(entity.name);
  return [
    { path: `src/app/api/admin/${slug}/route.ts`, content: collectionRouteSource(entity) },
    { path: `src/app/api/admin/${slug}/[id]/route.ts`, content: itemRoute(entity) },
  ];
}
