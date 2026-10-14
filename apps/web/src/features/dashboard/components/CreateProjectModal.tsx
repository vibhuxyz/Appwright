import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, X, Zap, Layers, Check } from "lucide-react";
import { useCreateProject } from "@/features/projects/hooks/useProjects";
import { cn } from "@/shared/lib/cn";
import { ModalConfetti } from "./ModalConfetti";
import { StarterGrid } from "./StarterGrid";
import { SUGGESTED_TEMPLATES, type StarterTemplate } from "../data/starterTemplates";

export function CreateProjectModal({
  isOpen,
  initialTemplate,
  onClose,
}: {
  isOpen: boolean;
  initialTemplate?: { name: string; templateId: "vite-react" | "nextjs-fullstack" } | null;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const createProject = useCreateProject();

  const [framework, setFramework] = useState<"vite-react" | "nextjs-fullstack">(
    initialTemplate?.templateId ?? "vite-react",
  );
  const [name, setName] = useState(
    initialTemplate ? initialTemplate.name.toLowerCase().replace(/\s+/g, "-") : "",
  );
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    initialTemplate?.name ?? "Blank Project",
  );
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectSuggestion = (t: StarterTemplate) => {
    setSelectedTemplate(t.name);
    setFramework(t.framework);
    if (!name || SUGGESTED_TEMPLATES.some((st) => st.name.toLowerCase().replace(/\s+/g, "-") === name)) {
      setName(t.name.toLowerCase().replace(/\s+/g, "-"));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || `app-${Math.random().toString(36).substring(2, 7)}`;
    setError(null);

    try {
      const project = await createProject.mutateAsync({
        name: finalName,
        templateId: framework,
      });
      // Directly redirect to the AI Editor workspace
      try {
        await navigate({
          to: "/p/$projectId",
          params: { projectId: project.id },
          search: { view: "editor" },
        });
      } catch {
        window.location.href = `/p/${project.id}?view=editor`;
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create project");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[#26282E] bg-[#14161A] p-6 text-foreground shadow-2xl shadow-black sm:p-9">
        {/* Background ambient glowing colors */}
        <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-pink-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-lime/15 blur-3xl" />

        {/* Confetti decorations */}
        <ModalConfetti />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 grid size-8 cursor-pointer place-items-center rounded-full bg-surface-2 text-muted transition-colors hover:bg-surface-3 hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        {/* Top header badge */}
        <div className="relative mx-auto mb-3 grid size-14 place-items-center rounded-full border border-white/10 bg-[#1D2026] text-white shadow-inner">
          <Sparkles className="size-6 text-lime" />
        </div>

        <div className="relative text-center">
          <h2 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Create New Project
          </h2>
          <div className="mt-1 text-2xl font-black tracking-tight text-[#E3FC18] sm:text-3xl">
            with Instant AI Sandbox
          </div>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            Choose your framework and template to spin up a live sandbox.
          </p>
        </div>

        {/* Framework options */}
        <div className="relative mt-5 space-y-2">
          <label className="text-[11px] font-bold tracking-wider text-muted uppercase">
            1. Select Framework
          </label>
          <div className="grid grid-cols-2 gap-3.5">
            <button
              type="button"
              onClick={() => setFramework("vite-react")}
              className={cn(
                "relative flex cursor-pointer flex-col rounded-2xl border p-4 text-left transition-all",
                framework === "vite-react"
                  ? "border-lime bg-lime/10 shadow-lg shadow-lime/10"
                  : "border-border/60 bg-surface/80 hover:border-border",
              )}
            >
              <div className="flex items-center justify-between">
                <Zap className={cn("size-5", framework === "vite-react" ? "text-lime" : "text-muted")} />
                {framework === "vite-react" && <Check className="size-4 text-lime" />}
              </div>
              <span className="mt-2 text-sm font-bold text-foreground">Vite (React)</span>
              <span className="text-[11px] text-muted">Ultra-fast client SPA</span>
            </button>

            <button
              type="button"
              onClick={() => setFramework("nextjs-fullstack")}
              className={cn(
                "relative flex cursor-pointer flex-col rounded-2xl border p-4 text-left transition-all",
                framework === "nextjs-fullstack"
                  ? "border-sky-400 bg-sky-500/10 shadow-lg shadow-sky-500/10"
                  : "border-border/60 bg-surface/80 hover:border-border",
              )}
            >
              <div className="flex items-center justify-between">
                <Layers className={cn("size-5", framework === "nextjs-fullstack" ? "text-sky-400" : "text-muted")} />
                {framework === "nextjs-fullstack" && <Check className="size-4 text-sky-400" />}
              </div>
              <span className="mt-2 text-sm font-bold text-foreground">Next.js</span>
              <span className="text-[11px] text-muted">Fullstack & SSR</span>
            </button>
          </div>
        </div>

        {/* Project Name and Starters */}
        <form onSubmit={handleCreate} className="relative mt-4 space-y-4">
          <div>
            <label className="text-[11px] font-bold tracking-wider text-muted uppercase">
              2. Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. my-awesome-app"
              className="mt-1.5 w-full rounded-xl border border-border/80 bg-surface/90 px-4 py-2.5 text-sm text-foreground placeholder-muted transition-colors outline-none focus:border-lime"
            />
            {error && <p className="mt-1 text-xs text-danger">{error}</p>}
          </div>

          {/* Organized 3x2 Grid for Starters */}
          <StarterGrid
            selectedTemplate={selectedTemplate}
            onSelect={handleSelectSuggestion}
          />

          {/* Create Button */}
          <button
            type="submit"
            disabled={createProject.isPending}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-lime py-3.5 text-sm font-black text-black shadow-xl shadow-lime/25 transition-all hover:bg-lime/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {createProject.isPending ? "Spinning up project…" : "Create Project & Launch Sandbox →"}
          </button>
        </form>
      </div>
    </div>
  );
}
