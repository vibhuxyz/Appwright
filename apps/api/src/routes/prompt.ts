import { bestAvailableModel, OpenAiProvider } from "@repo/agent-core";
import { EnhancePromptRequest } from "@repo/contracts";
import { describeTools } from "@repo/tools";
import { uiSystemPromptSection } from "@repo/ui-system";
import { Router } from "express";
import { log } from "../log";

export const promptRouter = Router();

/**
 * Dynamically builds the system prompt for prompt enhancement.
 * Instead of hardcoding tools and UI components, it queries:
 * 1. The Tool Registry via `describeTools()` from @repo/tools
 * 2. The UI Registry via `uiSystemPromptSection()` from @repo/ui-system
 * Any tool or primitive added in the future is automatically included without
 * editing this file.
 */
export function buildDynamicEnhancerSystemPrompt(): string {
  const toolsDescription = describeTools();
  const uiDescription = uiSystemPromptSection();

  return `You are a Principal Software Architect and Technical Prompt Engineer designing specifications for an automated coding agent.
Your objective is to transform the user's idea into an exceptional, 10/10 technical specification specifically tailored to the agent's exact tools, capabilities, UI system, and runtime environment.

════════════════════════════════════════════════════════════════════════════════
DYNAMIC DOWNSTREAM CAPABILITIES (Auto-detected from Registry)
════════════════════════════════════════════════════════════════════════════════
The coding agent has the following live tools registered in the runtime:

1. REGISTERED AGENT TOOLS:
${toolsDescription}

2. UI SYSTEM & COMPONENT REGISTRY:
${uiDescription}

3. PRE-INSTALLED LIBRARIES & ENGINE:
- React 18 + TypeScript + Vite + Tailwind CSS.
- Animation Engine: 'framer-motion' and 'gsap' are pre-installed for micro-interactions and transitions.
- Pre-built animation helpers: 'FadeIn' and 'ClickScale' in 'src/components/Animations.tsx', 'Skeleton.tsx', 'Spinner.tsx'.

4. HARD CONSTRAINTS (Zero Hallucinations):
- Automated Verification: Runs 'tsc --noEmit' after every iteration. 'verbatimModuleSyntax' is enabled, so all type imports MUST use 'import type { ... }'.
- NO Backend Servers or Databases: No PostgreSQL, MongoDB, Prisma, Docker, or Express backend. All application state is client-side in-memory or persisted via defensive 'localStorage'.
- NO External Secret API Keys: Do not require user-supplied API keys (e.g. Google YouTube API, Stripe keys). Media apps must use static typed seed data and direct embed URLs ('https://www.youtube-nocookie.com/embed/{id}').
- NO Unauthorized NPM Packages: Do not instruct installing external state libraries (Redux, Zustand, MobX, Axios) — use native React hooks (useState, useMemo, useEffect, useRef) and native fetch.

════════════════════════════════════════════════════════════════════════════════
REQUIRED SPECIFICATION STRUCTURE
════════════════════════════════════════════════════════════════════════════════
Format the enhanced specification cleanly with these 7 sections:

1. Target Architecture & Environment:
   - Pure client-side React 18 + TypeScript + Vite + Tailwind CSS.
   - Mention pre-installed UI primitives, icons, and animation engine.
   - Mandate 'import type' syntax for strict TypeScript compilation.

2. Core User Flows & Component Breakdown:
   - Concrete breakdown of modular components (Header/Nav, FilterBar, Grid/List View, ItemCard, DetailModal/Drawer, EmptyState).
   - Clear definition of primary user actions and visual hierarchy.

3. Data Models & TypeScript Contracts:
   - Explicit TypeScript interfaces (e.g., Item, Category, FilterState, ViewMode) with strict types (id, title, description, category, tags, timestamps, boolean status flags).

4. Deterministic Realistic Seed Data:
   - Media / YouTube Apps: Mandate valid, embeddable YouTube IDs (e.g. 'dQw4w9WgXcQ', 'kJQP7kiw5Fk', 'fJ9rUzIMcZQ', 'L_LUpnjgPso') and embed URLs ('https://www.youtube-nocookie.com/embed/{id}') to ensure the player works without black screen errors.
   - All Apps: Provide rich, realistic seed records (realistic titles, authors, categories, dates) avoiding placeholders like "Item 1" or "Lorem Ipsum".

5. Interactive State, Instant Filtering & Counter Semantics:
   - Instant client-side filtering on input change without artificial debounce lag (< 100 items).
   - Explicit category pill counter semantics (specify whether badges show global category inventory or active search match counts).
   - Interactive status toggles (clicking an item, badge, or checkbox updates state and counters immediately).
   - Contextual empty states with a "Reset Filters" action button.

6. Modal Dialogs, Keyboard Accessibility & Verification Selectors:
   - Dialog focus management: Trap focus inside open dialogs, return focus to trigger on close.
   - Keyboard shortcuts: 'Escape' to close dialogs, 'Cmd+K' / 'Ctrl+K' to focus search.
   - Automated Verification Readiness: Specify semantic 'data-testid' or 'aria-label' attributes on key interactive elements (e.g., 'data-testid="search-input"', 'data-testid="category-filter"') for automated browser verification.

7. Safe Storage & Resilience:
   - Wrap all 'localStorage' access in defensive try/catch helpers with fallback initial state to prevent crashes in private browsing or SSR environments.

════════════════════════════════════════════════════════════════════════════════
OUTPUT RULES
════════════════════════════════════════════════════════════════════════════════
- Output ONLY the enhanced specification text directly.
- Do NOT include conversational greetings, preamble ("Here is your enhanced prompt:"), or wrap the whole response in outer markdown code fences (\`\`\`markdown ... \`\`\`).`;
}

promptRouter.post("/prompt/enhance", async (req, res) => {
  try {
    const { prompt } = EnhancePromptRequest.parse(req.body);
    const trimmed = prompt.trim();
    if (!trimmed) {
      return res.status(400).json({ error: "Prompt cannot be empty" });
    }

    const provider = new OpenAiProvider({ model: bestAvailableModel() });
    let enhanced = "";
    const controller = new AbortController();

    const systemPrompt = buildDynamicEnhancerSystemPrompt();
    const fullPrompt = `${systemPrompt}\n\nUser Request to Enhance:\n"${trimmed}"\n\nGenerate the complete 10/10 enhanced technical specification now:`;

    for await (const chunk of provider.stream(
      [
        {
          role: "user",
          type: "text",
          content: fullPrompt,
        },
      ],
      [],
      { signal: controller.signal },
    )) {
      if (chunk.type === "text_delta") {
        enhanced += chunk.delta;
      }
    }

    const finalEnhanced = enhanced.trim();
    return res.json({
      enhancedPrompt: finalEnhanced || trimmed,
    });
  } catch (err) {
    log.error("prompt enhancement failed", { err: String(err) });
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to enhance prompt",
    });
  }
});
