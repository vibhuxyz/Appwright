import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import type { Project } from "../schemas/projectSchemas";
import { useDeleteProject } from "../hooks/useProjects";
import { toast } from "@/shared/components/toast";

interface DeleteProjectModalProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
  onDeleted?: (project: Project) => void;
}

export function DeleteProjectModal({
  isOpen,
  project,
  onClose,
  onDeleted,
}: DeleteProjectModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteProject = useDeleteProject();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !project) return null;

  const handleDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success("Project deleted", `"${project.name}" has been permanently removed.`);
      onDeleted?.(project);
      onClose();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Failed to delete project";
      toast.error("Could not delete project", message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-project-title"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-500/20 bg-[#14161A] text-foreground shadow-2xl shadow-rose-950/40"
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          aria-label="Close modal"
          className="absolute top-4 right-4 grid size-8 cursor-pointer place-items-center rounded-full bg-surface-2 text-muted transition-colors hover:bg-surface-3 hover:text-foreground disabled:opacity-50"
        >
          <X className="size-4" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 ring-4 ring-rose-500/10">
              <Trash2 className="size-6" />
            </div>
            <div>
              <h3 id="delete-project-title" className="text-lg font-bold tracking-tight text-white">
                Delete project
              </h3>
              <p className="text-xs text-muted">Permanent action</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-border/80 bg-surface/80 p-3.5">
            <p className="text-xs text-muted">You are about to delete:</p>
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <span className="truncate font-mono text-sm font-bold text-rose-300">{project.name}</span>
              <span className="rounded-md border border-border/60 bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-muted">
                {project.status.toLowerCase()}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-950/20 p-3.5 text-xs leading-relaxed text-rose-200/90">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-400" />
              <span>
                This will permanently delete the repository, sandbox containers, preview deployments, and databases.
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="cursor-pointer rounded-xl border border-border/80 bg-surface-2 px-4 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-surface-3 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-rose-600 px-4.5 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-900/40 transition-all hover:bg-rose-500 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
            >
              {isDeleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
              <span>{isDeleting ? "Deleting..." : "Delete project"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
