import { ICON_LIBRARY, registry, type RegistryEntry } from "./registry";
import { fontSize, letterSpacing, radius, spacing } from "./tokens";

// The registry, compressed to what actually changes the agent's output:
// names, the variants it may pass, and one line of when. Dumping the full
// registry would spend context on components this task will never use —
// which is O8 arriving early (V1.1 trap table).
//
// Enforcement is NOT here. At V1.1 this is a vocabulary the agent reads; the
// validator that rejects a diff needs the Blueprint and per-task
// verification, neither of which exists before V4.

function line(name: string, entry: RegistryEntry): string {
  const bits: string[] = [name];
  if (entry.variants) bits.push(`variant=${entry.variants.join("|")}`);
  if (entry.sizes) bits.push(`size=${entry.sizes.join("|")}`);
  if (entry.parts) bits.push(`+ ${entry.parts.join(", ")}`);
  return `- ${bits.join("  ")} — ${entry.use}`;
}

export function uiSystemPromptSection(): string {
  const entries = Object.entries(
    registry as Record<string, RegistryEntry>,
  ).filter(([, e]) => e.allowed);

  return `## UI system — compose, do not invent

These primitives are already in the project under \`src/components/ui/\`. Import and compose
them. Do NOT hand-roll a button, card, modal, or select that already exists here.
Do not read_file or edit those files — this section is the API.
Home pages: Testimonials + Carousel. Popups: Modal. Forms: toast.success/error. loading.tsx: PageSkeleton. Buttons waiting: isLoading or Spinner.

${entries.map(([name, entry]) => line(name, entry)).join("\n")}

Icons: \`${ICON_LIBRARY}\`. Import the named icon, never inline an SVG path.

**Use scale classes, not bracket values.** A bracket value like \`p-[17px]\`, \`rounded-[30px]\`
or \`text-[32px]\` is a last resort, not a default — every one of them is a number outside the
design system that nothing else in the app will ever match.

- spacing / padding / gap / margin: ${Object.keys(spacing).join(" ")}
- radius: ${Object.keys(radius).join(" ")}
- text: ${Object.keys(fontSize).join(" ")}
- tracking: ${Object.keys(letterSpacing).join(" ")} (\`tracking-caps\` is the uppercase eyebrow label)
- colour: use the semantic names — \`bg-background\`, \`text-foreground\`, \`bg-primary\`
  \`text-primary-foreground\`, \`bg-muted\`, \`text-muted-foreground\`, \`border-border\`,
  \`bg-card\`, \`bg-destructive\`. Never \`bg-gray-900\`: the semantic names already handle
  dark mode, a literal colour does not.`;
}
