'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { PublicProjectConfig } from '@/lib/types';

function HostedLoginForm({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUri = searchParams.get('redirect_uri') || '';

  const [projectConfig, setProjectConfig] = useState<PublicProjectConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<any | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await apiRequest<PublicProjectConfig>(
          `/public/projects/${slug}/config`
        );
        setProjectConfig(data);
      } catch (err: any) {
        setConfigError(err.message || 'Application not found or unavailable.');
      } finally {
        setLoadingConfig(false);
      }
    };
    fetchConfig();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectConfig || !projectConfig.project_id) return;

    setAuthError(null);
    setSubmitting(true);

    try {
      const res = await apiRequest(
        `/projects/${projectConfig.project_id}/auth/login`,
        {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
            redirect_uri: redirectUri || null,
          }),
        }
      );

      // Check if redirect URI is authorized
      if (res.redirect_uri) {
        const targetUrl = new URL(res.redirect_uri);
        targetUrl.hash = `session_token=${res.session_token}`;
        window.location.href = targetUrl.toString();
        return;
      }

      setAuthSuccess(res);
    } catch (err: any) {
      setAuthError(err.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (!projectConfig?.project_id) return;
    try {
      await apiRequest(`/projects/${projectConfig.project_id}/auth/logout`, {
        method: 'POST',
      });
    } catch {
      // ignore
    } finally {
      setAuthSuccess(null);
      setPassword('');
    }
  };

  if (loadingConfig) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-[Inter]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading secure login page...</p>
        </div>
      </div>
    );
  }

  // Safe fallback if project does not exist
  if (configError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-[Inter]">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Application Unavailable</h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {configError}
          </p>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link href="/" className="text-xs font-semibold text-indigo-600 hover:underline">
              Return to AuthCraft Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Safe fallback if project is disabled
  if (projectConfig?.status === 'disabled') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-[Inter]">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Application Deactivated</h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {projectConfig.message || 'This application project is currently disabled by its administrator.'}
          </p>
        </div>
      </div>
    );
  }

  // Safe fallback if project is unpublished
  if (projectConfig?.status === 'unpublished') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-[Inter]">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">{projectConfig.project_name || 'Application'}</h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {projectConfig.message || 'This project\'s authentication page has not been published yet. The project developer can publish it anytime from the AuthCraft Visual Builder.'}
          </p>
        </div>
      </div>
    );
  }

  if (!projectConfig) return null;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors"
      style={{
        backgroundColor: projectConfig.background_color,
        fontFamily: projectConfig.font_family,
      }}
    >
      <div
        className="w-full max-w-[440px] shadow-2xl p-6 sm:p-8 transition-all"
        style={{
          backgroundColor: projectConfig.card_background_color,
          borderRadius: `${projectConfig.border_radius}px`,
          color: projectConfig.text_color,
        }}
      >
        {authSuccess ? (
          <div className="text-center py-4 space-y-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white mx-auto shadow-md"
              style={{ backgroundColor: projectConfig.primary_color }}
            >
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Successfully Signed In</h2>
              <p className="text-xs opacity-75 mt-1">
                You are authenticated into <span className="font-semibold">{projectConfig.brand_name}</span>.
              </p>
            </div>

            <div className="p-3 bg-black/5 rounded-xl text-left text-xs space-y-1 font-mono">
              <p><span className="opacity-60">User:</span> {authSuccess.user.email}</p>
              <p><span className="opacity-60">Session ID:</span> {authSuccess.session_token.substring(0, 16)}...</p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-lg border border-slate-300 text-xs font-semibold hover:bg-black/5 transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-6">
              {projectConfig.logo_url ? (
                <img
                  src={projectConfig.logo_url}
                  alt={projectConfig.brand_name}
                  className="w-12 h-12 object-contain mx-auto mb-3"
                />
              ) : (
                <div
                  className="w-12 h-12 mx-auto flex items-center justify-center text-white mb-3 shadow-md"
                  style={{
                    backgroundColor: projectConfig.primary_color,
                    borderRadius:
                      projectConfig.button_style === 'pill'
                        ? '9999px'
                        : `${projectConfig.border_radius}px`,
                  }}
                >
                  <Lock className="w-6 h-6" />
                </div>
              )}
              <h1 className="text-xl font-bold tracking-tight">{projectConfig.brand_name}</h1>
              <p className="text-xs opacity-75 mt-1">{projectConfig.welcome_message}</p>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold opacity-80">
                    {projectConfig.password_label}
                  </label>
                  {projectConfig.show_forgot_password && (
                    <Link
                      href={`/forgot-password/${slug}`}
                      className="text-[11px] font-semibold hover:underline"
                      style={{ color: projectConfig.primary_color }}
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 bg-transparent text-slate-900 focus:outline-none focus:ring-2 pr-12"
                    style={{
                      borderRadius: `${projectConfig.border_radius}px`,
                      color: projectConfig.text_color,
                    }}
                  />
                  {projectConfig.show_password_toggle && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[11px] opacity-60 hover:opacity-100 font-medium"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                style={{
                  backgroundColor: projectConfig.primary_color,
                  borderRadius:
                    projectConfig.button_style === 'pill'
                      ? '9999px'
                      : `${projectConfig.border_radius}px`,
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    Sign In <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {projectConfig.show_registration && (
              <div className="mt-6 text-center text-xs opacity-75">
                Don&apos;t have an account?{' '}
                <Link
                  href={`/register/${slug}${redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : ''}`}
                  className="font-bold hover:underline"
                  style={{ color: projectConfig.primary_color }}
                >
                  Create one now
                </Link>
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-slate-200/40 text-center text-[10px] opacity-60">
              {projectConfig.footer_text}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HostedLoginPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>}>
      <HostedLoginForm slug={params.slug} />
    </Suspense>
  );
}
