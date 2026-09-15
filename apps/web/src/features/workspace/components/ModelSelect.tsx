export function ModelSelect({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (model: string) => void;
}) {
  return (
    <select
      className="max-w-[150px] cursor-pointer truncate rounded-lg border border-border-soft bg-surface-2 px-2 py-1 text-[11px] text-foreground-secondary transition-colors outline-none hover:text-foreground focus:border-border disabled:cursor-not-allowed disabled:opacity-50"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      <optgroup label="OpenAI">
        <option value="gpt-5.4-mini">gpt-5.4-mini — default</option>
        <option value="gpt-5.4">gpt-5.4</option>
        <option value="gpt-5.2-codex">gpt-5.2-codex</option>
      </optgroup>
      <optgroup label="Gemini">
        <option value="gemini-3.7-flash">gemini-3.7-flash</option>
        <option value="gemini-3.1-pro-preview">gemini-3.1-pro</option>
      </optgroup>
      <optgroup label="Groq — free, fast, for iterating">
        <option value="openai/gpt-oss-120b">gpt-oss-120b</option>
        <option value="openai/gpt-oss-20b">gpt-oss-20b</option>
        <option value="llama-3.3-70b-versatile">llama-3.3-70b</option>
      </optgroup>
      <option value="grok-beta">grok-beta (xAI)</option>
      <option value="llama3-groq-70b-8192-tool-use-preview">llama3-70b (Groq)</option>
    </select>
  );
}
