import { useRef } from "react";
import type { editor } from "monaco-editor";

// The editor instance is imperative — it must not live in React state, or
// every keystroke-driven internal change would fight a render.
export function useEditor() {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleMount = (instance: editor.IStandaloneCodeEditor) => {
    editorRef.current = instance;
  };

  return { editorRef, handleMount };
}
