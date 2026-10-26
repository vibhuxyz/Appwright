import { listProjectFiles } from "@repo/contracts/files";
import { crc32, deflateRawSync } from "node:zlib";

interface ProjectEntry {
  path: string;
  content: string;
}

function writeZipEntry(
  entry: ProjectEntry,
  offset: number,
): { local: Buffer; central: Buffer; nextOffset: number } {
  const nameBuf = Buffer.from(entry.path, "utf8");
  const dataBuf = Buffer.from(entry.content, "utf8");
  const crc = crc32(dataBuf);
  const compressed = deflateRawSync(dataBuf);

  const local = Buffer.alloc(30 + nameBuf.length + compressed.length);
  local.write("PK\x03\x04", 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6);
  local.writeUInt16LE(8, 8);
  local.writeUInt16LE(0, 10);
  local.writeUInt16LE(0, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(dataBuf.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  local.writeUInt16LE(0, 28);
  nameBuf.copy(local, 30);
  compressed.copy(local, 30 + nameBuf.length);

  const central = Buffer.alloc(46 + nameBuf.length);
  central.write("PK\x01\x02", 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(0, 12);
  central.writeUInt16LE(0, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(dataBuf.length, 24);
  central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt16LE(0, 30);
  central.writeUInt16LE(0, 32);
  central.writeUInt16LE(0, 34);
  central.writeUInt16LE(0, 36);
  central.writeUInt32LE(0, 38);
  central.writeUInt32LE(offset, 42);
  nameBuf.copy(central, 46);

  return { local, central, nextOffset: offset + local.length };
}

function writeEndRecord(count: number, centralSize: number, offset: number): Buffer {
  const end = Buffer.alloc(22);
  end.write("PK\x05\x06", 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(count, 8);
  end.writeUInt16LE(count, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return end;
}

export async function createProjectZip(
  projectId: string,
  sessionId?: string,
): Promise<Buffer> {
  const allFiles = await listProjectFiles(projectId, sessionId);
  const safeFiles = allFiles.filter(
    (f) => !f.path.startsWith(".env") && !f.path.includes("/.env"),
  );

  const localChunks: Buffer[] = [];
  const centralChunks: Buffer[] = [];
  let currentOffset = 0;

  for (const file of safeFiles) {
    const { local, central, nextOffset } = writeZipEntry(file, currentOffset);
    localChunks.push(local);
    centralChunks.push(central);
    currentOffset = nextOffset;
  }

  const centralSize = centralChunks.reduce((sum, b) => sum + b.length, 0);
  const endRecord = writeEndRecord(safeFiles.length, centralSize, currentOffset);

  return Buffer.concat([...localChunks, ...centralChunks, endRecord]);
}
