'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  LayoutDashboard,
  Layers,
  Palette,
  Users,
  Activity,
  KeyRound,
  Settings,
  BookOpen,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  Plus,
  Loader2,
  Sparkles,
  AlertTriangle,
  Globe,
} from 'lucide-react';
import {
  apiRequest,
  getStoredActiveProjectId,
  setStoredActiveProjectId,
  setStoredToken,
} from '@/lib/api';
import { Developer, Project } from '@/lib/types';

interface DashboardContextType {
  developer: Developer | null;
  projects: Project[];
  activeProject: Project | null;
  loading: boolean;
  refreshProjects: () => Promise<void>;
  setActiveProject: (p: Project) => void;
}

export const DashboardContext = createContext<DashboardContextType>({
  developer: null,
  projects: [],
  activeProject: null,
  loading: true,
  refreshProjects: async () => {},
  setActiveProject: () => {},
});

export const useDashboard = () => useContext(DashboardContext);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchInitialData = async () => {
    try {
      const dev = await apiRequest<Developer>('/auth/me');
      setDeveloper(dev);

      const projs = await apiRequest<Project[]>('/projects');
      setProjects(projs);

      if (projs.length > 0) {
        const storedId = getStoredActiveProjectId();
        const found = projs.find((p) => p.id === storedId);
        const selected = found || projs[0];
        setActiveProjectState(selected);
        setStoredActiveProjectId(selected.id);
      }
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        setStoredToken(null);
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSetActiveProject = (proj: Project) => {
    setActiveProjectState(proj);
    setStoredActiveProjectId(proj.id);
  };

  const copyToClipboard = (text: string, type: 'id' | 'url') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreateError(null);
    setCreatingProject(true);

    try {
      const created = await apiRequest<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify({ name: newProjectName.trim() }),
      });

      setProjects((prev) => [created, ...prev]);
      setActiveProjectState(created);
      setStoredActiveProjectId(created.id);
      setNewProjectName('');
      setCreateModalOpen(false);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create project.');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setStoredToken(null);
      setStoredActiveProjectId(null);
      router.push('/login');
    }
  };

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Projects', href: '/dashboard/projects', icon: Layers },
    { label: 'Login Page Builder', href: '/dashboard/builder', icon: Palette },
    { label: 'Users & Directory', href: '/dashboard/users', icon: Users },
    { label: 'Authentication Events', href: '/dashboard/events', icon: Activity },
    { label: 'Active Sessions', href: '/dashboard/sessions', icon: KeyRound },
    { label: 'Project Settings', href: '/dashboard/settings', icon: Settings },
    { label: 'Integration & Docs', href: '/dashboard/docs', icon: BookOpen },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-[Inter]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading AuthCraft Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardContext.Provider
      value={{
        developer,
        projects,
        activeProject,
        loading,
        refreshProjects: fetchInitialData,
        setActiveProject: handleSetActiveProject,
      }}
    >
      <div className="min-h-screen bg-slate-100 flex font-[Inter]">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0">
          {/* Logo */}
          <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Auth<span className="text-indigo-400">Craft</span>
              </span>
            </Link>
          </div>

          {/* Project Switcher */}
          <div className="p-4 border-b border-slate-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Active Application
            </label>
            <div className="flex items-center gap-2">
              <select
                value={activeProject?.id || ''}
                onChange={(e) => {
                  const sel = projects.find((p) => p.id === e.target.value);
                  if (sel) handleSetActiveProject(sel);
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.is_published ? '●' : '○'}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setCreateModalOpen(true)}
                title="Create New Project"
                className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Developer User Footer */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-between">
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{developer?.full_name}</p>
              <p className="text-[11px] text-slate-400 truncate">{developer?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar with Project Identifiers & Mandatory Hosted Login URL */}
          <header className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-bold text-slate-900">
                {activeProject?.name || 'No Project Selected'}
              </span>

              {activeProject && (
                <>
                  {/* Unique Project ID Pill */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-mono border border-slate-200">
                    <span className="text-slate-400 font-sans text-[10px] uppercase font-bold">Project ID:</span>
                    <span className="truncate max-w-[120px] sm:max-w-none">{activeProject.id}</span>
                    <button
                      onClick={() => copyToClipboard(activeProject.id, 'id')}
                      title="Copy Project ID"
                      className="text-slate-400 hover:text-slate-700 ml-1"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      activeProject.is_published
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {activeProject.is_published
                      ? `Published (v${activeProject.published_version})`
                      : 'Draft / Unpublished'}
                  </span>
                </>
              )}
            </div>

            {/* Mandatory Feature: The Hosted Login URL Action Pill */}
            {activeProject && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50/80 border border-indigo-200 text-indigo-900 text-xs">
                  <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="font-semibold text-indigo-700">Hosted URL:</span>
                  <span className="font-mono text-indigo-600 truncate max-w-[150px] sm:max-w-[240px]">
                    {activeProject.hosted_login_url}
                  </span>

                  <button
                    onClick={() => copyToClipboard(activeProject.hosted_login_url, 'url')}
                    className="p-1 hover:bg-indigo-100 rounded text-indigo-700 transition-colors flex items-center gap-1"
                    title="Copy Hosted Login URL"
                  >
                    {copiedUrl ? (
                      <span className="text-emerald-700 text-[11px] font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Copied!
                      </span>
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <a
                    href={activeProject.hosted_login_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 hover:bg-indigo-100 rounded text-indigo-700 transition-colors"
                    title="Open Hosted Login Page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {!activeProject.is_published && (
                  <Link
                    href="/dashboard/builder"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                  >
                    Publish Page
                  </Link>
                )}
              </div>
            )}
          </header>

          {/* Children View */}
          <main className="p-6 flex-1">{children}</main>
        </div>

        {/* Create Project Modal */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Create New Application</h3>
              <p className="text-xs text-slate-600 mb-4">
                Each project receives its own unique Project ID, isolated end-user population, and customizable hosted login page.
              </p>

              {createError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Workspace, ShopFlow"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingProject}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {creatingProject ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardContext.Provider>
  );
}
