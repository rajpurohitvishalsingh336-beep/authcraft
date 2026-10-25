'use client';

import React, { useState, useEffect } from 'react';
import {
  Key,
  Webhook,
  Code2,
  Plus,
  Trash2,
  Copy,
  Check,
  Send,
  ShieldCheck,
  Clock,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useDashboard } from '../layout';

interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  created_at: string;
  last_used_at?: string;
}

interface WebhookItem {
  id: string;
  target_url: string;
  events: string[];
  is_active: boolean;
  delivery_count: number;
  created_at: string;
}

export default function DeveloperPlatformPage() {
  const { activeProject } = useDashboard();
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks' | 'sdk'>('keys');
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Key creation state
  const [newKeyName, setNewKeyName] = useState('');
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [createdKeySecret, setCreatedKeySecret] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Webhook creation state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookModalOpen, setWebhookModalOpen] = useState(false);
  const [createdWebhookSecret, setCreatedWebhookSecret] = useState<string | null>(null);
  const [copiedWebhookSecret, setCopiedWebhookSecret] = useState(false);

  // Webhook testing state
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any | null>(null);

  const fetchPlatformData = async () => {
    try {
      setLoading(true);
      const [keysData, webhooksData] = await Promise.all([
        apiRequest<ApiKeyItem[]>('/developer/keys'),
        apiRequest<WebhookItem[]>('/developer/webhooks'),
      ]);
      setKeys(keysData);
      setWebhooks(webhooksData);
    } catch (err) {
      console.error('Failed to load developer platform assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const res = await apiRequest<any>('/developer/keys', {
        method: 'POST',
        body: JSON.stringify({
          name: newKeyName.trim(),
          scopes: 'auth:read,auth:write',
          project_id: activeProject?.id || null,
        }),
      });

      setKeys((prev) => [res, ...prev]);
      setCreatedKeySecret(res.raw_secret);
      setNewKeyName('');
    } catch (err: any) {
      alert(err.message || 'Failed to issue API key.');
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Are you sure you want to permanently revoke this API key?')) return;
    try {
      await apiRequest(`/developer/keys/${id}`, { method: 'DELETE' });
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to revoke key.');
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim()) return;

    try {
      const res = await apiRequest<any>('/developer/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          target_url: webhookUrl.trim(),
          events: 'user.login,user.register,security.alert',
          project_id: activeProject?.id || null,
        }),
      });

      setWebhooks((prev) => [res, ...prev]);
      setCreatedWebhookSecret(res.signing_secret);
      setWebhookUrl('');
    } catch (err: any) {
      alert(err.message || 'Failed to register webhook.');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook listener?')) return;
    try {
      await apiRequest(`/developer/webhooks/${id}`, { method: 'DELETE' });
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
      if (testResult?.webhook_id === id) setTestResult(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete webhook.');
    }
  };

  const handleTestWebhook = async (id: string) => {
    try {
      setTestingWebhookId(id);
      const res = await apiRequest<any>(`/developer/webhooks/${id}/test`, { method: 'POST' });
      setTestResult({ webhook_id: id, ...res });
    } catch (err: any) {
      alert(err.message || 'Webhook delivery test failed.');
    } finally {
      setTestingWebhookId(null);
    }
  };

  const copySecret = (text: string, type: 'key' | 'webhook') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedWebhookSecret(true);
      setTimeout(() => setCopiedWebhookSecret(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-6 h-6 text-indigo-500" />
              Developer Platform & API Management
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              SHA-256 Hashed at Rest
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Programmatic access tokens, HMAC-SHA256 signed event webhooks, and SDK quickstart guides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'keys' && (
            <button
              onClick={() => {
                setCreatedKeySecret(null);
                setKeyModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Generate API Key
            </button>
          )}

          {activeTab === 'webhooks' && (
            <button
              onClick={() => {
                setCreatedWebhookSecret(null);
                setWebhookModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Register Webhook
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('keys')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'keys'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          API Keys ({keys.length})
        </button>
        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'webhooks'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Webhook className="w-3.5 h-3.5" />
          Webhooks ({webhooks.length})
        </button>
        <button
          onClick={() => setActiveTab('sdk')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition ${
            activeTab === 'sdk'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          SDK Quickstart
        </button>
      </div>

      {/* TAB 1: API KEYS */}
      {activeTab === 'keys' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
          ) : keys.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No API keys generated. Create one to authenticate backend microservices.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">Key Name</th>
                    <th className="p-3">Key Prefix</th>
                    <th className="p-3">Granular Scopes</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {keys.map((k) => (
                    <tr key={k.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{k.name}</td>
                      <td className="p-3 font-mono text-indigo-500 font-bold">{k.key_prefix}</td>
                      <td className="p-3">
                        <div className="flex gap-1 flex-wrap">
                          {k.scopes.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <Check className="w-3.5 h-3.5" />
                          Active
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">
                        {new Date(k.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleRevokeKey(k.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
                          title="Revoke key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WEBHOOKS */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : webhooks.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No webhook endpoints configured. Register a listener URL to receive HMAC-signed security and login events.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Target URL</th>
                      <th className="p-3">Subscribed Events</th>
                      <th className="p-3">Deliveries</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {webhooks.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-indigo-500 font-semibold truncate max-w-xs">
                          {w.target_url}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1 flex-wrap">
                            {w.events.map((e, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300"
                              >
                                {e}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-slate-500">{w.delivery_count}</td>
                        <td className="p-3">
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <Check className="w-3.5 h-3.5" />
                            Listening
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleTestWebhook(w.id)}
                              disabled={testingWebhookId === w.id}
                              className="px-2.5 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md transition"
                            >
                              {testingWebhookId === w.id ? 'Pinging...' : 'Send Test Ping'}
                            </button>
                            <button
                              onClick={() => handleDeleteWebhook(w.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
                              title="Delete webhook"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Test Delivery Result Box */}
          {testResult && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  Test Delivery Dispatched Successfully
                </span>
                <span className="text-xs font-mono text-slate-500">
                  HTTP {testResult.http_status} ({testResult.duration_ms}ms)
                </span>
              </div>
              <div className="bg-slate-950 rounded-lg p-3 text-[11px] font-mono text-slate-300 overflow-x-auto space-y-1">
                <p className="text-indigo-400">// Header: X-AuthCraft-Signature</p>
                <p>{testResult.hmac_signature_header}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SDK QUICKSTART */}
      {activeTab === 'sdk' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-indigo-500" />
              Server-Side Node.js / TypeScript
            </h3>
            <pre className="bg-slate-950 text-slate-200 p-3.5 rounded-lg text-xs font-mono overflow-x-auto">
{`import { AuthCraftClient } from '@authcraft/sdk';

const authcraft = new AuthCraftClient({
  apiKey: process.env.AUTHCRAFT_API_KEY,
  projectId: '${activeProject?.id || 'prj_demo'}'
});

// Verify end-user session token
const session = await authcraft.verifySession(token);`}
            </pre>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-500" />
              Python (FastAPI / Django)
            </h3>
            <pre className="bg-slate-950 text-slate-200 p-3.5 rounded-lg text-xs font-mono overflow-x-auto">
{`import requests

def verify_authcraft_token(token: str):
    headers = {"Authorization": f"Bearer {API_KEY}"}
    res = requests.post(
        "https://authcraft.vercel.app/api/v1/projects/${activeProject?.id || 'prj_demo'}/auth/verify",
        json={"session_token": token},
        headers=headers
    )
    return res.json()`}
            </pre>
          </div>
        </div>
      )}

      {/* Key Creation Modal */}
      {keyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-500" />
              Issue Scoped Production API Key
            </h3>

            {!createdKeySecret ? (
              <form onSubmit={handleCreateKey} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Key Identifier / Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Billing Service Backend"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setKeyModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                  >
                    Generate Secret
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200">
                  ⚠️ <strong>Save this key now.</strong> You will not be able to view it again. We only store its SHA-256 hash.
                </div>

                <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400">
                  <span className="truncate flex-1">{createdKeySecret}</span>
                  <button
                    onClick={() => copySecret(createdKeySecret, 'key')}
                    className="p-1 hover:bg-slate-800 rounded transition text-white"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setKeyModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Webhook Creation Modal */}
      {webhookModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Webhook className="w-5 h-5 text-indigo-500" />
              Register Webhook Endpoint
            </h3>

            {!createdWebhookSecret ? (
              <form onSubmit={handleCreateWebhook} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Target HTTPS Endpoint URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://api.mycorp.com/authcraft/webhook"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setWebhookModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
                  >
                    Register Listener
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs text-indigo-800 dark:text-indigo-200">
                  🔐 <strong>Webhook HMAC Secret:</strong> Use this secret to verify signatures in the <code>X-AuthCraft-Signature</code> header.
                </div>

                <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-indigo-400">
                  <span className="truncate flex-1">{createdWebhookSecret}</span>
                  <button
                    onClick={() => copySecret(createdWebhookSecret, 'webhook')}
                    className="p-1 hover:bg-slate-800 rounded transition text-white"
                  >
                    {copiedWebhookSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setWebhookModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
