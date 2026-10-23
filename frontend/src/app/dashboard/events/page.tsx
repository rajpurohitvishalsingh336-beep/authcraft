'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Filter,
  Loader2,
  Calendar,
} from 'lucide-react';
import { useDashboard } from '../layout';
import { apiRequest } from '@/lib/api';
import { AuthEvent } from '@/lib/types';

export default function AuthEventsPage() {
  const { activeProject } = useDashboard();
  const [events, setEvents] = useState<AuthEvent[]>([]);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (eventTypeFilter) params.append('event_type', eventTypeFilter);
      if (statusFilter) params.append('status_filter', statusFilter);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const data = await apiRequest<AuthEvent[]>(`/projects/${activeProject.id}/events${qs}`);
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeProject, eventTypeFilter, statusFilter]);

  if (!activeProject) {
    return <div className="p-8 text-center text-slate-500">Please select an application project.</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-[Inter]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Security & Authentication Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit trail of authentication attempts, registrations, and security actions for <span className="font-semibold text-slate-900">{activeProject.name}</span>.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
          >
            <option value="">All Event Types</option>
            <option value="login_success">Login Success</option>
            <option value="login_failed">Login Failed</option>
            <option value="register">Registration</option>
            <option value="logout">Logout</option>
            <option value="password_reset_request">Password Reset Request</option>
            <option value="password_reset_complete">Password Reset Complete</option>
            <option value="email_verified">Email Verified</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
          >
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            Loading audit events...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No security events found</p>
            <p className="mt-1">Events will appear here as users authenticate or attempt actions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Event Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Target Email</th>
                  <th className="px-6 py-3">Client IP</th>
                  <th className="px-6 py-3">Failure Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(evt.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900">
                      {evt.event_type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          evt.status === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
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
                    <td className="px-6 py-3.5 font-mono text-[11px] text-slate-800">
                      {evt.email_attempted || '—'}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[11px] text-slate-500">
                      {evt.ip_address || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {evt.failure_reason || '—'}
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
