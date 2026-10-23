'use client';

import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Globe,
} from 'lucide-react';
import { useDashboard } from '../layout';
import { apiRequest } from '@/lib/api';
import { Project } from '@/lib/types';

export default function MyProjectsPage() {
  const { projects, activeProject, refreshProjects, setActiveProject } = useDashboard();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);

  const handleDuplicateProject = async (projectId: string) => {
    setDuplicating(projectId);
    try {
      await apiRequest(`/projects/${projectId}/duplicate`, { method: 'POST' });
      await refreshProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate project.');
    } finally {
      setDuplicating(null);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteProject = async (projectId: string) => {
    setDeleting(true);
    try {
      await apiRequest(`/projects/${projectId}`, { method: 'DELETE' });
      await refreshProjects();
      setDeleteConfirm(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete project.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-[Inter]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Application Projects</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your isolated authentication applications, view hosted login URLs, and configure security rules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((proj) => {
          const isActive = activeProject?.id === proj.id;
          return (
            <div
              key={proj.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition-all ${
                isActive ? 'border-indigo-500 ring-2 ring-indigo-50' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">{proj.name}</h2>
                    {isActive && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Active Selection
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                    {proj.description || 'No description provided.'}
                  </p>
                </div>

                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    proj.is_published
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {proj.is_published ? `Published (v${proj.published_version})` : 'Draft'}
                </span>
              </div>

              {/* Identifiers */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-2 text-xs mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium text-[11px]">Project ID:</span>
                  <div className="flex items-center gap-1 font-mono text-[11px] text-slate-700">
                    <span>{proj.id}</span>
                    <button
                      onClick={() => copyToClipboard(proj.id, `id-${proj.id}`)}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500"
                    >
                      {copiedId === `id-${proj.id}` ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium text-[11px]">Hosted Link:</span>
                  <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-mono">
                    <span className="truncate max-w-[200px]">{proj.hosted_login_url}</span>
                    <button
                      onClick={() => copyToClipboard(proj.hosted_login_url, `url-${proj.id}`)}
                      className="p-1 hover:bg-slate-200 rounded text-indigo-600"
                      title="Copy URL"
                    >
                      {copiedId === `url-${proj.id}` ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <a
                      href={proj.hosted_login_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 hover:bg-slate-200 rounded text-indigo-600"
                      title="Open Login Page"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-4 text-slate-500 font-medium text-[11px]">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> {proj.total_users} Users
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-slate-400" /> {proj.total_events} Events
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!isActive && (
                    <button
                      onClick={() => setActiveProject(proj)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 transition-colors"
                    >
                      Select
                    </button>
                  )}

                  <button
                    onClick={() => handleDuplicateProject(proj.id)}
                    disabled={duplicating === proj.id}
                    title="Duplicate Project Configuration"
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors flex items-center gap-1"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{duplicating === proj.id ? 'Duplicating...' : 'Duplicate'}</span>
                  </button>

                  {deleteConfirm === proj.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        disabled={deleting}
                        className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1 rounded bg-slate-200 text-slate-700 text-[10px] font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(proj.id)}
                      title="Delete Project"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
