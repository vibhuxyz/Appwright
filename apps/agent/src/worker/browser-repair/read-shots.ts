import { readFile, stat } from "node:fs/promises";
import { MAX_SHOT_BYTES, type ReviewShot } from "@repo/agent-core";

export interface ShotFile {
  readonly route: string;
  readonly viewport: string;
  readonly filePath: string;
}

export interface ReadShots {
  readonly shots: ReviewShot[];
  readonly skipped: { readonly filePath: string; readonly reason: string }[];
}

export async function readShots(files: readonly ShotFile[]): Promise<ReadShots> {
  const sized = await Promise.all(files.map(async (file) => ({ file, bytes: (await stat(file.filePath)).size })));
  const skipped = sized
    .filter(({ bytes }) => bytes > MAX_SHOT_BYTES)
    .map(({ file, bytes }) => ({ filePath: file.filePath, reason: `${bytes} bytes is over the ${MAX_SHOT_BYTES}-byte limit` }));
  const shots = await Promise.all(
    sized
      .filter(({ bytes }) => bytes <= MAX_SHOT_BYTES)
      .map(async ({ file }) => ({ route: file.route, viewport: file.viewport, png: new Uint8Array(await readFile(file.filePath)) })),
  );
  return { shots, skipped };
}
