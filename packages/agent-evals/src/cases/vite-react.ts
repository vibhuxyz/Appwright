import {
  completed,
  fileContains,
  maxCostUsd,
  maxToolCalls,
  noToolErrors,
  onlyWrites,
  readsBeforeWriting,
  typechecks,
  writesAtLeast,
  writtenFilesContain,
  writtenFilesLack,
} from "../graders";
import type { EvalCase } from "../core/types";

const SOURCE_FILES = /^src\/.*\.tsx$/;
const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/;
const ARBITRARY_BRACKET_VALUE = /\b[a-z-]+-\[[^\]]+\]/;

export const viteReactCases: readonly EvalCase[] = [
  {
    id: "vite-counter",
    template: "vite-react",
    prompt: "Replace the home screen with a counter: a number plus Increment and Decrement buttons.",
    tags: ["smoke", "ui"],
    graders: [
      completed,
      typechecks,
      readsBeforeWriting(),
      noToolErrors,
      fileContains("src/App.tsx", /Increment/),
      fileContains("src/App.tsx", /Decrement/),
      writtenFilesLack(SOURCE_FILES, HEX_COLOR),
      writtenFilesLack(SOURCE_FILES, ARBITRARY_BRACKET_VALUE),
      maxToolCalls(25),
      maxCostUsd(0.5),
    ],
  },
  {
    id: "vite-minimal-edit",
    template: "vite-react",
    prompt: "Change the heading text on the home screen to 'Welcome back'.",
    tags: ["smoke", "minimal-diff"],
    graders: [
      completed,
      typechecks,
      fileContains("src/App.tsx", /Welcome back/),
      onlyWrites(/^src\/App\.tsx$/),
      maxToolCalls(8),
      maxCostUsd(0.2),
    ],
  },
  {
    id: "vite-theme-tokens",
    template: "vite-react",
    prompt: "Make the home screen a pricing page with three plan cards (Free, Pro, Team), each with a price and a Choose button.",
    tags: ["ui", "design-system"],
    graders: [
      completed,
      typechecks,
      writtenFilesContain(SOURCE_FILES, /Free/),
      writtenFilesContain(SOURCE_FILES, /Pro/),
      writtenFilesContain(SOURCE_FILES, /Team/),
      writtenFilesLack(SOURCE_FILES, HEX_COLOR),
      writtenFilesLack(SOURCE_FILES, ARBITRARY_BRACKET_VALUE),
      maxCostUsd(0.5),
    ],
  },
  {
    id: "vite-multi-file-feature",
    template: "vite-react",
    prompt: "Add a todo list: a component in its own file with add and remove, rendered from the home screen. Keep state local.",
    tags: ["feature", "structure"],
    graders: [
      completed,
      typechecks,
      noToolErrors,
      writesAtLeast(2),
      fileContains("src/App.tsx", /import .*from/),
      maxCostUsd(0.5),
    ],
  },
] as const;
