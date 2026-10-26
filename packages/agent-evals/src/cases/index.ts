import type { EvalCase } from "../core/types";
import { nextjsCases } from "./nextjs";
import { viteReactCases } from "./vite-react";

export const ALL_CASES: readonly EvalCase[] = [...viteReactCases, ...nextjsCases];
