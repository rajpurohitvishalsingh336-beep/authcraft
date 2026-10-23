'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Users,
  Activity,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Palette,
  KeyRound,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  FolderPlus,
} from 'lucide-react';
import { useDashboard } from './layout';
import { apiRequest } from '@/lib/api';
import { AuthEvent } from '@/lib/types';

export default function DashboardOverviewPage() {
  const { developer, projects, activeProject, dashboardTheme } = useDashboard();
  const [overviewData, setOverviewData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const data = await apiRequest('/dashboard/overview');
        setOverviewData(data);
      } catch (err) {
        console.error('Failed to load dashboard overview', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOverview();
  }, [projects.length]);

  const stats = overviewData?.stats || {
    total_projects: projects.length,
    total_users: 0,
    total_events: 0,
    plan: 'Developer Free Tier',
    project_limit: 10,
  };

  const recentEvents: AuthEvent[] = overviewData?.recent_events || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-100 text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" /> AuthCraft V2 Architecture
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {developer?.full_name || 'Developer'}
          </h1>
          <p className="mt-2 text-indigo-100 text-xs sm:text-sm leading-relaxed">
            Manage your applications, customize hosted login pages with the visual builder across 150 distinct layouts, and monitor audit events with strict project isolation.
          </p>

          {activeProject && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/builder"
                className="px-4 py-2 rounded-xl bg-white text-indigo-700 text-xs font-bold hover:bg-indigo-50 shadow-sm transition-all flex items-center gap-1.5"
              >
                <Palette className="w-4 h-4" /> Open Visual Builder (150 Layouts)
              </Link>
              <a
                href={activeProject.hosted_login_url}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-indigo-500/30 border border-white/20 text-white text-xs font-bold hover:bg-indigo-500/50 transition-all flex items-center gap-1.5"
              >
                <ExternalLink className="w-4 h-4" /> Launch Hosted Login Page
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#121622] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Projects
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold">{stats.total_projects}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Quota: {stats.total_projects} / {stats.project_limit} active
          </div>
        </div>

        <div className="bg-white dark:bg-[#121622] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              End Users
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold">{stats.total_users}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across all authorized projects
          </div>
        </div>

        <div className="bg-white dark:bg-[#121622] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Audit Events
            </span>
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold">{stats.total_events}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Logins, registrations & security
          </div>
        </div>

        <div className="bg-white dark:bg-[#121622] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Plan
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-extrabold">{stats.plan}</div>
          <div className="text-xs text-emerald-500 font-semibold mt-1">
            ✓ Unlimited Authentications
          </div>
        </div>
      </div>

      {/* Active Project Highlight Card */}
      {activeProject ? (
        <div className="bg-white dark:bg-[#121622] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{activeProject.name}</h2>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    activeProject.is_published
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {activeProject.is_published
                    ? `Published (v${activeProject.published_version})`
                    : 'Draft / Unpublished'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {activeProject.description || 'No description provided.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/builder"
                className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Palette className="w-3.5 h-3.5" /> Customize Page
              </Link>
              <Link
                href="/dashboard/settings"
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Settings
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Registered Project Users:</span>
              <p className="text-base font-bold mt-0.5">{activeProject.total_users}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Authentication Events:</span>
              <p className="text-base font-bold mt-0.5">{activeProject.total_events}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Session Duration:</span>
              <p className="text-base font-bold mt-0.5">
                {Math.round(activeProject.session_duration_minutes / 60)} hours
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#121622] rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <p className="text-sm font-semibold">No applications found.</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create your first application project to get started.
          </p>
        </div>
      )}

      {/* Recent Security & Authentication Events */}
      <div className="bg-white dark:bg-[#121622] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-bold">Recent Security & Authentication Events</h3>
          </div>
          <Link
            href="/dashboard/events"
            className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 flex items-center gap-1"
          >
            View all logs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            No authentication events recorded yet. Once your end users authenticate through your hosted login page, events will appear here in real time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3">Event Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Target Email</th>
                  <th className="px-6 py-3">Client IP</th>
                  <th className="px-6 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentEvents.map((evt) => (
                  <tr
                    key={evt.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-white">
                      {evt.event_type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          evt.status === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {evt.status === 'success' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {evt.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[11px]">
                      {evt.email_attempted || '—'}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[11px] opacity-70">
                      {evt.ip_address || '—'}
                    </td>
                    <td className="px-6 py-3.5 opacity-60">
                      {new Date(evt.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
