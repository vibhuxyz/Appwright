import { describe, expect, test } from "bun:test";
import type { Runtime } from "@repo/agent-core";
import { editFileTool, readFileTool, writeFileTool } from "../src/fs";

function runtime(read: () => Promise<string> = async () => "secret-source"): Runtime {
  return {
    readFile: read,
    writeFile: async () => {
      throw new Error("writeFile should not run");
    },
    listDir: async () => [],
    exec: async () => ({ stdout: "", stderr: "", exitCode: 0 }),
  };
}

describe("generated UI primitives", () => {
  test("read_file returns an import stub and does not open the file", async () => {
    let opened = false;
    const result = await readFileTool(
      { path: "src/components/ui/button.tsx" },
      runtime(async () => {
        opened = true;
        return "export function Button() {}";
      }),
    );
    expect(opened).toBe(false);
    expect(result).toContain("@/components/ui/button");
    expect(result).toContain("Do not read or edit");
    expect(result).not.toContain("export function Button");
  });

  test("write_file refuses to overwrite a primitive", async () => {
    await expect(
      writeFileTool(
        { path: "src/components/ui/card.tsx", content: "nope" },
        runtime(),
      ),
    ).rejects.toThrow(/generated UI primitive/);
  });

  test("edit_file refuses to patch a primitive", async () => {
    await expect(
      editFileTool(
        {
          path: "src/components/ui/tabs.tsx",
          oldString: "a",
          newString: "b",
        },
        runtime(),
      ),
    ).rejects.toThrow(/generated UI primitive/);
  });

  test("ordinary source files still read through the runtime", async () => {
    const result = await readFileTool(
      { path: "src/app/page.tsx" },
      runtime(async () => "export default function Page() {}"),
    );
    expect(result).toContain("export default function Page");
  });
});
