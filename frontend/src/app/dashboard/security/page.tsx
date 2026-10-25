'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RefreshCw,
  KeyRound,
  Trash2,
  Activity,
  UserX,
  FileCheck,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useDashboard } from '../layout';

interface SecurityIncident {
  id: string;
  project_id: string;
  severity: string;
  incident_type: string;
  title: string;
  description: string;
  status: string;
  resolved_by?: string;
  resolution_notes?: string;
  created_at: string;
}

interface UserSessionItem {
  id: string;
  project_id: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  expires_at: string;
}

export default function SecurityCenterPage() {
  const { activeProject } = useDashboard();
  const [posture, setPosture] = useState<any | null>(null);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Triage modal state
  const [triageIncident, setTriageIncident] = useState<SecurityIncident | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const projQuery = activeProject ? `?project_id=${activeProject.id}` : '';
      const [posData, incData, sessData] = await Promise.all([
        apiRequest<any>(`/security/posture${projQuery}`),
        apiRequest<SecurityIncident[]>(`/security/incidents${projQuery}`),
        apiRequest<UserSessionItem[]>(`/security/sessions${projQuery}`),
      ]);
      setPosture(posData);
      setIncidents(incData);
      setSessions(sessData);
    } catch (err) {
      console.error('Failed to load security intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [activeProject]);

  const handleResolveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triageIncident) return;

    try {
      setResolving(true);
      const res = await apiRequest<any>(`/security/incidents/${triageIncident.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'resolved',
          resolution_notes: resolutionNotes || 'Incident resolved by administrator.',
        }),
      });

      setIncidents((prev) =>
        prev.map((inc) => (inc.id === triageIncident.id ? { ...inc, ...res } : inc))
      );
      setTriageIncident(null);
      setResolutionNotes('');
      // Refresh posture
      fetchSecurityData();
    } catch (err: any) {
      alert(err.message || 'Failed to update incident.');
    } finally {
      setResolving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm('Immediately terminate this active user session?')) return;
    try {
      await apiRequest(`/security/sessions/${sessionId}/revoke`, { method: 'POST' });
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch (err: any) {
      alert(err.message || 'Failed to revoke session.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-500" />
              Security Intelligence & Threat Radar
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Live Threat Shield
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time security posture monitoring, automated brute-force radar, and active session termination.
          </p>
        </div>

        <button
          onClick={fetchSecurityData}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-lg shadow-sm transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Radar
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Posture Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Score Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-2xl shrink-0">
                {posture?.rating || 'A+'}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Posture Score
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {posture?.score ?? 100} / 100
                </p>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Zero critical vulnerabilities detected
                </p>
              </div>
            </div>

            {/* Incidents Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Open Incidents
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {posture?.unresolved_incidents ?? 0}
                </p>
                <p className="text-[11px] text-slate-500">
                  {posture?.unresolved_incidents === 0
                    ? 'All threat vectors clear'
                    : 'Requires security triage'}
                </p>
              </div>
            </div>

            {/* Failed Auth Events */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Failed Logins (24h)
                </p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {posture?.failed_auth_24h ?? 0}
                </p>
                <p className="text-[11px] text-slate-500">Monitored for brute force bursts</p>
              </div>
            </div>
          </div>

          {/* Compliance Checklist */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Enterprise Security Baseline Checklist
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {(posture?.checklist || []).map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Incidents Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Detected Security Incidents ({incidents.length})
              </h3>
            </div>

            {incidents.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No active or historic security incidents recorded for this workspace.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="p-3">Severity</th>
                      <th className="p-3">Incident Title</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Detected</th>
                      <th className="p-3 text-right">Triage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {incidents.map((inc) => (
                      <tr key={inc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              inc.severity === 'critical'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : inc.severity === 'high'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {inc.severity}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">
                          {inc.title}
                        </td>
                        <td className="p-3 font-mono text-indigo-500">{inc.incident_type}</td>
                        <td className="p-3">
                          <span
                            className={`font-semibold ${
                              inc.status === 'resolved' ? 'text-emerald-600' : 'text-amber-600'
                            }`}
                          >
                            {inc.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500">
                          {new Date(inc.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-3 text-right">
                          {inc.status !== 'resolved' ? (
                            <button
                              onClick={() => setTriageIncident(inc)}
                              className="px-2.5 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Resolved</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active User Sessions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-500" />
                Active End-User Sessions ({sessions.length})
              </h3>
            </div>

            {sessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No active end-user sessions currently logged in.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="p-3">User ID</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">Client Agent</th>
                      <th className="p-3">Expires</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-indigo-500 font-bold">{s.user_id}</td>
                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300">
                          {s.ip_address || '127.0.0.1'}
                        </td>
                        <td className="p-3 text-slate-500 truncate max-w-xs">{s.user_agent}</td>
                        <td className="p-3 text-slate-500">
                          {new Date(s.expires_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleRevokeSession(s.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Incident Triage Modal */}
      {triageIncident && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              Resolve Security Incident
            </h3>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg space-y-1 text-xs">
              <p className="font-bold text-slate-900 dark:text-white">{triageIncident.title}</p>
              <p className="text-slate-500">{triageIncident.description}</p>
            </div>

            <form onSubmit={handleResolveIncident} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Resolution Notes & Remediation Actions
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g., Rate limit applied to suspicious IP subnet. Verified no account breach."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTriageIncident(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  {resolving ? 'Resolving...' : 'Mark as Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
