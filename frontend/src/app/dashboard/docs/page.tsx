'use client';

import React, { useState } from 'react';
import { BookOpen, Copy, Check, Code2, Globe, ArrowRight } from 'lucide-react';
import { useDashboard } from '../layout';

export default function IntegrationDocsPage() {
  const { activeProject } = useDashboard();
  const [activeTab, setActiveTab] = useState<'hosted' | 'js' | 'python' | 'curl'>('hosted');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const hostedUrl = activeProject?.hosted_login_url || 'http://localhost:3000/login/your-project-slug';
  const projectId = activeProject?.id || 'prj_example123';

  const snippets = {
    hosted: `<!-- 1. Zero-Code Hosted Login Link -->
<!-- Link your application users directly to your AuthCraft hosted URL -->
<!-- Optionally pass a redirect_uri that you have authorized in Project Settings -->

<a href="${hostedUrl}?redirect_uri=https://myapp.com/callback">
  Sign In with AuthCraft
</a>

<!-- When users complete authentication, AuthCraft will safely redirect them to: -->
<!-- https://myapp.com/callback#session_token=JWT_TOKEN_HERE -->`,

    js: `// 2. Client-Side JavaScript / Web Integration
// When user returns from the hosted page, capture token and fetch profile:

const hashParams = new URLSearchParams(window.location.hash.substring(1));
const sessionToken = hashParams.get('session_token');

if (sessionToken) {
  // Store session in memory or secure storage
  sessionStorage.setItem('app_session', sessionToken);

  // Retrieve authenticated user profile:
  fetch('http://localhost:8000/api/v1/projects/${projectId}/auth/me', {
    headers: {
      'Authorization': 'Bearer ' + sessionToken
    }
  })
  .then(res => res.json())
  .then(user => {
    console.log('Successfully authenticated user:', user.email);
  });
}`,

    python: `# 3. Python Backend Token Verification
# In your FastAPI, Flask, or Django backend, verify the user's session:

import httpx

AUTHCRAFT_API = "http://localhost:8000/api/v1"
PROJECT_ID = "${projectId}"

def verify_user_session(session_token: str):
    """Verify session token against AuthCraft project API."""
    headers = {"Authorization": f"Bearer {session_token}"}
    response = httpx.get(
        f"{AUTHCRAFT_API}/projects/{PROJECT_ID}/auth/me",
        headers=headers,
        timeout=5.0
    )
    if response.status_code == 200:
        return response.json()  # Returns: {"id": "...", "email": "...", "display_name": "..."}
    return None`,

    curl: `# 4. Direct cURL Authentication API
# End-User Login:
curl -X POST http://localhost:8000/api/v1/projects/${projectId}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "UserPassword123!"
  }'

# Retrieve User Profile:
curl -X GET http://localhost:8000/api/v1/projects/${projectId}/auth/me \\
  -H "Authorization: Bearer <SESSION_TOKEN>"`
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-[Inter]">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Integration & API Documentation</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Guides and code samples for integrating <span className="font-semibold text-slate-900">{activeProject?.name || 'your application'}</span>.
        </p>
      </div>

      {/* Guide Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2">
          {[
            { id: 'hosted', label: '1. Hosted Login Link (Recommended)' },
            { id: 'js', label: '2. JavaScript / Browser' },
            { id: 'python', label: '3. Python Backend' },
            { id: 'curl', label: '4. cURL / REST API' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Code Implementation
            </span>
            <button
              onClick={() => copyCode(snippets[activeTab])}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              {copiedSnippet ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Copied to Clipboard
                </span>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Code
                </>
              )}
            </button>
          </div>

          <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
            <code>{snippets[activeTab]}</code>
          </pre>
        </div>
      </div>

      {/* Security Best Practices Card */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white text-xs space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" /> Key Security Guidelines
        </h3>
        <ul className="list-disc list-inside space-y-1.5 text-slate-300 leading-relaxed">
          <li><strong>Never treat Project ID as a secret:</strong> The Project ID (<code className="text-indigo-300">{projectId}</code>) identifies the application project routing namespace and is safe to use in frontend links and URLs.</li>
          <li><strong>Validate redirect URIs:</strong> Always register your application&apos;s callback URLs under <a href="/dashboard/settings" className="text-indigo-400 underline">Project Settings &gt; Allowed Redirect URIs</a> to prevent open-redirect attacks.</li>
          <li><strong>Zero-Plaintext Storage:</strong> AuthCraft hashes all passwords using RFC 9106 Argon2id with high memory cost parameters.</li>
        </ul>
      </div>
    </div>
  );
}
