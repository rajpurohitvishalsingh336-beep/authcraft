'use client';

import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { useDashboard } from '../layout';
import { apiRequest } from '@/lib/api';

export default function ProjectSettingsPage() {
  const { activeProject, refreshProjects } = useDashboard();

  const [newOrigin, setNewOrigin] = useState('');
  const [newRedirectUri, setNewRedirectUri] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form states initialized from activeProject
  const [allowRegistration, setAllowRegistration] = useState(activeProject?.allow_registration ?? true);
  const [requireVerification, setRequireVerification] = useState(activeProject?.require_email_verification ?? false);
  const [sessionHours, setSessionHours] = useState(Math.round((activeProject?.session_duration_minutes ?? 1440) / 60));
  const [passwordMinLength, setPasswordMinLength] = useState(activeProject?.password_min_length ?? 8);

  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;

    setSavingSettings(true);
    setFeedback(null);
    try {
      await apiRequest(`/projects/${activeProject.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          allow_registration: allowRegistration,
          require_email_verification: requireVerification,
          session_duration_minutes: sessionHours * 60,
          password_min_length: passwordMinLength,
        }),
      });
      await refreshProjects();
      setFeedback('Project security policies updated successfully.');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddOrigin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newOrigin.trim()) return;

    try {
      await apiRequest(`/projects/${activeProject.id}/origins`, {
        method: 'POST',
        body: JSON.stringify({ origin: newOrigin.trim() }),
      });
      setNewOrigin('');
      await refreshProjects();
      setFeedback('Allowed origin added.');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to add origin.');
    }
  };

  const handleDeleteOrigin = async (originId: string) => {
    if (!activeProject) return;
    try {
      await apiRequest(`/projects/${activeProject.id}/origins/${originId}`, { method: 'DELETE' });
      await refreshProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete origin.');
    }
  };

  const handleAddRedirectUri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !newRedirectUri.trim()) return;

    try {
      await apiRequest(`/projects/${activeProject.id}/redirect-uris`, {
        method: 'POST',
        body: JSON.stringify({ redirect_uri: newRedirectUri.trim() }),
      });
      setNewRedirectUri('');
      await refreshProjects();
      setFeedback('Redirect URI added.');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to add redirect URI.');
    }
  };

  const handleDeleteRedirectUri = async (redirectId: string) => {
    if (!activeProject) return;
    try {
      await apiRequest(`/projects/${activeProject.id}/redirect-uris/${redirectId}`, {
        method: 'DELETE' });
      await refreshProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete redirect URI.');
    }
  };

  const handleUnpublish = async () => {
    if (!activeProject || !confirm('Are you sure you want to unpublish this project? Its hosted login link will return a disabled status until republished.')) return;
    try {
      await apiRequest(`/projects/${activeProject.id}/unpublish`, { method: 'POST' });
      await refreshProjects();
      setFeedback('Project has been unpublished.');
    } catch (err: any) {
      alert(err.message || 'Failed to unpublish project.');
    }
  };

  if (!activeProject) {
    return <div className="p-8 text-center text-slate-500">Please select an application project.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-[Inter]">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Project Configuration & Policies</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure security rules, approved redirect URIs, and CORS origins for <span className="font-semibold text-slate-900">{activeProject.name}</span>.
        </p>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 1. Security Policies */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600" /> Authentication Policies
        </h2>

        <form onSubmit={handleSavePolicies} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Password Length
              </label>
              <input
                type="number"
                min={6}
                max={32}
                value={passwordMinLength}
                onChange={(e) => setPasswordMinLength(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Session Expiration (Hours)
              </label>
              <input
                type="number"
                min={1}
                max={720}
                value={sessionHours}
                onChange={(e) => setSessionHours(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={allowRegistration}
                onChange={(e) => setAllowRegistration(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Allow new end-user registrations (uncheck to make application invite/admin-only)
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
              <input
                type="checkbox"
                checked={requireVerification}
                onChange={(e) => setRequireVerification(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Require email verification before permitting end-user login
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              {savingSettings ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Security Policies'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Allowed Redirect URIs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-1">Allowed Redirect URIs</h2>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          When your application links users to AuthCraft hosted login with a <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">?redirect_uri=...</code> parameter, the destination must match this allowlist. Open redirects to unauthorized URLs are strictly rejected.
        </p>

        <form onSubmit={handleAddRedirectUri} className="flex gap-2 mb-4">
          <input
            type="url"
            required
            placeholder="https://myapp.com/callback or http://localhost:3000/callback"
            value={newRedirectUri}
            onChange={(e) => setNewRedirectUri(e.target.value)}
            className="flex-1 text-xs px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add URI
          </button>
        </form>

        <div className="space-y-2">
          {activeProject.allowed_redirect_uris.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No redirect URIs configured.</p>
          ) : (
            activeProject.allowed_redirect_uris.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-mono text-slate-800"
              >
                <span>{r.redirect_uri}</span>
                <button
                  onClick={() => handleDeleteRedirectUri(r.id)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  title="Remove Redirect URI"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Allowed Origins (CORS) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 mb-1">Allowed Origins (CORS)</h2>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Origins authorized to communicate with AuthCraft APIs on behalf of this project.
        </p>

        <form onSubmit={handleAddOrigin} className="flex gap-2 mb-4">
          <input
            type="text"
            required
            placeholder="https://myapp.com or http://localhost:3000"
            value={newOrigin}
            onChange={(e) => setNewOrigin(e.target.value)}
            className="flex-1 text-xs px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Origin
          </button>
        </form>

        <div className="space-y-2">
          {activeProject.allowed_origins.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No custom origins added yet.</p>
          ) : (
            activeProject.allowed_origins.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-mono text-slate-800"
              >
                <span>{o.origin}</span>
                <button
                  onClick={() => handleDeleteOrigin(o.id)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  title="Remove Origin"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Publishing & Danger Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">Publishing State</h2>

        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div>
            <p className="text-xs font-bold text-slate-900">
              {activeProject.is_published ? 'Hosted Authentication is Active' : 'Hosted Page is Unpublished'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {activeProject.is_published
                ? 'Your users can currently sign in and register through the hosted login URL.'
                : 'Users cannot authenticate until you publish from the visual builder.'}
            </p>
          </div>

          {activeProject.is_published && (
            <button
              onClick={handleUnpublish}
              className="px-3.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors"
            >
              Unpublish Project
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
