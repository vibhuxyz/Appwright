import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  createProjectFormSchema,
  type CreateProjectForm as CreateProjectFormValues,
} from "../schemas/projectSchemas";
import { useCreateProject } from "../hooks/useProjects";
import { Button } from "@/shared/components/ui/Button";

export function CreateProjectForm({
  onCreated,
}: {
  onCreated: (projectId: string) => void;
}) {
  const createProject = useCreateProject();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectFormSchema),
    defaultValues: { name: "", templateId: "vite-react" },
  });

  const onSubmit = handleSubmit(async ({ name, templateId }) => {
    const project = await createProject.mutateAsync({ name, templateId });
    reset();
    onCreated(project.id);
  });

  return (
    <form onSubmit={onSubmit} className="mb-4 flex gap-2">
      <div className="flex-1">
        <input
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder-muted transition-colors outline-none focus:border-surface-3"
          placeholder="Project name"
          {...register("name")}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
        )}
      </div>
      <select
        className="cursor-pointer rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground-secondary outline-none"
        disabled={createProject.isPending}
        {...register("templateId")}
      >
        <option value="vite-react">Vite (React)</option>
        <option value="nextjs-fullstack">Next.js</option>
      </select>
      <Button type="submit" size="lg" className="w-auto rounded-xl px-6" disabled={createProject.isPending}>
        {createProject.isPending ? "Creating…" : "Create"}
      </Button>
    </form>
  );
}
