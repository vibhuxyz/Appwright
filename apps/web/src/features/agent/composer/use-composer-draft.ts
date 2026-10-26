import { useMemo, useState } from "react";
import { useEnhancePrompt } from "../hooks/useSendMessage";
import { evaluatePrompt } from "../utils/evaluatePrompt";
import { getPromptSuggestions } from "../utils/promptSuggestions";

export function useComposerDraft(running: boolean) {
  const enhancePrompt = useEnhancePrompt();
  const [input, setInput] = useState("");
  const [prevInput, setPrevInput] = useState<string | null>(null);
  const [enhancedSuccess, setEnhancedSuccess] = useState(false);

  const trimmed = input.trim();
  const { quality, tip } = evaluatePrompt(trimmed, enhancedSuccess);
  const suggestions = useMemo(() => getPromptSuggestions(trimmed), [trimmed]);

  const clear = () => {
    setInput("");
    setPrevInput(null);
    setEnhancedSuccess(false);
  };

  const enhance = () => {
    if (!trimmed || enhancePrompt.isPending || running) return;
    enhancePrompt.mutate(trimmed, {
      onSuccess: (res) => {
        setPrevInput(trimmed);
        setInput(res.enhancedPrompt);
        setEnhancedSuccess(true);
      },
    });
  };

  const applySuggestion = (appendText: string) => {
    setInput((current) => {
      const currentTrimmed = current.trim();
      return currentTrimmed ? `${currentTrimmed}${appendText}` : appendText.trim();
    });
  };

  const undo = () => {
    if (prevInput === null) return;
    setInput(prevInput);
    setPrevInput(null);
    setEnhancedSuccess(false);
  };

  const change = (value: string) => {
    setInput(value);
    setEnhancedSuccess(false);
  };

  return { input, trimmed, quality, tip, suggestions, enhancedSuccess, canUndo: prevInput !== null, enhancePrompt, clear, enhance, applySuggestion, undo, change };
}
