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
  Menu,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Search,
  Bell,
  CheckCircle2,
  FolderPlus,
} from 'lucide-react';
import {
  apiRequest,
  getStoredActiveProjectId,
  setStoredActiveProjectId,
  setStoredToken,
  getStoredToken,
} from '@/lib/api';
import { Developer, Project } from '@/lib/types';

interface DashboardContextType {
  developer: Developer | null;
  projects: Project[];
  activeProject: Project | null;
  loading: boolean;
  refreshProjects: () => Promise<void>;
  setActiveProject: (p: Project) => void;
  dashboardTheme: 'light' | 'dark';
  toggleDashboardTheme: () => void;
}

export const DashboardContext = createContext<DashboardContextType>({
  developer: null,
  projects: [],
  activeProject: null,
  loading: true,
  refreshProjects: async () => {},
  setActiveProject: () => {},
  dashboardTheme: 'light',
  toggleDashboardTheme: () => {},
});

export const useDashboard = () => useContext(DashboardContext);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // V2 UI Controls: Collapsible sidebar & dark mode
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardTheme, setDashboardTheme] = useState<'light' | 'dark'>('light');

  const fetchInitialData = async () => {
    const token = getStoredToken();
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      setFetchError(null);
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
      } else {
        // Clear active project if user deleted all
        setActiveProjectState(null);
        setStoredActiveProjectId(null);
      }
    } catch (err: any) {
      if (err.status === 401 || err.status === 403) {
        setStoredToken(null);
        router.push('/login');
      } else {
        setFetchError(
          err.message || 'Unable to connect to the AuthCraft backend server. Please check that the server is online.'
        );
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

  const toggleDashboardTheme = () => {
    setDashboardTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
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

  // Instant starter project creation for empty accounts
  const handleCreateStarter = async () => {
    setCreatingProject(true);
    try {
      const created = await apiRequest<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify({ name: 'Starter Workspace' }),
      });
      setProjects((prev) => [created, ...prev]);
      setActiveProjectState(created);
      setStoredActiveProjectId(created.id);
    } catch (err: any) {
      alert(err.message || 'Failed to initialize workspace.');
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

  // Breadcrumbs calculation
  const getBreadcrumbTitle = () => {
    if (pathname === '/dashboard') return 'Overview';
    if (pathname.includes('/builder')) return 'Visual Login Builder (150 Layouts)';
    if (pathname.includes('/projects')) return 'My Applications';
    if (pathname.includes('/users')) return 'End-User Directory';
    if (pathname.includes('/events')) return 'Authentication Audit Log';
    if (pathname.includes('/sessions')) return 'Active User Sessions';
    if (pathname.includes('/settings')) return 'Project Settings';
    if (pathname.includes('/docs')) return 'Developer Documentation';
    return 'Dashboard';
  };

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Projects', href: '/dashboard/projects', icon: Layers },
    { label: 'Login Page Builder', href: '/dashboard/builder', icon: Palette, badge: '150 Designs' },
    { label: 'Users & Directory', href: '/dashboard/users', icon: Users },
    { label: 'Authentication Events', href: '/dashboard/events', icon: Activity },
    { label: 'Active Sessions', href: '/dashboard/sessions', icon: KeyRound },
    { label: 'Project Settings', href: '/dashboard/settings', icon: Settings },
    { label: 'Integration & Docs', href: '/dashboard/docs', icon: BookOpen },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-[Inter]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-9 h-9 text-indigo-500 animate-spin" />
          <p className="text-sm font-medium text-slate-400">Loading AuthCraft V2 Platform...</p>
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
        dashboardTheme,
        toggleDashboardTheme,
      }}
    >
      <div
        className={`min-h-screen flex font-[Inter] ${
          dashboardTheme === 'dark' ? 'bg-[#0b0f17] text-slate-100' : 'bg-slate-50 text-slate-900'
        }`}
      >
        {/* V2 Collapsible Sidebar */}
        <aside
          className={`${
            sidebarCollapsed ? 'w-20' : 'w-64'
          } bg-slate-950 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 transition-all duration-300 z-40 relative`}
        >
          {/* Logo Bar */}
          <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              {!sidebarCollapsed && (
                <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
                  Auth<span className="text-indigo-400">Craft</span>
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    V2
                  </span>
                </span>
              )}
            </Link>

            {/* Collapse / Expand toggle button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Project Switcher */}
          {!sidebarCollapsed ? (
            <div className="p-4 border-b border-slate-800">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Active Project
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={activeProject?.id || ''}
                  onChange={(e) => {
                    const sel = projects.find((p) => p.id === e.target.value);
                    if (sel) handleSetActiveProject(sel);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-indigo-500"
                >
                  {projects.length === 0 ? (
                    <option value="">No Projects Yet</option>
                  ) : (
                    projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.is_published ? '●' : '○'}
                      </option>
                    ))
                  )}
                </select>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  title="Create New Project"
                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 border-b border-slate-800 flex justify-center">
              <button
                onClick={() => setCreateModalOpen(true)}
                title="Create New Project"
                className="w-9 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`flex items-center ${
                    sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                  } py-2.5 text-xs font-semibold rounded-lg transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Developer User Footer */}
          <div className="p-3 border-t border-slate-800 flex items-center justify-between">
            {!sidebarCollapsed ? (
              <div className="overflow-hidden pr-2">
                <p className="text-xs font-semibold text-white truncate">
                  {developer?.full_name || 'Developer'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{developer?.email}</p>
              </div>
            ) : null}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar with Breadcrumbs & Actions */}
          <header
            className={`border-b px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-xs ${
              dashboardTheme === 'dark'
                ? 'bg-[#10141e]/90 border-slate-800 backdrop-blur-md'
                : 'bg-white/90 border-slate-200 backdrop-blur-md'
            }`}
          >
            {/* Left: Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="opacity-50">AuthCraft</span>
              <span className="opacity-30">/</span>
              <span className="font-bold opacity-90">{getBreadcrumbTitle()}</span>

              {activeProject && (
                <div className="ml-2 hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-mono">
                  <span>{activeProject.name}</span>
                </div>
              )}
            </div>

            {/* Right: Project Pill & Theme Toggle */}
            <div className="flex items-center gap-3 flex-wrap">
              {activeProject ? (
                <>
                  {/* Project ID Pill */}
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border ${
                      dashboardTheme === 'dark'
                        ? 'bg-slate-900 text-slate-300 border-slate-800'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="opacity-50 text-[10px] uppercase font-sans font-bold">
                      ID:
                    </span>
                    <span className="truncate max-w-[100px] sm:max-w-none">
                      {activeProject.id}
                    </span>
                    <button
                      onClick={() => copyToClipboard(activeProject.id, 'id')}
                      title="Copy Project ID"
                      className="opacity-60 hover:opacity-100 ml-1 transition-opacity"
                    >
                      {copiedId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Hosted Login URL Action Pill */}
                  <div
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs border ${
                      dashboardTheme === 'dark'
                        ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="font-semibold hidden sm:inline">Hosted URL:</span>
                    <span className="font-mono truncate max-w-[130px] sm:max-w-[200px]">
                      {activeProject.hosted_login_url}
                    </span>

                    <button
                      onClick={() => copyToClipboard(activeProject.hosted_login_url, 'url')}
                      className="p-1 hover:bg-indigo-500/20 rounded transition-colors"
                      title="Copy Hosted Login URL"
                    >
                      {copiedUrl ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <a
                      href={activeProject.hosted_login_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 hover:bg-indigo-500/20 rounded transition-colors"
                      title="Open Live Hosted Page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Published Badge */}
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      activeProject.is_published
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {activeProject.is_published
                      ? `Published v${activeProject.published_version}`
                      : 'Draft'}
                  </span>
                </>
              ) : null}

              {/* Theme Toggle Button */}
              <button
                onClick={toggleDashboardTheme}
                title={`Switch to ${dashboardTheme === 'light' ? 'Dark' : 'Light'} Mode`}
                className={`p-1.5 rounded-lg border transition-colors ${
                  dashboardTheme === 'dark'
                    ? 'border-slate-800 text-amber-400 hover:bg-slate-900'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {dashboardTheme === 'dark' ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
            </div>
          </header>

          {/* Connection / Fetch Error Alert */}
          {fetchError && (
            <div className="m-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                <div>
                  <span className="font-bold">Backend Communication Notice:</span> {fetchError}
                </div>
              </div>
              <button
                onClick={() => fetchInitialData()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition-all shrink-0"
              >
                Retry Connection
              </button>
            </div>
          )}

          {/* Empty Workspace Onboarding Banner if projects.length === 0 */}
          {projects.length === 0 && !loading && (
            <div className="m-6 p-6 rounded-2xl bg-gradient-to-r from-indigo-900/30 via-slate-900 to-indigo-950/40 border border-indigo-500/30 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold">Welcome to AuthCraft V2!</h3>
                </div>
                <p className="text-xs text-slate-300 max-w-xl">
                  You haven't created an application project yet. Initialize your first workspace to
                  access all 150 login page designs, project-isolated users, and hosted URLs.
                </p>
              </div>
              <button
                onClick={handleCreateStarter}
                disabled={creatingProject}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 shrink-0 transition-all"
              >
                {creatingProject ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FolderPlus className="w-4 h-4" />
                )}
                <span>Initialize Starter Workspace</span>
              </button>
            </div>
          )}

          {/* Dashboard Children */}
          <main className="p-4 sm:p-6 flex-1">{children}</main>
        </div>

        {/* Create Project Modal */}
        {createModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div
              className={`rounded-2xl max-w-md w-full p-6 shadow-2xl border ${
                dashboardTheme === 'dark'
                  ? 'bg-slate-900 border-slate-800 text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <h3 className="text-lg font-bold mb-2">Create New Application</h3>
              <p className="text-xs opacity-70 mb-4">
                Each project receives an isolated user population, dedicated authentication events,
                and its own customizable hosted login page.
              </p>

              {createError && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-80">
                    Application Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Cloud, Finflow App"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold opacity-70 hover:opacity-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingProject}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
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
