'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Rocket, ExternalLink, Trash2, Pencil } from 'lucide-react';

interface ProjectSummary {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  publishedUrl: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

interface DashboardProps {
  projects: ProjectSummary[];
}

export default function Dashboard({ projects }: DashboardProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const run = async (id: string | 'new', action: () => Promise<void>) => {
    setBusyId(id);
    setError(null);
    try {
      await action();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const createProject = () =>
    run('new', async () => {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Project' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.push(`/builder/${data.project.id}`);
    });

  const renameProject = (id: string) =>
    run(id, async () => {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameValue }),
      });
      if (!response.ok) throw new Error();
      setRenamingId(null);
      router.refresh();
    });

  const deleteProject = (id: string) =>
    run(id, async () => {
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error();
      router.refresh();
    });

  const publishProject = (id: string) =>
    run(id, async () => {
      const response = await fetch(`/api/projects/${id}/publish`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.refresh();
      if (data.url) window.open(data.url, '_blank');
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar — same visual language as the builder */}
      <div className="h-16 bg-white border-b border-gray-200 px-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">LaunchPad</h1>
        <button
          onClick={createProject}
          disabled={busyId !== null}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {busyId === 'new' ? 'Creating...' : 'New Project'}
        </button>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No projects yet</h2>
            <p className="text-gray-500">Create your first landing page to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-3"
              >
                {renamingId === project.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      renameProject(project.id);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      type="submit"
                      disabled={busyId === project.id}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium text-gray-900">{project.title}</div>
                      <div className="text-xs text-gray-500">
                        Updated {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setRenamingId(project.id);
                        setRenameValue(project.title);
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded"
                      title="Rename"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                )}

                <div className="text-xs">
                  {project.published && project.publishedUrl ? (
                    <a
                      href={project.publishedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded"
                    >
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      Live at {project.publishedUrl}
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                      Not published
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-gray-100">
                  <Link
                    href={`/builder/${project.id}`}
                    className="flex-1 text-center px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => publishProject(project.id)}
                    disabled={busyId === project.id}
                    className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded hover:opacity-90 text-sm flex items-center gap-1 disabled:opacity-50"
                    title={project.published ? 'Republish' : 'Publish'}
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    {busyId === project.id ? '...' : project.published ? 'Republish' : 'Publish'}
                  </button>
                  {project.published && project.publishedUrl && (
                    <a
                      href={project.publishedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 hover:bg-gray-100 rounded"
                      title="View live page"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-500" />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete "${project.title}"? This cannot be undone.`)) {
                        deleteProject(project.id);
                      }
                    }}
                    disabled={busyId === project.id}
                    className="p-1.5 hover:bg-red-50 rounded disabled:opacity-50"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
