import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectApi } from "../api/projectApi";
import type { Project } from "../schemas/projectSchemas";
import type { CreateProjectRequest } from "@repo/contracts";

export const projectsQueryKey = ["projects"] as const;

export function useProjects() {
  return useQuery({
    queryKey: projectsQueryKey,
    queryFn: ({ signal }) => projectApi.list(signal),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: ({ signal }) => projectApi.get(id, signal),
    enabled: Boolean(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProjectRequest) => projectApi.create(input),
    onSuccess: (newProject) => {
      queryClient.setQueryData(["project", newProject.id], newProject);
      queryClient.setQueryData<Project[]>(projectsQueryKey, (old) => {
        if (!old) return [newProject];
        return [newProject, ...old.filter((p) => p.id !== newProject.id)];
      });
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (id.endsWith("-sample") || id.includes("sample")) {
        return;
      }
      try {
        await projectApi.remove(id);
      } catch (err) {
        if (
          err instanceof Error &&
          (err.message.toLowerCase().includes("not found") ||
            err.message.includes("404"))
        ) {
          return;
        }
        throw err;
      }
    },
    onMutate: async (deletedId: string) => {
      await queryClient.cancelQueries({ queryKey: projectsQueryKey });
      const previousProjects = queryClient.getQueryData<Project[]>(projectsQueryKey);
      queryClient.setQueryData<Project[]>(projectsQueryKey, (old) =>
        old ? old.filter((p) => p.id !== deletedId) : [],
      );
      return { previousProjects };
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(projectsQueryKey, context.previousProjects);
      }
    },
    onSettled: (_data, _error, deletedId) => {
      queryClient.removeQueries({ queryKey: ["project", deletedId] });
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey });
    },
  });
}
