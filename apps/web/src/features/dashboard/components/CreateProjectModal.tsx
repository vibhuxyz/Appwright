import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, X } from "lucide-react";
import type { IntegrationProvider } from "@repo/contracts";
import { useCreateProject } from "@/features/projects/hooks/useProjects";
import { ModalConfetti } from "./ModalConfetti";
import { StarterGrid } from "./StarterGrid";
import {
  CAROUSEL_TEMPLATES,
  SUGGESTED_TEMPLATES,
  STARTER_ROTATION_DELAY_MS,
  type StarterTemplate,
} from "../data/starterTemplates";
import { OptionalConnectors, ProjectCreateBubbles, TemplatePreview } from "./project-create";

export function CreateProjectModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const [name, setName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<StarterTemplate["id"] | null>(null);
  const [carouselOffset, setCarouselOffset] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [integrations, setIntegrations] = useState<IntegrationProvider[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !isAutoPlay) return;
    const timer = window.setInterval(() => {
      setCarouselOffset((current) => (current + 1) % CAROUSEL_TEMPLATES.length);
    }, STARTER_ROTATION_DELAY_MS);
    return () => window.clearInterval(timer);
  }, [isOpen, isAutoPlay]);

  if (!isOpen) return null;

  const selectedStarter = SUGGESTED_TEMPLATES.find((template) => template.id === selectedTemplate) ?? null;
  const previewStarter = selectedStarter ?? CAROUSEL_TEMPLATES[carouselOffset] ?? null;

  const handleSelectSuggestion = (template: StarterTemplate) => {
    setSelectedTemplate(template.id);
    setIsAutoPlay(false);
  };

  const handleShiftCarousel = (direction: number) => {
    setIsAutoPlay(false);
    setCarouselOffset((current) =>
      (current + direction + CAROUSEL_TEMPLATES.length) % CAROUSEL_TEMPLATES.length,
    );
  };

  const toggleIntegration = (provider: IntegrationProvider) => {
    setIntegrations((current) => current.includes(provider)
      ? current.filter((item) => item !== provider)
      : [...current, provider]);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const finalName = name.trim() || `app-${crypto.randomUUID().slice(0, 5)}`;
    setError(null);
    try {
      const project = await createProject.mutateAsync({
        name: finalName,
        templateId: "nextjs-fullstack",
        starterId: selectedTemplate,
        integrations,
      });
      try {
        await navigate({ to: "/p/$projectId", params: { projectId: project.id }, search: { view: "editor" } });
      } catch {
        window.location.href = `/p/${project.id}?view=editor`;
      }
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Project creation failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6">
      <form onSubmit={handleCreate} className="relative flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-[#26282E] bg-[#14161A] text-foreground shadow-2xl shadow-black/60">
        <ModalConfetti />
        <button type="button" onClick={onClose} aria-label="Close create project" className="absolute top-3 right-3 z-20 grid size-9 place-items-center rounded-full bg-surface-2 text-muted hover:bg-surface-3 hover:text-foreground focus-visible:outline-2 focus-visible:outline-lime">
          <X className="size-4" />
        </button>
        <div className="relative flex min-h-0 flex-1 flex-col md:flex-row">
          <section className="flex min-h-0 w-full flex-col gap-5 overflow-y-auto border-b border-border/70 p-5 md:w-[36%] md:border-r md:border-b-0 md:p-7">
            <div>
              <div className="mb-3 grid size-11 place-items-center rounded-full border border-white/10 bg-[#1D2026]">
                <Sparkles className="size-5 text-lime" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">Create New Project</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">Choose a starter and optional connectors for your app.</p>
            </div>
            <div>
              <label htmlFor="new-project-name" className="text-xs font-bold tracking-wide text-muted uppercase">Project name</label>
              <input id="new-project-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="my-awesome-app" className="mt-2 w-full rounded-xl border border-border/80 bg-surface/90 px-4 py-3 text-sm text-foreground placeholder-muted outline-none focus-visible:border-lime focus-visible:ring-2 focus-visible:ring-lime/20" />
            </div>
            <OptionalConnectors selectedProviders={integrations} onToggle={toggleIntegration} />
            {error && <p role="alert" className="text-xs text-danger">{error}</p>}
            <button type="submit" disabled={createProject.isPending} className="relative mt-auto flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-lime px-4 py-3.5 text-sm font-black text-black shadow-lg shadow-lime/20 transition-colors hover:bg-lime/90 disabled:cursor-wait disabled:opacity-90">
              {createProject.isPending && <ProjectCreateBubbles />}
              <span className="relative z-10">{createProject.isPending ? "Creating project…" : "Create project"}</span>
              <span aria-hidden="true" className="relative z-10">→</span>
            </button>
          </section>
          <section className="flex min-h-110 min-w-0 flex-1 flex-col md:min-h-0">
            <TemplatePreview template={previewStarter} />
            <StarterGrid
              selectedTemplate={selectedTemplate}
              carouselOffset={carouselOffset}
              isAutoPlay={isAutoPlay}
              onSelect={handleSelectSuggestion}
              onShift={handleShiftCarousel}
            />
          </section>
        </div>
      </form>
    </div>
  );
}
