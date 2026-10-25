'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Palette,
  Save,
  Send,
  RotateCcw,
  RotateCw,
  Smartphone,
  Tablet,
  Monitor,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Globe,
  Sliders,
  Sparkles,
  ExternalLink,
  Search,
  Star,
  Download,
  Upload,
  Copy,
  Check,
  Filter,
  Layers,
  Code2,
  RefreshCw,
  Crown,
  FileJson,
  Undo2,
  Redo2,
  AlertTriangle,
  FolderPlus,
} from 'lucide-react';
import { useDashboard } from '../layout';
import { apiRequest } from '@/lib/api';
import { ProjectConfiguration } from '@/lib/types';
import {
  LAYOUT_CATALOG,
  LAYOUT_CATEGORIES,
  filterLayouts,
  getLayoutById,
} from '@/lib/layouts/catalog';
import { LayoutCategory, LayoutDefinition } from '@/lib/layouts/types';
import { UniversalLayoutRenderer } from '@/lib/layouts/renderer';

export default function VisualBuilderPage() {
  const { activeProject, refreshProjects, dashboardTheme } = useDashboard();

  // Primary Configuration State
  const [config, setConfig] = useState<ProjectConfiguration>({
    brand_name: 'Acme Cloud',
    page_title: 'Sign In to Your Account',
    logo_url: null,
    primary_color: '#4F46E5',
    secondary_color: '#6366F1',
    background_color: '#0F172A',
    card_background_color: '#FFFFFF',
    text_color: '#0F172A',
    theme_mode: 'light',
    template_name: 'modern',
    layout_style: 'card',
    form_width: 'md',
    form_alignment: 'center',
    button_style: 'rounded',
    input_style: 'outline',
    font_family: 'Inter',
    border_radius: 8,
    welcome_message: 'Welcome back! Enter your details to continue.',
    login_text: 'Sign in to access your dashboard',
    register_text: 'Create a new account',
    email_label: 'Email Address',
    password_label: 'Password',
    footer_text: 'Protected by AuthCraft No-Code Security',
    show_password_toggle: true,
    show_forgot_password: true,
    show_registration: true,
    allow_otp_login: true,
    layout_id: 'minimal-clean-01',
    layout_tokens: {},
  });

  // Layout Library State
  const [selectedLayoutId, setSelectedLayoutId] = useState<string>('minimal-clean-01');
  const [selectedCategory, setSelectedCategory] = useState<LayoutCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'name'>('featured');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // Pane Navigation Tabs
  const [leftTab, setLeftTab] = useState<'library' | 'customizer'>('library');
  const [rightTab, setRightTab] = useState<'tokens' | 'json' | 'export_import'>('tokens');

  // Preview & Viewport Controls
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewMode, setPreviewMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Interactive Form Test State
  const [testEmail, setTestEmail] = useState<string>('alex@example.com');
  const [testPassword, setTestPassword] = useState<string>('SecretPassword123');
  const [testDisplayName, setTestDisplayName] = useState<string>('Alex Rivera');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [testSuccess, setTestSuccess] = useState<any | null>(null);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<ProjectConfiguration[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isUndoRedoAction = useRef(false);

  // Status & Notifications
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [copiedJson, setCopiedJson] = useState(false);

  // Confirmation Modal for Discarding Changes
  const [pendingLayoutToApply, setPendingLayoutToApply] = useState<LayoutDefinition | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Saved Favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('authcraft_layout_favorites');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleFavorite = (layoutId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const updated = prev.includes(layoutId)
        ? prev.filter((id) => id !== layoutId)
        : [...prev, layoutId];
      try {
        localStorage.setItem('authcraft_layout_favorites', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  // Fetch project configuration from backend
  useEffect(() => {
    if (!activeProject) {
      setLoading(false);
      return;
    }

    const fetchConfig = async () => {
      setLoading(true);
      try {
        const data = await apiRequest<ProjectConfiguration>(
          `/projects/${activeProject.id}/draft`
        );
        const resolvedLayout = data.layout_id || 'minimal-clean-01';
        setConfig(data);
        setSelectedLayoutId(resolvedLayout);

        // Initialize history stack
        setHistory([data]);
        setHistoryIndex(0);
        setIsDirty(false);
      } catch (err) {
        console.error('Failed to load draft config', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [activeProject?.id]);

  // Push to history when config changes (if not triggered by undo/redo)
  const pushConfigChange = (newConfig: ProjectConfiguration) => {
    setConfig(newConfig);
    setIsDirty(true);

    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    setHistory((prev) => {
      const updated = prev.slice(0, historyIndex + 1);
      return [...updated, newConfig];
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const targetConfig = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setConfig(targetConfig);
      if (targetConfig.layout_id) {
        setSelectedLayoutId(targetConfig.layout_id);
      }
      setIsDirty(true);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const targetConfig = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setConfig(targetConfig);
      if (targetConfig.layout_id) {
        setSelectedLayoutId(targetConfig.layout_id);
      }
      setIsDirty(true);
    }
  };

  // Layout Application Logic
  const handleSelectLayout = (layout: LayoutDefinition) => {
    if (layout.id === selectedLayoutId) return;

    // If changes are unsaved, ask confirmation
    if (isDirty) {
      setPendingLayoutToApply(layout);
      setConfirmModalOpen(true);
      return;
    }

    applyLayout(layout);
  };

  const applyLayout = (layout: LayoutDefinition) => {
    setSelectedLayoutId(layout.id);
    const newConfig: ProjectConfiguration = {
      ...config,
      layout_id: layout.id,
      layout_tokens: layout.tokens,
      primary_color: layout.tokens.accentColor || config.primary_color,
      font_family:
        layout.tokens.fontFamily === 'serif'
          ? 'Outfit'
          : layout.tokens.fontFamily === 'mono'
          ? 'System'
          : 'Inter',
      border_radius:
        layout.tokens.borderRadius === 'rounded-none'
          ? 0
          : layout.tokens.borderRadius === 'rounded-full'
          ? 9999
          : 8,
    };
    pushConfigChange(newConfig);
    setConfirmModalOpen(false);
    setPendingLayoutToApply(null);
  };

  // Save Draft to Backend
  const handleSaveDraft = async () => {
    if (!activeProject) return;
    setSaving(true);
    setFeedback(null);

    try {
      const updated = await apiRequest<ProjectConfiguration>(
        `/projects/${activeProject.id}/draft`,
        {
          method: 'PUT',
          body: JSON.stringify({
            ...config,
            layout_id: selectedLayoutId,
          }),
        }
      );
      setConfig(updated);
      setIsDirty(false);
      setFeedback({ type: 'success', message: 'Draft saved successfully.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save draft.' });
    } finally {
      setSaving(false);
    }
  };

  // Publish to Live
  const handlePublish = async () => {
    if (!activeProject) return;
    setPublishing(true);
    setFeedback(null);

    try {
      // First save latest draft
      await apiRequest(`/projects/${activeProject.id}/draft`, {
        method: 'PUT',
        body: JSON.stringify({
          ...config,
          layout_id: selectedLayoutId,
        }),
      });

      // Then publish version
      await apiRequest(`/projects/${activeProject.id}/publish`, {
        method: 'POST',
      });

      await refreshProjects();
      setIsDirty(false);
      setFeedback({
        type: 'success',
        message: 'Published! Hosted login URL is now live with this layout.',
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to publish.' });
    } finally {
      setPublishing(false);
    }
  };

  // Export JSON configuration file
  const handleExportConfig = () => {
    const exportData = {
      project_name: activeProject?.name || 'AuthCraft Project',
      export_version: '2.0',
      exported_at: new Date().toISOString(),
      configuration: {
        ...config,
        layout_id: selectedLayoutId,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `authcraft-${activeProject?.slug || 'config'}-layout.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON configuration file
  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        const importedConfig = raw.configuration || raw;

        if (!importedConfig.brand_name) {
          throw new Error('Invalid AuthCraft configuration file.');
        }

        const merged: ProjectConfiguration = {
          ...config,
          ...importedConfig,
        };

        if (merged.layout_id) {
          setSelectedLayoutId(merged.layout_id);
        }

        pushConfigChange(merged);
        setFeedback({
          type: 'success',
          message: 'Configuration imported successfully! Remember to save or publish.',
        });
        setTimeout(() => setFeedback(null), 4000);
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: err.message || 'Failed to parse configuration JSON.',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Duplicate workspace action
  const handleDuplicateProject = async () => {
    if (!activeProject) return;
    setSaving(true);
    try {
      await apiRequest(`/projects/${activeProject.id}/duplicate`, { method: 'POST' });
      await refreshProjects();
      setFeedback({ type: 'success', message: 'Project duplicated as a new draft workspace!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to duplicate project.' });
    } finally {
      setSaving(false);
    }
  };

  // Filtered layouts list
  const filteredLayouts = filterLayouts({
    category: selectedCategory,
    searchQuery,
    sortBy,
    favorites: showFavoritesOnly ? favorites : [],
  }).filter((l) => (!showFavoritesOnly ? true : favorites.includes(l.id)));

  // Active Layout Definition
  const currentLayoutDef = getLayoutById(selectedLayoutId);

  // Viewport Container Widths
  const viewportWidthClass = {
    desktop: 'w-full max-w-4xl',
    tablet: 'w-[768px]',
    mobile: 'w-[375px]',
  }[previewDevice];

  if (!activeProject && !loading) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
        <Layers className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">No Application Project Selected</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Please select or create an application project to use the Visual Login Page Builder.
        </p>
        <Link
          href="/dashboard/projects"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow"
        >
          <FolderPlus className="w-4 h-4" /> Go to Projects
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Top Builder Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-500 flex items-center justify-center font-bold">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold flex items-center gap-2">
              <span>Visual Login Builder</span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                150 Layouts
              </span>
              {isDirty && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Unsaved Changes
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Active Layout: <span className="font-semibold text-indigo-400">{currentLayoutDef.name}</span> ({currentLayoutDef.categoryLabel})
            </p>
          </div>
        </div>

        {/* Action Controls & Feedback */}
        <div className="flex items-center gap-2 flex-wrap">
          {feedback && (
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Undo / Redo */}
          <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo (Ctrl+Z)"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800" />
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo (Ctrl+Y)"
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Save Draft */}
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Draft</span>
          </button>

          {/* Publish Live */}
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            {publishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Publish to Live</span>
          </button>
        </div>
      </div>

      {/* 3-PANE DESKTOP BUILDER WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        {/* ======================================================== */}
        {/* PANE 1: LEFT PANE (LAYOUT GALLERY & CUSTOMIZER) (4 COLS) */}
        {/* ======================================================== */}
        <div className="lg:col-span-4 flex flex-col bg-white dark:bg-[#121622] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          {/* Left Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-900/50">
            <button
              onClick={() => setLeftTab('library')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                leftTab === 'library'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Layout Library (150)</span>
            </button>
            <button
              onClick={() => setLeftTab('customizer')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                leftTab === 'customizer'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Customize Design</span>
            </button>
          </div>

          {/* TAB 1: 150 LAYOUTS GALLERY */}
          {leftTab === 'library' && (
            <div className="flex-1 flex flex-col min-h-0 p-3 space-y-3">
              {/* Search & Favorites Toggle */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search 150 layouts (e.g. Luxury, Obsidian, Terminal)..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  title={showFavoritesOnly ? 'Show all layouts' : 'Show favorited only'}
                  className={`p-2 rounded-lg border text-xs transition-colors ${
                    showFavoritesOnly
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-amber-400' : ''}`} />
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 shrink-0 no-scrollbar">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-full whitespace-nowrap transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-white'
                  }`}
                >
                  All (150)
                </button>
                {LAYOUT_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-full whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat.label} ({cat.count})
                  </button>
                ))}
              </div>

              {/* Layout Cards Virtual Grid */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredLayouts.length === 0 ? (
                  <div className="p-6 text-center text-xs opacity-50">
                    No layouts match your filter.
                  </div>
                ) : (
                  filteredLayouts.map((layout) => {
                    const isSelected = layout.id === selectedLayoutId;
                    const isFav = favorites.includes(layout.id);

                    return (
                      <div
                        key={layout.id}
                        onClick={() => handleSelectLayout(layout)}
                        className={`group p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 relative ${
                          isSelected
                            ? 'bg-indigo-500/10 border-indigo-500/50 shadow-xs'
                            : 'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            {/* Color Accent Pill */}
                            <div
                              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs border border-white/20"
                              style={{ backgroundColor: layout.tokens.accentColor }}
                            />
                            <h4 className="text-xs font-bold leading-tight truncate">
                              {layout.name}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {layout.category === 'luxury' && (
                              <Crown className="w-3 h-3 text-amber-400" />
                            )}
                            {layout.isNew && (
                              <span className="text-[9px] font-bold px-1 rounded bg-emerald-500/10 text-emerald-400">
                                NEW
                              </span>
                            )}
                            <button
                              onClick={(e) => toggleFavorite(layout.id, e)}
                              className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${
                                  isFav ? 'fill-amber-400 text-amber-400' : ''
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] opacity-70 line-clamp-1 mb-2">
                          {layout.description}
                        </p>

                        <div className="flex items-center justify-between text-[10px] opacity-60">
                          <span className="font-mono uppercase">{layout.family}</span>
                          {isSelected && (
                            <span className="font-bold text-indigo-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Active Layout
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DESIGN CUSTOMIZER */}
          {leftTab === 'customizer' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Brand & Copy */}
              <div className="space-y-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <h4 className="font-bold uppercase tracking-wider text-[10px] opacity-60">
                  Branding & Text Copy
                </h4>

                <div>
                  <label className="block font-semibold mb-1 opacity-80">Brand Name</label>
                  <input
                    type="text"
                    value={config.brand_name || ''}
                    onChange={(e) =>
                      pushConfigChange({ ...config, brand_name: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 opacity-80">Page Title</label>
                  <input
                    type="text"
                    value={config.page_title || ''}
                    onChange={(e) =>
                      pushConfigChange({ ...config, page_title: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 opacity-80">Welcome Message</label>
                  <textarea
                    rows={2}
                    value={config.welcome_message || ''}
                    onChange={(e) =>
                      pushConfigChange({ ...config, welcome_message: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 opacity-80">Button Text</label>
                  <input
                    type="text"
                    value={config.login_text || ''}
                    onChange={(e) =>
                      pushConfigChange({ ...config, login_text: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Accent Color Palette */}
              <div className="space-y-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <h4 className="font-bold uppercase tracking-wider text-[10px] opacity-60">
                  Primary Accent Color
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.primary_color || '#4F46E5'}
                    onChange={(e) =>
                      pushConfigChange({ ...config, primary_color: e.target.value })
                    }
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={config.primary_color || '#4F46E5'}
                    onChange={(e) =>
                      pushConfigChange({ ...config, primary_color: e.target.value })
                    }
                    className="w-24 px-2 py-1 font-mono uppercase bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded text-center"
                  />
                  {/* Preset Swatches */}
                  <div className="flex items-center gap-1.5">
                    {['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#0EA5E9'].map(
                      (hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => pushConfigChange({ ...config, primary_color: hex })}
                          className="w-5 h-5 rounded-full border border-white/30 transition-transform hover:scale-110"
                          style={{ backgroundColor: hex }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Typography & Border Radius */}
              <div className="space-y-3 pb-3 border-b border-slate-200 dark:border-slate-800">
                <h4 className="font-bold uppercase tracking-wider text-[10px] opacity-60">
                  Typography & Corner Geometry
                </h4>

                <div>
                  <label className="block font-semibold mb-1 opacity-80">Font Family</label>
                  <select
                    value={config.font_family || 'Inter'}
                    onChange={(e) =>
                      pushConfigChange({ ...config, font_family: e.target.value as any })
                    }
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg outline-none"
                  >
                    <option value="Inter">Modern Sans (Inter)</option>
                    <option value="Outfit">Refined Serif (Playfair / Outfit)</option>
                    <option value="System">Developer Monospace (Mono / JetBrains)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold opacity-80">Corner Radius</label>
                    <span className="font-mono text-[10px]">{config.border_radius}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="2"
                    value={config.border_radius ?? 8}
                    onChange={(e) =>
                      pushConfigChange({ ...config, border_radius: Number(e.target.value) })
                    }
                    className="w-full"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-[10px] opacity-60">
                  Feature Controls
                </h4>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.show_password_toggle ?? true}
                    onChange={(e) =>
                      pushConfigChange({ ...config, show_password_toggle: e.target.checked })
                    }
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span>Show Password Visibility Eye Toggle</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.show_forgot_password ?? true}
                    onChange={(e) =>
                      pushConfigChange({ ...config, show_forgot_password: e.target.checked })
                    }
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span>Show "Forgot Password?" Recovery Link</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.show_registration ?? true}
                    onChange={(e) =>
                      pushConfigChange({ ...config, show_registration: e.target.checked })
                    }
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span>Allow User Self-Registration</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.allow_otp_login ?? true}
                    onChange={(e) =>
                      pushConfigChange({ ...config, allow_otp_login: e.target.checked })
                    }
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span>Allow 1-Click Email OTP (Passwordless Login)</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-bold">New</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* PANE 2: CENTER PANE (INTERACTIVE LIVE PREVIEW) (5 COLS)  */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 flex flex-col bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs relative">
          {/* Center Device & Mode Toolbar */}
          <div className="p-2 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2 flex-wrap">
            {/* Device Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setPreviewDevice('desktop')}
                title="Desktop View"
                className={`p-1.5 rounded-md transition-colors ${
                  previewDevice === 'desktop'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                title="Tablet View (768px)"
                className={`p-1.5 rounded-md transition-colors ${
                  previewDevice === 'tablet'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                title="Mobile View (375px)"
                className={`p-1.5 rounded-md transition-colors ${
                  previewDevice === 'mobile'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Auth Mode Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setPreviewMode('login')}
                className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                  previewMode === 'login'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setPreviewMode('register')}
                className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                  previewMode === 'register'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => setPreviewMode('forgot')}
                className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                  previewMode === 'forgot'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Reset
              </button>
            </div>

            {/* Direct Open Link */}
            {activeProject?.hosted_login_url && (
              <a
                href={activeProject.hosted_login_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              >
                <span>Live URL</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Canvas Viewport (Scrollable container hosting UniversalLayoutRenderer) */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden flex items-center justify-center p-2 sm:p-4 bg-slate-950">
            <div
              className={`transition-all duration-300 shadow-2xl rounded-2xl overflow-hidden border border-slate-800/80 ${viewportWidthClass}`}
            >
              <UniversalLayoutRenderer
                layout={currentLayoutDef}
                config={{
                  ...config,
                  layout_id: selectedLayoutId,
                }}
                mode={previewMode}
                email={testEmail}
                setEmail={setTestEmail}
                password={testPassword}
                setPassword={setTestPassword}
                displayName={testDisplayName}
                setDisplayName={setTestDisplayName}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                submitting={false}
                handleSubmit={(e) => {
                  e.preventDefault();
                  setTestSuccess({
                    user: { email: testEmail },
                    session_token: 'test_token_sample',
                  });
                  setTimeout(() => setTestSuccess(null), 3500);
                }}
                authSuccess={testSuccess}
                isBuilderPreview={true}
                onSwitchMode={(m) => setPreviewMode(m)}
              />
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PANE 3: RIGHT PANE (TOKENS, JSON, EXPORT / IMPORT) (3 COLS) */}
        {/* ======================================================== */}
        <div className="lg:col-span-3 flex flex-col bg-white dark:bg-[#121622] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          {/* Right Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-900/50">
            <button
              onClick={() => setRightTab('tokens')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
                rightTab === 'tokens'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Tokens</span>
            </button>
            <button
              onClick={() => setRightTab('json')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
                rightTab === 'json'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
            <button
              onClick={() => setRightTab('export_import')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
                rightTab === 'export_import'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          {/* TAB 1: DESIGN TOKENS INSPECTOR */}
          {rightTab === 'tokens' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
              <div>
                <p className="font-sans font-bold text-slate-500 uppercase text-[10px] mb-1">
                  Active Layout Spec
                </p>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                  <p>
                    <span className="opacity-50">ID:</span> {currentLayoutDef.id}
                  </p>
                  <p>
                    <span className="opacity-50">Category:</span> {currentLayoutDef.categoryLabel}
                  </p>
                  <p>
                    <span className="opacity-50">Family:</span> {currentLayoutDef.family}
                  </p>
                  <p>
                    <span className="opacity-50">Theme:</span> {currentLayoutDef.tokens.theme}
                  </p>
                  <p>
                    <span className="opacity-50">Font:</span> {currentLayoutDef.tokens.fontFamily}
                  </p>
                </div>
              </div>

              <div>
                <p className="font-sans font-bold text-slate-500 uppercase text-[10px] mb-1">
                  Container Classes
                </p>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 break-all text-[11px] leading-relaxed">
                  {currentLayoutDef.tokens.container}
                </div>
              </div>

              <div>
                <p className="font-sans font-bold text-slate-500 uppercase text-[10px] mb-1">
                  Card Card Classes
                </p>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 break-all text-[11px] leading-relaxed">
                  {currentLayoutDef.tokens.card}
                </div>
              </div>

              {currentLayoutDef.tokens.badge && (
                <div>
                  <p className="font-sans font-bold text-slate-500 uppercase text-[10px] mb-1">
                    Badge Specification
                  </p>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <p>
                      <span className="opacity-50">Text:</span>{' '}
                      {currentLayoutDef.tokens.badge.text}
                    </p>
                    <p>
                      <span className="opacity-50">Variant:</span>{' '}
                      {currentLayoutDef.tokens.badge.variant}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LIVE CONFIG JSON */}
          {rightTab === 'json' && (
            <div className="flex-1 flex flex-col min-h-0 p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Schema v2.0
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
                    setCopiedJson(true);
                    setTimeout(() => setCopiedJson(false), 2000);
                  }}
                  className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                >
                  {copiedJson ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedJson ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={JSON.stringify(
                  {
                    ...config,
                    layout_id: selectedLayoutId,
                  },
                  null,
                  2
                )}
                className="flex-1 w-full p-2.5 font-mono text-[11px] leading-snug bg-slate-900 text-indigo-200 border border-slate-800 rounded-lg outline-none resize-none overflow-y-auto"
              />
            </div>
          )}

          {/* TAB 3: EXPORT / IMPORT ACTIONS */}
          {rightTab === 'export_import' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                <h5 className="font-bold mb-1">Configuration Portability</h5>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  Export your active layout tokens and branding as portable JSON, or import custom
                  themes across different AuthCraft workspaces.
                </p>
              </div>

              <button
                onClick={handleExportConfig}
                className="w-full py-2.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-indigo-400" />
                <span>Export Configuration (.json)</span>
              </button>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleImportConfig}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Import Configuration (.json)</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <h5 className="font-bold mb-1 opacity-70">Workspace Operations</h5>
                <button
                  onClick={handleDuplicateProject}
                  disabled={saving}
                  className="w-full py-2.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Duplicate Active Workspace</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      {confirmModalOpen && pendingLayoutToApply && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold mb-1">Switch Layout?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              You have unsaved changes in your current configuration. Applying "
              {pendingLayoutToApply.name}" will adopt its design tokens. Do you wish to proceed?
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setConfirmModalOpen(false);
                  setPendingLayoutToApply(null);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg opacity-70 hover:opacity-100"
              >
                Cancel
              </button>
              <button
                onClick={() => applyLayout(pendingLayoutToApply)}
                className="px-4 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow"
              >
                Apply Layout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
