import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { languageFromPath } from "@/shared/utils/languageFromPath";
import { useEditor } from "../hooks/useEditor";

// @monaco-editor/react defaults to fetching Monaco from a jsdelivr CDN at
// runtime. We already ship `monaco-editor` as a real dependency (see
// FilesPane's lazy() split) — point the loader at that bundled copy so nothing
// here depends on a third-party CDN being reachable or version-pinned.
loader.config({ monaco });

// Monaco's own "vs-dark" is #1E1E1E, one shade off our surface — close enough
// to look like a bug. Repaint its chrome with the palette instead.
const THEME = "appwright-dark";
monaco.editor.defineTheme(THEME, {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "77797c", fontStyle: "italic" },
    { token: "keyword", foreground: "f43abc" },
    { token: "string", foreground: "e3fc18" },
    { token: "number", foreground: "4aa8ff" },
    { token: "type", foreground: "3b8fac" },
  ],
  colors: {
    "editor.background": "#1C1D1F",
    "editorGutter.background": "#1C1D1F",
    "editor.lineHighlightBackground": "#232425",
    "editorLineNumber.foreground": "#4b4d50",
    "editorLineNumber.activeForeground": "#b0b1b2",
    "editorIndentGuide.background1": "#252729",
    "editorWidget.background": "#232425",
    "editorWidget.border": "#303234",
  },
});

// Read-only: file contents come from the agent's sandbox, never from a user
// edit here — see D16, edits go through the agent's own tool, not this UI.
export function CodeEditor({ path, content }: { path: string; content: string }) {
  const { handleMount } = useEditor();

  return (
    <Editor
      key={path}
      language={languageFromPath(path)}
      value={content}
      theme={THEME}
      onMount={handleMount}
      options={{
        readOnly: true,
        minimap: { enabled: false },
        fontSize: 12.5,
        lineHeight: 20,
        padding: { top: 12, bottom: 12 },
        scrollBeyondLastLine: false,
        renderLineHighlight: "none",
        smoothScrolling: true,
        overviewRulerLanes: 0,
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
      }}
    />
  );
}
