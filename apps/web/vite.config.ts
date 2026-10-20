import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function denyContractsNodeBuiltins() {
  return {
    name: "deny-contracts-node-builtins",
    enforce: "pre" as const,
    resolveId(source: string, importer: string | undefined) {
      if (
        !importer?.includes(`${path.sep}packages${path.sep}contracts${path.sep}`) &&
        !importer?.includes(`${path.sep}@repo${path.sep}contracts${path.sep}`)
      ) {
        return;
      }
      if (
        source === "node:fs" ||
        source === "node:fs/promises" ||
        source === "node:path" ||
        source === "node:url"
      ) {
        throw new Error(
          `Node builtin "${source}" from ${importer} cannot ship in the web client. Import @repo/contracts/files from server code only.`,
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), denyContractsNodeBuiltins()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  server: { port: 3000, strictPort: true },
});
