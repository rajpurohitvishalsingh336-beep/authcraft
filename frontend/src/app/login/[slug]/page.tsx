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
import { getLayoutById } from '@/lib/layouts/catalog';
import { UniversalLayoutRenderer } from '@/lib/layouts/renderer';

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

  // OTP Login state
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpStep, setOtpStep] = useState<'email' | 'code'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  // 2-Step Verification state
  const [twoStepRequired, setTwoStepRequired] = useState(false);
  const [twoStepTempToken, setTwoStepTempToken] = useState<string | null>(null);
  const [twoStepCode, setTwoStepCode] = useState('');
  const [twoStepDevOtp, setTwoStepDevOtp] = useState<string | null>(null);
  const [twoStepCountdown, setTwoStepCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (twoStepCountdown > 0) {
      timer = setTimeout(() => setTwoStepCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [twoStepCountdown]);

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

  const handleSendOtp = async () => {
    if (!projectConfig || !projectConfig.project_id) return;
    if (!email.trim()) {
      setAuthError('Please enter your email address to receive an OTP code.');
      return;
    }

    setAuthError(null);
    setSubmitting(true);

    try {
      const data = await apiRequest(
        `/projects/${projectConfig.project_id}/auth/otp/send`,
        {
          method: 'POST',
          body: JSON.stringify({
            email: email.trim(),
            redirect_uri: redirectUri || null,
          }),
        }
      );
      if (data.dev_otp) {
        setDevOtp(data.dev_otp);
      }
      setOtpStep('code');
    } catch (err: any) {
      setAuthError(err.message || 'Failed to send OTP code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectConfig || !projectConfig.project_id) return;

    setAuthError(null);
    setSubmitting(true);

    try {
      let res;
      if (isOtpMode) {
        if (otpCode.length !== 6) {
          setAuthError('Please enter the 6-digit OTP code.');
          setSubmitting(false);
          return;
        }
        res = await apiRequest(
          `/projects/${projectConfig.project_id}/auth/otp/verify`,
          {
            method: 'POST',
            body: JSON.stringify({
              email: email.trim(),
              otp: otpCode.trim(),
              redirect_uri: redirectUri || null,
            }),
          }
        );
      } else {
        res = await apiRequest(
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
      }

      // Check if Email 2-Step Verification is required
      if (res.two_step_required) {
        setTwoStepRequired(true);
        setTwoStepTempToken(res.temp_token);
        setTwoStepDevOtp(res.dev_otp || null);
        setTwoStepCountdown(60);
        return;
      }

      // Check if redirect URI is authorized
      if (res.redirect_uri) {
        const targetUrl = new URL(res.redirect_uri);
        targetUrl.hash = `session_token=${res.session_token}`;
        window.location.href = targetUrl.toString();
        return;
      }

      setAuthSuccess(res);
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify2Step = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!projectConfig?.project_id || !twoStepTempToken) return;
    if (twoStepCode.length !== 6) {
      setAuthError('Please enter the complete 6-digit verification code.');
      return;
    }

    setAuthError(null);
    setSubmitting(true);

    try {
      const res = await apiRequest(
        `/projects/${projectConfig.project_id}/auth/login/2step/verify`,
        {
          method: 'POST',
          body: JSON.stringify({
            temp_token: twoStepTempToken,
            otp: twoStepCode.trim(),
            redirect_uri: redirectUri || null,
          }),
        }
      );

      if (res.redirect_uri) {
        const targetUrl = new URL(res.redirect_uri);
        targetUrl.hash = `session_token=${res.session_token}`;
        window.location.href = targetUrl.toString();
        return;
      }

      setAuthSuccess(res);
      setTwoStepRequired(false);
    } catch (err: any) {
      setAuthError(err.message || 'Invalid or expired 2-step verification code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend2Step = async () => {
    if (!projectConfig?.project_id || !twoStepTempToken || twoStepCountdown > 0) return;

    setAuthError(null);
    setSubmitting(true);

    try {
      const data = await apiRequest(
        `/projects/${projectConfig.project_id}/auth/login/2step/resend`,
        {
          method: 'POST',
          body: JSON.stringify({ temp_token: twoStepTempToken }),
        }
      );
      if (data.dev_otp) {
        setTwoStepDevOtp(data.dev_otp);
      }
      setTwoStepCountdown(60);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to resend code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel2Step = () => {
    setTwoStepRequired(false);
    setTwoStepCode('');
    setAuthError(null);
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-[Inter]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading secure login portal...</p>
        </div>
      </div>
    );
  }

  // Safe fallback if project does not exist
  if (configError) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-[Inter]">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-white">Application Unavailable</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {configError}
          </p>
          <div className="mt-6 pt-4 border-t border-slate-800">
            <Link href="/" className="text-xs font-semibold text-indigo-400 hover:underline">
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-[Inter]">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-white">Application Deactivated</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {projectConfig.message || 'This application project is currently disabled by its administrator.'}
          </p>
        </div>
      </div>
    );
  }

  // Safe fallback if project is unpublished
  if (projectConfig?.status === 'unpublished') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-[Inter]">
        <div className="max-w-md w-full bg-slate-900 rounded-2xl p-8 border border-slate-800 shadow-2xl text-center">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-white">{projectConfig.project_name || 'Application'}</h1>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            {projectConfig.message || 'This project\'s authentication page has not been published yet. The project developer can publish it anytime from the AuthCraft Visual Builder.'}
          </p>
        </div>
      </div>
    );
  }

  if (!projectConfig) return null;

  // Resolve layout definition from catalog
  const layout = getLayoutById(projectConfig.layout_id || 'minimal-clean-01');

  return (
    <UniversalLayoutRenderer
      layout={layout}
      config={projectConfig}
      mode="login"
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      submitting={submitting}
      handleSubmit={handleSubmit}
      authError={authError}
      authSuccess={authSuccess}
      redirectUri={redirectUri}
      isBuilderPreview={false}
      isOtpMode={isOtpMode}
      setIsOtpMode={setIsOtpMode}
      otpStep={otpStep}
      setOtpStep={setOtpStep}
      otpCode={otpCode}
      setOtpCode={setOtpCode}
      onSendOtp={handleSendOtp}
      devOtp={devOtp}
      twoStepRequired={twoStepRequired}
      twoStepCode={twoStepCode}
      setTwoStepCode={setTwoStepCode}
      onVerify2Step={handleVerify2Step}
      onResend2Step={handleResend2Step}
      onCancel2Step={handleCancel2Step}
      twoStepDevOtp={twoStepDevOtp}
      twoStepCountdown={twoStepCountdown}
      onSwitchMode={(targetMode) => {
        if (targetMode === 'register') {
          router.push(
            `/register/${slug}${redirectUri ? `?redirect_uri=${encodeURIComponent(redirectUri)}` : ''}`
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

export default function HostedLoginPage({ params }: { params: { slug: string } }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      }
    >
      <HostedLoginForm slug={params.slug} />
    </Suspense>
  );
}
