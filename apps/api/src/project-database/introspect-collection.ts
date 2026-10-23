import type { DatabaseCollection, DatabaseField, DatabaseIndex, Entity } from "@repo/contracts";
import type { getMongoClient } from "@repo/db";

type MongoDb = ReturnType<ReturnType<typeof getMongoClient>["db"]>;

export function inferType(val: unknown, key: string): string {
  if (key === "_id") return "ObjectId";
  if (val === null || val === undefined) return "String";
  if (val instanceof Date) return "DateTime";
  if (typeof val === "boolean") return "Boolean";
  if (typeof val === "number") return Number.isInteger(val) ? "Int" : "Number";
  if (Array.isArray(val)) return "Array";
  if (typeof val === "object") {
    if ("toHexString" in val) return "ObjectId";
    return "Json";
  }
  return "String";
}

export async function introspectLiveCollection(
  db: MongoDb,
  name: string,
): Promise<DatabaseCollection> {
  const count = await db.collection(name).countDocuments().catch(() => 0);
  const rawIndexes = (await db.collection(name).indexes().catch(() => [])) as Array<Record<string, unknown>>;
  const samples = (await db.collection(name).find().limit(5).toArray().catch(() => [])) as Array<Record<string, unknown>>;

  const indexes: DatabaseIndex[] = rawIndexes.map((idx: Record<string, unknown>) => {
    const keysRecord: Record<string, number> = {};
    if (typeof idx.key === "object" && idx.key !== null) {
      for (const [k, v] of Object.entries(idx.key as Record<string, unknown>)) {
        keysRecord[k] = typeof v === "number" ? v : 1;
      }
    }
    return {
      name: typeof idx.name === "string" ? idx.name : "unnamed",
      keys: keysRecord,
      unique: Boolean(idx.unique),
      sparse: Boolean(idx.sparse),
    };
  });

  const fieldMap = new Map<string, DatabaseField>();

  for (const sample of samples) {
    for (const [key, val] of Object.entries(sample)) {
      if (!fieldMap.has(key)) {
        const isIndexed = indexes.some((idx) => key in idx.keys);
        const isUnique = indexes.some((idx) => idx.unique && Object.keys(idx.keys).length === 1 && key in idx.keys);
        fieldMap.set(key, {
          name: key,
          type: inferType(val, key),
          required: key === "_id",
          unique: key === "_id" || isUnique,
          indexed: key === "_id" || isIndexed,
        });
      }
    }
  }

  if (!fieldMap.has("_id")) {
    fieldMap.set("_id", {
      name: "_id",
      type: "ObjectId",
      required: true,
      unique: true,
      indexed: true,
    });
  }

  return {
    name,
    documentCount: count,
    fields: Array.from(fieldMap.values()),
    indexes,
  };
}

export function mergeBlueprintEntities(
  collections: DatabaseCollection[],
  entities: Entity[],
): void {
  for (const ent of entities) {
    const collName = `${ent.name.toLowerCase()}s`;
    const existing = collections.find(
      (c) => c.name.toLowerCase() === collName || c.name.toLowerCase() === ent.name.toLowerCase(),
    );
    if (existing) {
      for (const f of ent.fields) {
        const matchField = existing.fields.find((ef) => ef.name === f.name);
        if (matchField) {
          matchField.type = f.type;
          matchField.required = f.required;
          matchField.unique = Boolean(f.unique);
        } else {
          existing.fields.push({
            name: f.name,
            type: f.type,
            required: f.required,
            unique: Boolean(f.unique),
            indexed: Boolean(f.unique),
          });
        }
      }
    } else {
      collections.push({
        name: collName,
        documentCount: 0,
        fields: [
          { name: "_id", type: "ObjectId", required: true, unique: true, indexed: true },
          ...ent.fields.map((f) => ({
            name: f.name,
            type: f.type,
            required: f.required,
            unique: Boolean(f.unique),
            indexed: Boolean(f.unique),
          })),
        ],
        indexes: [{ name: "_id_", keys: { _id: 1 }, unique: true }],
      });
    }
  }
}
