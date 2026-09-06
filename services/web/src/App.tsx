import { useCallback, useEffect, useState } from "react";
import { api, getToken, setToken, type Project, type User } from "./api";
import { AuthScreen } from "./AuthScreen";
import { ProjectView } from "./ProjectView";

function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash;
}

function ProjectList({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState("");
  const [template, setTemplate] = useState("vite-react");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.listProjects().then(setProjects);
  }, []);

  const create = async () => {
    if (!name.trim() || creating) return;
    setCreating(true);
    try {
      const project = await api.createProject(name.trim(), template);
      setName("");
      setProjects((p) => [project, ...p]);
      window.location.hash = `#/p/${project.id}`;
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-8 text-zinc-100">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Appwright</h1>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>{user.email}</span>
          <button className="hover:text-zinc-200" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </div>
      <div className="mb-8 flex gap-2">
        <input
          className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none"
          placeholder="Project name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && create()}
        />
        <select
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 outline-none text-sm"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          disabled={creating}
        >
          <option value="vite-react">Vite (React)</option>
          <option value="nextjs-fullstack">Next.js</option>
        </select>
        <button
          className="rounded bg-blue-600 px-4 py-2 font-medium disabled:opacity-50"
          onClick={create}
          disabled={creating}
        >
          {creating ? "Creating…" : "Create"}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {projects.map((p) => (
          <a
            key={p.id}
            href={`#/p/${p.id}`}
            className="group flex items-center justify-between rounded border border-zinc-800 bg-zinc-900 px-4 py-3 hover:border-zinc-600"
          >
            <span>{p.name}</span>
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-500">{p.status}</span>
              <button
                className="text-sm font-medium text-red-500 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (confirm(`Delete project "${p.name}"?`)) {
                    await api.deleteProject(p.id);
                    setProjects((curr) => curr.filter((proj) => proj.id !== p.id));
                  }
                }}
              >
                Delete
              </button>
            </div>
          </a>
        ))}
        {projects.length === 0 && (
          <div className="text-zinc-500">No projects yet — create one above.</div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const hash = useHashRoute();
  const [user, setUser] = useState<User | null>(null);
  // Three states, not two: "checking" matters because rendering the login
  // screen while a valid token is still being verified makes every reload
  // flash a sign-in form at an already-signed-in user.
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setChecking(false);
      return;
    }
    api
      .me()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setChecking(false));
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // Any 401 from any call drops us back to the login screen, so an expired
  // token cannot leave the UI stuck on a page that will never load.
  useEffect(() => {
    window.addEventListener("appwright:unauthorized", signOut);
    return () => window.removeEventListener("appwright:unauthorized", signOut);
  }, [signOut]);

  if (checking) return null;
  if (!user) return <AuthScreen onAuthed={setUser} />;

  const match = hash.match(/^#\/p\/(.+)$/);
  if (match) return <ProjectView projectId={match[1]} />;
  return <ProjectList user={user} onSignOut={signOut} />;
}
