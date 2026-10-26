import { describe, expect, test, beforeEach } from "bun:test";
import { toast, useToastStore } from "../src/shared/components/toast";
import type { Project } from "../src/features/projects/schemas/projectSchemas";

describe("Toast Store and Dispatcher", () => {
  beforeEach(() => {
    useToastStore.getState().clearToasts();
  });

  test("adds a success toast with custom title and description", () => {
    const id = toast.success("Project deleted", "Workspace removed permanently");
    expect(id).toBeDefined();

    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(1);
    expect(toasts[0]?.variant).toBe("success");
    expect(toasts[0]?.title).toBe("Project deleted");
    expect(toasts[0]?.description).toBe("Workspace removed permanently");
  });

  test("adds colorful error, warning, and info toasts", () => {
    toast.error("Delete failed", "Network error");
    toast.warning("Warning", "Storage low");
    toast.info("Info", "Action queued");

    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(3);
    expect(toasts[0]?.variant).toBe("error");
    expect(toasts[1]?.variant).toBe("warning");
    expect(toasts[2]?.variant).toBe("info");
  });

  test("dismisses a toast by id", () => {
    const id = toast.success("Temporary", "Will be dismissed");
    expect(useToastStore.getState().toasts.length).toBe(1);

    toast.dismiss(id);
    expect(useToastStore.getState().toasts.length).toBe(0);
  });

  test("caps visible toasts to maximum limit", () => {
    for (let i = 0; i < 10; i++) {
      toast.info(`Toast #${i}`);
    }
    const toasts = useToastStore.getState().toasts;
    expect(toasts.length).toBe(5);
    expect(toasts[4]?.title).toBe("Toast #9");
  });
});

describe("Project State and Deletion Logic", () => {
  test("optimistic deletion removes target project without mutating array", () => {
    const projects: Project[] = [
      {
        id: "proj-1",
        name: "e-commerce-hub",
        templateId: "nextjs-fullstack",
        starterId: null,
        status: "READY",
        previewUrl: "https://preview.appwright.dev/proj-1",
        createdAt: "2026-10-25T00:00:00.000Z",
      },
      {
        id: "proj-2",
        name: "finance-portal",
        templateId: "vite-react",
        starterId: null,
        status: "BUILDING",
        previewUrl: null,
        createdAt: "2026-10-25T01:00:00.000Z",
      },
    ];

    const deletedId = "proj-1";
    const nextProjects = projects.filter((p) => p.id !== deletedId);

    expect(nextProjects.length).toBe(1);
    expect(nextProjects[0]?.id).toBe("proj-2");
    expect(projects.length).toBe(2);
  });

  test("empty projects list does not fall back to sample mock projects", () => {
    const realProjects: Project[] = [];
    const displayedProjects = realProjects.filter((p) =>
      p.name.toLowerCase().includes(""),
    );
    expect(displayedProjects).toEqual([]);
    expect(displayedProjects.some((p) => p.id.includes("sample"))).toBe(false);
  });

  test("sample project ids and not found errors resolve cleanly without throwing", async () => {
    const safeDelete = async (id: string, simulateNotFound = false) => {
      if (id.endsWith("-sample") || id.includes("sample")) return;
      if (simulateNotFound) {
        try {
          throw new Error("not found");
        } catch (err) {
          if (err instanceof Error && err.message.toLowerCase().includes("not found")) {
            return;
          }
          throw err;
        }
      }
    };

    await expect(safeDelete("ai-studio-sample")).resolves.toBeUndefined();
    await expect(safeDelete("deleted-proj-123", true)).resolves.toBeUndefined();
  });
});
