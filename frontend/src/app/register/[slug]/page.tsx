'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { PublicProjectConfig } from '@/lib/types';

function HostedRegisterForm({ slug }: { slug: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUri = searchParams.get('redirect_uri') || '';

  const [projectConfig, setProjectConfig] = useState<PublicProjectConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

    const minLen = projectConfig.password_min_length || 8;
    if (password.length < minLen) {
      setAuthError(`Password must be at least ${minLen} characters long.`);
      return;
    }

    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await apiRequest(
        `/projects/${projectConfig.project_id}/auth/register`,
        {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
            display_name: displayName.trim() || null,
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
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-[Inter]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading registration page...</p>
        </div>
      </div>
    );
  }

  if (configError || !projectConfig || projectConfig.status !== 'ready') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-[Inter]">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Application Unavailable</h1>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            {configError || projectConfig?.message || 'This application is not available for registration.'}
          </p>
        </div>
      </div>
    );
  }

  if (!projectConfig.allow_registration) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-[Inter]">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-xl text-center">
          <h1 className="text-lg font-bold text-slate-900">Registration Disabled</h1>
          <p className="text-xs text-slate-600 mt-2">
            New account registration is currently disabled for this application.
          </p>
          <div className="mt-6">
            <Link
              href={`/login/${slug}`}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              Return to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            <h2 className="text-xl font-bold">Registration Complete!</h2>
            <p className="text-xs opacity-75 leading-relaxed">
              {projectConfig.require_email_verification
                ? 'Please check your email to verify your address before continuing.'
                : 'Your account has been created successfully with Argon2id password encryption.'}
            </p>

            <div className="pt-4">
              <Link
                href={`/login/${slug}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white rounded-lg shadow"
                style={{ backgroundColor: projectConfig.primary_color }}
              >
                Proceed to Sign In <ArrowRight className="w-3.5 h-3.5" />
              </Link>
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
              <p className="text-xs opacity-75 mt-1">{projectConfig.register_text}</p>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">Full Name</label>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 bg-transparent text-slate-900 focus:outline-none focus:ring-2"
                  style={{
                    borderRadius: `${projectConfig.border_radius}px`,
                    color: projectConfig.text_color,
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">{projectConfig.email_label}</label>
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
                <label className="block text-xs font-semibold mb-1 opacity-80">
                  {projectConfig.password_label} (min {projectConfig.password_min_length || 8} chars)
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 bg-transparent text-slate-900 focus:outline-none focus:ring-2"
                  style={{
                    borderRadius: `${projectConfig.border_radius}px`,
                    color: projectConfig.text_color,
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 opacity-80">Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                className="w-full mt-2 py-2.5 text-xs font-bold text-white shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
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
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating Account...
                  </>
                ) : (
                  <>
                    Create Account <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-xs opacity-75">
              Already have an account?{' '}
              <Link
                href={`/login/${slug}${redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : ''}`}
                className="font-bold hover:underline"
                style={{ color: projectConfig.primary_color }}
              >
                Sign in
              </Link>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-200/40 text-center text-[10px] opacity-60">
              {projectConfig.footer_text}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HostedRegisterPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>}>
      <HostedRegisterForm slug={params.slug} />
    </Suspense>
  );
}
