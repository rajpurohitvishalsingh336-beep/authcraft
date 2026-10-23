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
import { getLayoutById } from '@/lib/layouts/catalog';
import { UniversalLayoutRenderer } from '@/lib/layouts/renderer';

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

    const minLen = projectConfig.password_min_length || 8;
    if (password.length < minLen) {
      setAuthError(`Password must be at least ${minLen} characters long.`);
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-[Inter]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading registration page...</p>
        </div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-[Inter]">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-white">Application Unavailable</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{configError}</p>
        </div>
      </div>
    );
  }

  if (!projectConfig?.allow_registration) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-[Inter]">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-white">Registration Closed</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            Public registration is currently disabled for this application. Please sign in if you already have an account.
          </p>
          <div className="mt-6">
            <Link
              href={`/login/${slug}${redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : ''}`}
              className="text-xs font-bold text-indigo-400 hover:underline"
            >
              Go to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const layout = getLayoutById(projectConfig.layout_id || 'minimal-clean-01');

  return (
    <UniversalLayoutRenderer
      layout={layout}
      config={projectConfig}
      mode="register"
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      displayName={displayName}
      setDisplayName={setDisplayName}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      submitting={submitting}
      handleSubmit={handleSubmit}
      authError={authError}
      authSuccess={authSuccess}
      redirectUri={redirectUri}
      isBuilderPreview={false}
      onSwitchMode={(targetMode) => {
        if (targetMode === 'login') {
          router.push(
            `/login/${slug}${redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : ''}`
          );
        } else if (targetMode === 'forgot') {
          router.push(
            `/forgot-password/${slug}${redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : ''}`
          );
        }
      }}
    />
  );
}

export default function HostedRegisterPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      }
    >
      <HostedRegisterForm slug={params.slug} />
    </Suspense>
  );
}
