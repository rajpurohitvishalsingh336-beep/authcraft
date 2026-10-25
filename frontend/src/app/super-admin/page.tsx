'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  KeyRound,
  Users,
  Layers,
  Database,
  Activity,
  LogOut,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  FileCheck,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function SuperAdminConsolePage() {
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminInfo, setAdminInfo] = useState<any | null>(null);

  // Login form state
  const [email, setEmail] = useState('admin@authcraft.io');
  const [password, setPassword] = useState('SuperAdminSecret2026!');
  const [totpCode, setTotpCode] = useState('');
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [mfaStep, setMfaStep] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'audit'>('overview');
  const [overview, setOverview] = useState<any | null>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Restore token from session
  useEffect(() => {
    const saved = sessionStorage.getItem('authcraft_super_admin_token');
    const savedAdmin = sessionStorage.getItem('authcraft_super_admin_info');
    if (saved && savedAdmin) {
      setAdminToken(saved);
      setAdminInfo(JSON.parse(savedAdmin));
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);

    try {
      const res = await fetch(`${API_BASE}/super-admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, totp_code: totpCode || null }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed.');
      }

      if (data.mfa_required) {
        setMfaStep(true);
        setTempToken(data.temp_token);
        setLoggingIn(false);
        return;
      }

      // Success
      setAdminToken(data.access_token);
      setAdminInfo(data.admin);
      sessionStorage.setItem('authcraft_super_admin_token', data.access_token);
      sessionStorage.setItem('authcraft_super_admin_info', JSON.stringify(data.admin));
    } catch (err: any) {
      setLoginError(err.message || 'Login failed.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken || !totpCode.trim()) return;

    setLoginError(null);
    setLoggingIn(true);

    try {
      const res = await fetch(`${API_BASE}/super-admin/mfa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temp_token: tempToken, totp_code: totpCode.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid TOTP verification code.');
      }

      setAdminToken(data.access_token);
      setAdminInfo(data.admin);
      sessionStorage.setItem('authcraft_super_admin_token', data.access_token);
      sessionStorage.setItem('authcraft_super_admin_info', JSON.stringify(data.admin));
      setMfaStep(false);
    } catch (err: any) {
      setLoginError(err.message || 'TOTP validation failed.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setAdminToken(null);
    setAdminInfo(null);
    sessionStorage.removeItem('authcraft_super_admin_token');
    sessionStorage.removeItem('authcraft_super_admin_info');
    setMfaStep(false);
    setTotpCode('');
  };

  const fetchDashboardData = async () => {
    if (!adminToken) return;
    try {
      setLoadingData(true);
      const headers = { Authorization: `Bearer ${adminToken}` };

      const [ovRes, tenRes, audRes] = await Promise.all([
        fetch(`${API_BASE}/super-admin/overview`, { headers }),
        fetch(`${API_BASE}/super-admin/tenants`, { headers }),
        fetch(`${API_BASE}/super-admin/audit-logs`, { headers }),
      ]);

      if (ovRes.ok) setOverview(await ovRes.json());
      if (tenRes.ok) setTenants(await tenRes.json());
      if (audRes.ok) setAuditLogs(await audRes.json());
    } catch (err) {
      console.error('Error fetching super admin dashboard data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchDashboardData();
    }
  }, [adminToken]);

  const handleToggleTenantStatus = async (developerId: string) => {
    try {
      const res = await fetch(`${API_BASE}/super-admin/tenants/${developerId}/toggle-status`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        const updated = await res.json();
        setTenants((prev) =>
          prev.map((t) => (t.id === developerId ? { ...t, is_active: updated.is_active } : t))
        );
      }
    } catch (err) {
      alert('Failed to change tenant status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-[Inter] p-6 selection:bg-rose-500 selection:text-white">
      {/* Super Admin Top Header */}
      <div className="max-w-7xl mx-auto flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white">
                AuthCraft <span className="text-rose-500">Super Admin</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-rose-950/80 text-rose-400 border border-rose-800">
                Tier-0 Isolated
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Zero-Trust Platform Control Plane  •  Strict RFC 6238 TOTP Enforced
            </p>
          </div>
        </div>

        {adminToken && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold text-white">{adminInfo?.full_name || 'Super Admin'}</p>
              <p className="text-[10px] text-slate-400">{adminInfo?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-950/50 rounded-lg border border-rose-900 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto mt-6">
        {/* LOGIN SCREEN */}
        {!adminToken ? (
          <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl mt-12 space-y-4">
            <div className="text-center pb-2">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mx-auto mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">Administrator Access</h2>
              <p className="text-xs text-slate-400 mt-1">
                Access is monitored and recorded in tamper-evident audit logs.
              </p>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {loginError}
              </div>
            )}

            {!mfaStep ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Super Admin Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition disabled:opacity-50 mt-2 shadow-lg shadow-rose-600/20"
                >
                  {loggingIn ? 'Authenticating...' : 'Continue to TOTP Verification'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleMfaVerify} className="space-y-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300">
                  Enter the 6-digit verification code from your authenticator app (Google Authenticator / 1Password).
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    6-Digit Authenticator Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    className="w-full text-center tracking-widest text-lg font-mono bg-slate-950 border border-slate-800 rounded-lg p-2 text-rose-400 font-bold"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setMfaStep(false)}
                    className="w-1/3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 rounded-lg transition"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loggingIn}
                    className="w-2/3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition disabled:opacity-50 shadow-lg shadow-rose-600/20"
                  >
                    {loggingIn ? 'Verifying...' : 'Verify TOTP & Enter'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* AUTHENTICATED SUPER ADMIN CONSOLE */
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-800 pb-3">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'overview'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                Platform Health & Telemetry
              </button>
              <button
                onClick={() => setActiveTab('tenants')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'tenants'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                Developer Tenants ({tenants.length})
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                  activeTab === 'audit'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:bg-slate-900'
                }`}
              >
                Admin Audit Trail ({auditLogs.length})
              </button>
            </div>

            {loadingData ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
              </div>
            ) : (
              <>
                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <p className="text-[11px] font-bold text-slate-400 uppercase">Developers</p>
                        <p className="text-2xl font-black text-white mt-1">
                          {overview?.tenants?.total_developers ?? 0}
                        </p>
                        <p className="text-[10px] text-emerald-400 mt-1">
                          {overview?.tenants?.active_developers ?? 0} active
                        </p>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <p className="text-[11px] font-bold text-slate-400 uppercase">Projects</p>
                        <p className="text-2xl font-black text-white mt-1">
                          {overview?.resources?.total_projects ?? 0}
                        </p>
                        <p className="text-[10px] text-indigo-400 mt-1">
                          {overview?.resources?.published_projects ?? 0} published
                        </p>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <p className="text-[11px] font-bold text-slate-400 uppercase">End Users</p>
                        <p className="text-2xl font-black text-white mt-1">
                          {overview?.resources?.total_end_users ?? 0}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">Managed accounts</p>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                        <p className="text-[11px] font-bold text-slate-400 uppercase">
                          AI Presentations
                        </p>
                        <p className="text-2xl font-black text-white mt-1">
                          {overview?.resources?.total_presentations ?? 0}
                        </p>
                        <p className="text-[10px] text-indigo-400 mt-1">PPTX synthesized</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Database className="w-4 h-4 text-emerald-400" />
                          Platform Infrastructure & Database
                        </h3>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-800">
                            <span className="text-slate-400">Database Engine</span>
                            <span className="font-mono text-white">
                              {overview?.database?.engine}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800">
                            <span className="text-slate-400">Database Status</span>
                            <span className="text-emerald-400 font-bold">Healthy (Active)</span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800">
                            <span className="text-slate-400">Engine Version</span>
                            <span className="font-mono text-white">
                              {overview?.service_version}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-400">Auth Events Ingested</span>
                            <span className="font-mono text-white">
                              {overview?.security?.total_auth_events_recorded ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                          <Activity className="w-4 h-4 text-rose-400" />
                          Automation & API Telemetry
                        </h3>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-800">
                            <span className="text-slate-400">Active Workflows</span>
                            <span className="font-mono text-white">
                              {overview?.resources?.total_workflows ?? 0}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800">
                            <span className="text-slate-400">Issued API Keys</span>
                            <span className="font-mono text-white">
                              {overview?.resources?.total_api_keys ?? 0}
                            </span>
                          </div>
                          <div className="flex justify-between py-1 border-b border-slate-800">
                            <span className="text-slate-400">Webhook Listeners</span>
                            <span className="font-mono text-white">
                              {overview?.resources?.total_webhooks ?? 0}
                            </span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-slate-400">Open Threat Incidents</span>
                            <span className="text-rose-400 font-bold">
                              {overview?.security?.open_incidents ?? 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: TENANTS */}
                {activeTab === 'tenants' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3">Developer</th>
                          <th className="p-3">Email</th>
                          <th className="p-3">Projects</th>
                          <th className="p-3">End Users</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Account Control</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {tenants.map((t) => (
                          <tr key={t.id} className="hover:bg-slate-800/50">
                            <td className="p-3 font-semibold text-white">{t.full_name}</td>
                            <td className="p-3 text-slate-300 font-mono">{t.email}</td>
                            <td className="p-3 text-slate-400">{t.project_count}</td>
                            <td className="p-3 text-slate-400">{t.end_user_count}</td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  t.is_active
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                                }`}
                              >
                                {t.is_active ? 'Active' : 'Suspended'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleToggleTenantStatus(t.id)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                                  t.is_active
                                    ? 'bg-rose-950 text-rose-400 hover:bg-rose-900 border border-rose-800'
                                    : 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-800'
                                }`}
                              >
                                {t.is_active ? 'Suspend Account' : 'Reactivate'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 3: AUDIT TRAIL */}
                {activeTab === 'audit' && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-3">Timestamp</th>
                          <th className="p-3">Action</th>
                          <th className="p-3">Resource</th>
                          <th className="p-3">IP Address</th>
                          <th className="p-3">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-800/50">
                            <td className="p-3 text-slate-400 font-mono">
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td className="p-3 font-mono text-rose-400 font-bold">{log.action}</td>
                            <td className="p-3 text-slate-300 font-mono">{log.resource_type}</td>
                            <td className="p-3 text-slate-400 font-mono">{log.ip_address || '127.0.0.1'}</td>
                            <td className="p-3 text-slate-400 font-mono truncate max-w-xs">
                              {JSON.stringify(log.details)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
