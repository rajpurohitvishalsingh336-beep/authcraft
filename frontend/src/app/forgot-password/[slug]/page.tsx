'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { PublicProjectConfig } from '@/lib/types';
import { getLayoutById } from '@/lib/layouts/catalog';
import { UniversalLayoutRenderer } from '@/lib/layouts/renderer';

function HostedForgotPasswordForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [projectConfig, setProjectConfig] = useState<PublicProjectConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [slug]);

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const layout = getLayoutById(projectConfig.layout_id || 'minimal-clean-01');

  return (
    <UniversalLayoutRenderer
      layout={layout}
      config={projectConfig}
      mode="forgot"
      email={email}
      setEmail={setEmail}
      submitting={submitting}
      handleSubmit={handleSubmit}
      authError={error}
      authSuccess={
        submitted
          ? {
              user: { email },
            }
          : null
      }
      isBuilderPreview={false}
      onSwitchMode={(targetMode) => {
        if (targetMode === 'login') {
          router.push(`/login/${slug}`);
        } else if (targetMode === 'register') {
          router.push(`/register/${slug}`);
        }
      }}
    />
  );
}

export default function HostedForgotPasswordPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      }
    >
      <HostedForgotPasswordForm slug={params.slug} />
    </Suspense>
  );
}
