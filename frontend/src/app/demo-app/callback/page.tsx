'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, ArrowRight, User, Key, Loader2 } from 'lucide-react';

export default function DemoAppCallbackPage() {
  const [token, setToken] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Extract token from URL hash fragment #session_token=...
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const sessionToken = params.get('session_token');

      if (sessionToken) {
        setToken(sessionToken);

        // Parse claims or display token
        try {
          const payloadBase64 = sessionToken.split('.')[1];
          const decoded = JSON.parse(atob(payloadBase64));
          setUserProfile(decoded);
        } catch {
          // ignore
        }
      }
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-[Inter]">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Application Callback</h1>
            <p className="text-xs text-emerald-400 font-medium">Authentication Successful</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-6">
          AuthCraft has verified the user credentials and safely redirected back to your application with a signed session token.
        </p>

        {loading ? (
          <div className="p-4 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
          </div>
        ) : token ? (
          <div className="space-y-4">
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs font-mono">
              <span className="text-slate-500 block mb-1 font-sans text-[10px] uppercase font-bold">
                Received Session Token:
              </span>
              <p className="text-indigo-400 truncate">{token}</p>
            </div>

            {userProfile && (
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 text-xs space-y-1.5 font-mono">
                <span className="text-slate-500 block mb-1 font-sans text-[10px] uppercase font-bold">
                  Decoded Token Claims:
                </span>
                <p><span className="text-slate-500">User ID:</span> {userProfile.sub}</p>
                <p><span className="text-slate-500">Project:</span> {userProfile.project_id || '—'}</p>
                <p><span className="text-slate-500">Type:</span> {userProfile.type}</p>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/dashboard"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20"
              >
                Return to AuthCraft Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-950 rounded-xl text-center text-xs text-slate-400">
            No session token found in URL hash.
          </div>
        )}
      </div>
    </div>
  );
}
