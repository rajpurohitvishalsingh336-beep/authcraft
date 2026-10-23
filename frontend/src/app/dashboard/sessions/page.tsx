'use client';

import React, { useEffect, useState } from 'react';
import {
  KeyRound,
  ShieldAlert,
  Loader2,
  Trash2,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useDashboard } from '../layout';
import { apiRequest } from '@/lib/api';

export default function ActiveSessionsPage() {
  const { activeProject } = useDashboard();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchSessions = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const data = await apiRequest(`/projects/${activeProject.id}/sessions`);
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [activeProject]);

  const handleRevokeSession = async (sessionId: string) => {
    if (!activeProject) return;
    try {
      await apiRequest(`/projects/${activeProject.id}/sessions/${sessionId}/revoke`, {
        method: 'POST',
      });
      setSessions(sessions.filter((s) => s.id !== sessionId));
      setFeedback('Session revoked successfully.');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to revoke session.');
    }
  };

  if (!activeProject) {
    return <div className="p-8 text-center text-slate-500">Please select an application project.</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-[Inter]">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Active End-User Sessions</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Inspect and revoke active browser sessions for users in <span className="font-semibold text-slate-900">{activeProject.name}</span>.
        </p>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            Loading active sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <KeyRound className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No active sessions</p>
            <p className="mt-1">Active sessions will appear here as users sign in to your hosted pages.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Session ID</th>
                  <th className="px-6 py-3">User ID</th>
                  <th className="px-6 py-3">Client IP</th>
                  <th className="px-6 py-3">Expires At</th>
                  <th className="px-6 py-3">Created At</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-[11px] text-slate-700">
                      {s.id.substring(0, 13)}...
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[11px] text-slate-500">
                      {s.user_id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[11px] text-slate-700">
                      {s.ip_address || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {new Date(s.expires_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-slate-400">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleRevokeSession(s.id)}
                        className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold hover:bg-rose-100 transition-colors"
                      >
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
  );
}
