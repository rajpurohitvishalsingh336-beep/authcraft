'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { PublicProjectConfig } from '@/lib/types';

function HostedResetPasswordForm({ slug }: { slug: string }) {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token') || '';

  const [projectConfig, setProjectConfig] = useState<PublicProjectConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [token, setToken] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tokenParam) setToken(tokenParam);

    const fetchConfig = async () => {
      try {
        const data = await apiRequest<PublicProjectConfig>(`/public/projects/${slug}/config`);
        setProjectConfig(data);
      } catch (err: any) {
        setError('Application not found.');
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, [slug, tokenParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectConfig?.project_id) return;

    setError(null);
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest(`/projects/${projectConfig.project_id}/auth/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired password reset token.');
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
          <h1 className="text-xl font-bold tracking-tight">Create New Password</h1>
          <p className="text-xs opacity-75 mt-1">{projectConfig.brand_name}</p>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs leading-relaxed opacity-85">
              Your password has been successfully reset.
            </p>
            <div className="pt-2">
              <Link
                href={`/login/${slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg shadow"
                style={{ backgroundColor: projectConfig.primary_color }}
              >
                Sign In Now <ArrowRight className="w-3.5 h-3.5" />
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
              <label className="block text-xs font-semibold mb-1 opacity-80">Reset Token</label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste reset token"
                className="w-full text-xs font-mono px-3.5 py-2.5 border border-slate-300 bg-transparent text-slate-900 focus:outline-none focus:ring-2"
                style={{ borderRadius: `${projectConfig.border_radius}px` }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 opacity-80">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 bg-transparent text-slate-900 focus:outline-none focus:ring-2"
                style={{ borderRadius: `${projectConfig.border_radius}px` }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 opacity-80">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 bg-transparent text-slate-900 focus:outline-none focus:ring-2"
                style={{ borderRadius: `${projectConfig.border_radius}px` }}
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
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Set New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function HostedResetPasswordPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>}>
      <HostedResetPasswordForm slug={params.slug} />
    </Suspense>
  );
}
