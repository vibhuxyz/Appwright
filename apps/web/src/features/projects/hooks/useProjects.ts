import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectApi } from "../api/projectApi";
import type { Project } from "../schemas/projectSchemas";

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
    mutationFn: ({ name, templateId }: { name: string; templateId: string }) =>
      projectApi.create(name, templateId),
    onSuccess: (newProject) => {
      // Instantly seed both individual and list cache for seamless immediate navigation
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
    mutationFn: (id: string) => projectApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectsQueryKey });
    },
  });
}
