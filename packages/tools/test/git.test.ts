import { describe, expect, it } from "bun:test";
import { parseGitDiff } from "../src/git";

describe("parseGitDiff", () => {
  it("returns empty array for empty diff", () => {
    expect(parseGitDiff("")).toEqual([]);
    expect(parseGitDiff("   ")).toEqual([]);
  });

  it("parses single modified file diff", () => {
    const raw = `diff --git a/src/index.ts b/src/index.ts
index abc..def 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,3 +1,4 @@
 import React from 'react';
+import { useState } from 'react';
-console.log('old');
`;
    const result = parseGitDiff(raw);
    expect(result).toHaveLength(1);
    expect(result[0]?.path).toBe("src/index.ts");
    expect(result[0]?.status).toBe("modified");
    expect(result[0]?.additions).toBe(1);
    expect(result[0]?.deletions).toBe(1);
  });

  it("detects added file", () => {
    const raw = `diff --git a/new-file.ts b/new-file.ts
new file mode 100644
index 0000000..1234567
--- /dev/null
+++ b/new-file.ts
@@ -0,0 +1,2 @@
+export const x = 1;
+export const y = 2;
`;
    const result = parseGitDiff(raw);
    expect(result).toHaveLength(1);
    expect(result[0]?.path).toBe("new-file.ts");
    expect(result[0]?.status).toBe("added");
    expect(result[0]?.additions).toBe(2);
    expect(result[0]?.deletions).toBe(0);
  });
});
