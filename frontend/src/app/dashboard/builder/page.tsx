'use client';

import React, { useEffect, useState } from 'react';
import {
  Palette,
  Save,
  Send,
  RotateCcw,
  Smartphone,
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
} from 'lucide-react';
import { useDashboard } from '../layout';
import { apiRequest } from '@/lib/api';
import { ProjectConfiguration } from '@/lib/types';

export default function VisualBuilderPage() {
  const { activeProject, refreshProjects } = useDashboard();

  const [config, setConfig] = useState<ProjectConfiguration>({
    brand_name: 'My Application',
    page_title: 'Sign In to Your Account',
    logo_url: null,
    primary_color: '#4F46E5',
    secondary_color: '#6366F1',
    background_color: '#F8FAFC',
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
    welcome_message: 'Welcome back! Please enter your details.',
    login_text: 'Sign in to continue to your dashboard',
    register_text: 'Create an account to get started',
    email_label: 'Email Address',
    password_label: 'Password',
    footer_text: 'Protected by AuthCraft No-Code Security',
    show_password_toggle: true,
    show_forgot_password: true,
    show_registration: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewMode, setPreviewMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!activeProject) return;

    const fetchConfig = async () => {
      setLoading(true);
      try {
        const data = await apiRequest<ProjectConfiguration>(
          `/projects/${activeProject.id}/draft`
        );
        setConfig(data);
      } catch (err) {
        console.error('Failed to load draft config', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [activeProject]);

  const handleSaveDraft = async () => {
    if (!activeProject) return;
    setSaving(true);
    setFeedback(null);

    try {
      const updated = await apiRequest<ProjectConfiguration>(
        `/projects/${activeProject.id}/draft`,
        {
          method: 'PUT',
          body: JSON.stringify(config),
        }
      );
      setConfig(updated);
      setFeedback({ type: 'success', message: 'Draft saved successfully.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save draft.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!activeProject) return;
    setPublishing(true);
    setFeedback(null);

    try {
      // First save draft
      await apiRequest(`/projects/${activeProject.id}/draft`, {
        method: 'PUT',
        body: JSON.stringify(config),
      });

      // Then publish
      await apiRequest(`/projects/${activeProject.id}/publish`, {
        method: 'POST',
      });

      await refreshProjects();
      setFeedback({
        type: 'success',
        message: 'Project published to production! Your hosted login URL is now live.',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to publish configuration.' });
    } finally {
      setPublishing(false);
    }
  };

  const handleApplyTemplate = async (templateName: string) => {
    if (!activeProject) return;
    try {
      const updated = await apiRequest<ProjectConfiguration>(
        `/projects/${activeProject.id}/apply-template/${templateName}`,
        { method: 'POST' }
      );
      setConfig(updated);
      setFeedback({ type: 'success', message: `Applied '${templateName}' template.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to apply template.' });
    }
  };

  if (!activeProject) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-600">
        Please select or create an application project first.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-xs font-semibold">Loading Visual Page Builder...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-[Inter]">
      {/* Action Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900">Visual Login Page Builder</h1>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeProject.is_published
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {activeProject.is_published
                ? `Published (v${activeProject.published_version})`
                : 'Editing Draft'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure styling, typography, branding, and text. Preview changes reactively.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Draft
          </button>

          <button
            onClick={handlePublish}
            disabled={publishing}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {publishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            Publish to Live Link
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Builder Grid: Left Settings Pane, Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Settings Pane (5 cols) */}
        <div className="lg:col-span-5 space-y-4 max-h-[800px] overflow-y-auto pr-1">
          {/* 1. Template Presets */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Predefined Templates
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'modern', name: 'Modern' },
                { id: 'minimal', name: 'Minimal' },
                { id: 'professional', name: 'Professional' },
                { id: 'dark', name: 'Dark' },
                { id: 'startup', name: 'Startup' },
                { id: 'classic', name: 'Classic' },
              ].map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => handleApplyTemplate(tmpl.id)}
                  className={`px-2.5 py-2 text-xs font-semibold rounded-lg border text-center transition-all ${
                    config.template_name === tmpl.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Brand & Identity */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Brand & Identity
            </label>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Brand Name</label>
              <input
                type="text"
                value={config.brand_name}
                onChange={(e) => setConfig({ ...config, brand_name: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Page Title</label>
              <input
                type="text"
                value={config.page_title}
                onChange={(e) => setConfig({ ...config, page_title: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Logo URL (Optional)</label>
              <input
                type="text"
                placeholder="https://example.com/logo.png"
                value={config.logo_url || ''}
                onChange={(e) => setConfig({ ...config, logo_url: e.target.value || null })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 3. Colors & Theme Mode */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Color Palette & Theme
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.primary_color}
                    onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                    className="w-8 h-8 rounded border p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.primary_color}
                    onChange={(e) => setConfig({ ...config, primary_color: e.target.value })}
                    className="w-full text-xs font-mono px-2 py-1.5 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.background_color}
                    onChange={(e) => setConfig({ ...config, background_color: e.target.value })}
                    className="w-8 h-8 rounded border p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.background_color}
                    onChange={(e) => setConfig({ ...config, background_color: e.target.value })}
                    className="w-full text-xs font-mono px-2 py-1.5 border border-slate-300 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Card Background</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.card_background_color}
                    onChange={(e) => setConfig({ ...config, card_background_color: e.target.value })}
                    className="w-8 h-8 rounded border p-0.5 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={config.card_background_color}
                    onChange={(e) => setConfig({ ...config, card_background_color: e.target.value })}
                    className="w-full text-xs font-mono px-2 py-1.5 border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Theme Mode</label>
                <select
                  value={config.theme_mode}
                  onChange={(e) => setConfig({ ...config, theme_mode: e.target.value as any })}
                  className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="light">Light Theme</option>
                  <option value="dark">Dark Theme</option>
                </select>
              </div>
            </div>
          </div>

          {/* 4. Layout, Typography & Shapes */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Styling & Typography
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Font Family</label>
                <select
                  value={config.font_family}
                  onChange={(e) => setConfig({ ...config, font_family: e.target.value as any })}
                  className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Inter">Inter (Clean)</option>
                  <option value="Roboto">Roboto (Classic)</option>
                  <option value="Poppins">Poppins (Friendly)</option>
                  <option value="Outfit">Outfit (Modern)</option>
                  <option value="System">System Sans</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Border Radius</label>
                <select
                  value={config.border_radius}
                  onChange={(e) => setConfig({ ...config, border_radius: Number(e.target.value) })}
                  className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value={0}>Sharp (0px)</option>
                  <option value={4}>Small (4px)</option>
                  <option value={8}>Medium (8px)</option>
                  <option value={12}>Large (12px)</option>
                  <option value={16}>Extra Large (16px)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Button Style</label>
                <select
                  value={config.button_style}
                  onChange={(e) => setConfig({ ...config, button_style: e.target.value as any })}
                  className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="rounded">Rounded</option>
                  <option value="solid">Solid Square</option>
                  <option value="pill">Pill (Full Round)</option>
                  <option value="outline">Outlined</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Form Width</label>
                <select
                  value={config.form_width}
                  onChange={(e) => setConfig({ ...config, form_width: e.target.value as any })}
                  className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="sm">Compact (sm)</option>
                  <option value="md">Standard (md)</option>
                  <option value="lg">Spacious (lg)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 5. Copy & Copywriting */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Form Copy & Labels
            </label>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Welcome Message</label>
              <input
                type="text"
                value={config.welcome_message}
                onChange={(e) => setConfig({ ...config, welcome_message: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Label</label>
                <input
                  type="text"
                  value={config.email_label}
                  onChange={(e) => setConfig({ ...config, email_label: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Password Label</label>
                <input
                  type="text"
                  value={config.password_label}
                  onChange={(e) => setConfig({ ...config, password_label: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Footer Disclaimer</label>
              <input
                type="text"
                value={config.footer_text}
                onChange={(e) => setConfig({ ...config, footer_text: e.target.value })}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
              />
            </div>
          </div>

          {/* 6. Feature Toggles */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Feature Toggles
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={config.show_password_toggle}
                onChange={(e) => setConfig({ ...config, show_password_toggle: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Enable password show/hide visibility toggle
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={config.show_forgot_password}
                onChange={(e) => setConfig({ ...config, show_forgot_password: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Show &quot;Forgot password?&quot; recovery link
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={config.show_registration}
                onChange={(e) => setConfig({ ...config, show_registration: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Show &quot;Create account&quot; registration link
            </label>
          </div>
        </div>

        {/* Right Live Preview Pane (7 cols) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          {/* Preview Controls Bar */}
          <div className="w-full bg-white p-3 rounded-2xl border border-slate-200 shadow-sm mb-4 flex items-center justify-between gap-4">
            {/* View Mode Toggle: Login / Register / Forgot */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setPreviewMode('login')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  previewMode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setPreviewMode('register')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  previewMode === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign Up
              </button>
              <button
                onClick={() => setPreviewMode('forgot')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  previewMode === 'forgot'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Reset
              </button>
            </div>

            {/* Device Frame Toggle */}
            <div className="flex items-center gap-1 text-slate-500">
              <button
                onClick={() => setPreviewDevice('desktop')}
                title="Desktop View"
                className={`p-1.5 rounded-lg border transition-all ${
                  previewDevice === 'desktop'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                title="Mobile View"
                className={`p-1.5 rounded-lg border transition-all ${
                  previewDevice === 'mobile'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Interactive Live Canvas Frame */}
          <div
            className={`w-full transition-all duration-300 rounded-3xl p-6 sm:p-10 flex items-center justify-center min-h-[620px] border shadow-inner ${
              config.theme_mode === 'dark' ? 'border-slate-800' : 'border-slate-300'
            }`}
            style={{
              backgroundColor: config.background_color,
              fontFamily: config.font_family,
            }}
          >
            {/* The Live Rendered Card */}
            <div
              className={`w-full transition-all shadow-xl p-6 sm:p-8 ${
                previewDevice === 'mobile' ? 'max-w-[340px]' : 'max-w-[440px]'
              }`}
              style={{
                backgroundColor: config.card_background_color,
                borderRadius: `${config.border_radius}px`,
                color: config.text_color,
              }}
            >
              {/* Header Branding */}
              <div className="text-center mb-6">
                {config.logo_url ? (
                  <img
                    src={config.logo_url}
                    alt={config.brand_name}
                    className="w-12 h-12 object-contain mx-auto mb-3"
                  />
                ) : (
                  <div
                    className="w-12 h-12 mx-auto flex items-center justify-center text-white mb-3 shadow-md"
                    style={{
                      backgroundColor: config.primary_color,
                      borderRadius:
                        config.button_style === 'pill'
                          ? '9999px'
                          : `${config.border_radius}px`,
                    }}
                  >
                    <Lock className="w-6 h-6" />
                  </div>
                )}
                <h2 className="text-xl font-bold tracking-tight">{config.brand_name}</h2>
                <p className="text-xs opacity-75 mt-1">
                  {previewMode === 'login'
                    ? config.welcome_message
                    : previewMode === 'register'
                    ? config.register_text
                    : 'Enter your email to receive recovery instructions.'}
                </p>
              </div>

              {/* Form Content */}
              <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                {previewMode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold mb-1 opacity-80">Full Name</label>
                    <input
                      type="text"
                      disabled
                      placeholder="Jane Doe"
                      className="w-full text-xs px-3.5 py-2.5 border border-slate-300 bg-transparent opacity-75"
                      style={{ borderRadius: `${config.border_radius}px` }}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold mb-1 opacity-80">{config.email_label}</label>
                  <input
                    type="email"
                    disabled
                    placeholder="user@example.com"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 bg-transparent opacity-75"
                    style={{ borderRadius: `${config.border_radius}px` }}
                  />
                </div>

                {previewMode !== 'forgot' && (
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold opacity-80">{config.password_label}</label>
                      {config.show_forgot_password && previewMode === 'login' && (
                        <span
                          onClick={() => setPreviewMode('forgot')}
                          className="text-[11px] font-semibold cursor-pointer hover:underline"
                          style={{ color: config.primary_color }}
                        >
                          Forgot password?
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        disabled
                        value="SamplePassword123"
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-300 bg-transparent opacity-75 pr-10"
                        style={{ borderRadius: `${config.border_radius}px` }}
                      />
                      {config.show_password_toggle && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-xs opacity-60 hover:opacity-100"
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="button"
                  className="w-full py-2.5 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-1.5"
                  style={{
                    backgroundColor: config.primary_color,
                    borderRadius:
                      config.button_style === 'pill'
                        ? '9999px'
                        : `${config.border_radius}px`,
                  }}
                >
                  {previewMode === 'login'
                    ? 'Sign In'
                    : previewMode === 'register'
                    ? 'Create Account'
                    : 'Send Reset Link'}
                </button>
              </form>

              {/* Mode Switchers */}
              <div className="mt-6 text-center text-xs opacity-75">
                {previewMode === 'login' ? (
                  config.show_registration && (
                    <>
                      Don&apos;t have an account?{' '}
                      <span
                        onClick={() => setPreviewMode('register')}
                        className="font-bold cursor-pointer hover:underline"
                        style={{ color: config.primary_color }}
                      >
                        Sign up
                      </span>
                    </>
                  )
                ) : (
                  <>
                    Already have an account?{' '}
                    <span
                      onClick={() => setPreviewMode('login')}
                      className="font-bold cursor-pointer hover:underline"
                      style={{ color: config.primary_color }}
                    >
                      Sign in
                    </span>
                  </>
                )}
              </div>

              {/* Footer text */}
              <div className="mt-8 pt-4 border-t border-slate-200/40 text-center text-[10px] opacity-60">
                {config.footer_text}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
