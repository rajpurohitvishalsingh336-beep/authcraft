'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { PublicProjectConfig } from '@/lib/types';

export default function HostedForgotPasswordPage({ params }: { params: { slug: string } }) {
  const [projectConfig, setProjectConfig] = useState<PublicProjectConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await apiRequest<PublicProjectConfig>(`/public/projects/${params.slug}/config`);
        setProjectConfig(data);
      } catch (err: any) {
        setError('Application not found.');
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, [params.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectConfig?.project_id) return;

    setError(null);
    setSubmitting(true);

    try {
      await apiRequest(`/projects/${projectConfig.project_id}/auth/forgot-password`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingConfig || !projectConfig) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{
        backgroundColor: projectConfig.background_color,
        fontFamily: projectConfig.font_family,
      }}
    >
      <div
        className="w-full max-w-[440px] shadow-2xl p-6 sm:p-8"
        style={{
          backgroundColor: projectConfig.card_background_color,
          borderRadius: `${projectConfig.border_radius}px`,
          color: projectConfig.text_color,
        }}
      >
        <div className="text-center mb-6">
          <div
            className="w-12 h-12 mx-auto flex items-center justify-center text-white mb-3 shadow-md"
            style={{
              backgroundColor: projectConfig.primary_color,
              borderRadius: `${projectConfig.border_radius}px`,
            }}
          >
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Reset Password</h1>
          <p className="text-xs opacity-75 mt-1">{projectConfig.brand_name}</p>
        </div>

        {submitted ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs leading-relaxed opacity-85">
              If an account with that email exists, reset instructions have been dispatched.
            </p>
            <div className="pt-2">
              <Link
                href={`/login/${params.slug}`}
                className="text-xs font-bold hover:underline"
                style={{ color: projectConfig.primary_color }}
              >
                Return to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1 opacity-80">
                {projectConfig.email_label}
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 bg-transparent text-slate-900 focus:outline-none focus:ring-2"
                style={{
                  borderRadius: `${projectConfig.border_radius}px`,
                  color: projectConfig.text_color,
                }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{
                backgroundColor: projectConfig.primary_color,
                borderRadius: `${projectConfig.border_radius}px`,
              }}
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send Reset Link'}
            </button>

            <div className="text-center pt-2">
              <Link
                href={`/login/${params.slug}`}
                className="text-xs opacity-75 hover:opacity-100"
              >
                Cancel and return to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
