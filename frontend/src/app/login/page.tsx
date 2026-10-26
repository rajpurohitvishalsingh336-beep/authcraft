'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  ShieldAlert,
} from 'lucide-react';
import { apiRequest, setStoredToken } from '@/lib/api';

export default function DeveloperLoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [enable2Step, setEnable2Step] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2-Step Verification States (Step 2 of Email + Password)
  const [twoStepRequired, setTwoStepRequired] = useState(false);
  const [twoStepTempToken, setTwoStepTempToken] = useState<string | null>(null);
  const [twoStepEmail, setTwoStepEmail] = useState<string | null>(null);
  const [twoStepCode, setTwoStepCode] = useState('');
  const [twoStepDevOtp, setTwoStepDevOtp] = useState<string | null>(null);
  const [twoStepCountdown, setTwoStepCountdown] = useState(0);

  // Passwordless OTP Login States
  const [otpStep, setOtpStep] = useState<'email' | 'code'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpSentMessage, setOtpSentMessage] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Countdown timer for 1-click OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Countdown timer for 2-Step Verification
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (twoStepCountdown > 0) {
      timer = setTimeout(() => setTwoStepCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [twoStepCountdown]);

  const handleAutofillDemo = () => {
    setEmail('vishal@gmail.com');
    setPassword('Password123!');
    setError(null);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password,
          require_2step: enable2Step,
        }),
      });

      // If 2-Step Verification is required
      if (data.two_step_required) {
        setTwoStepRequired(true);
        setTwoStepTempToken(data.temp_token);
        setTwoStepEmail(data.email || email.trim());
        setTwoStepDevOtp(data.dev_otp || null);
        setTwoStepCountdown(60);
        return;
      }

      if (data.access_token) {
        setStoredToken(data.access_token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2Step = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoStepCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }
    if (!twoStepTempToken) {
      setError('2-Step Verification session expired. Please sign in again.');
      setTwoStepRequired(false);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest('/auth/login/2step/verify', {
        method: 'POST',
        body: JSON.stringify({
          temp_token: twoStepTempToken,
          otp: twoStepCode.trim(),
          email: twoStepEmail,
        }),
      });

      if (data.access_token) {
        setStoredToken(data.access_token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired 2-step verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend2Step = async () => {
    if (!twoStepTempToken || twoStepCountdown > 0) return;

    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest('/auth/login/2step/resend', {
        method: 'POST',
        body: JSON.stringify({
          temp_token: twoStepTempToken,
          email: twoStepEmail,
        }),
      });

      if (data.dev_otp) {
        setTwoStepDevOtp(data.dev_otp);
      }
      setTwoStepCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your developer email.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });

      setOtpSentMessage(data.message || 'Verification code sent to your email.');
      if (data.dev_otp) {
        setDevOtp(data.dev_otp);
      }
      setOtpStep('code');
      setResendCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), otp: otpCode.trim() }),
      });

      if (data.access_token) {
        setStoredToken(data.access_token);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-[Inter]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            Auth<span className="text-indigo-600">Craft</span>
          </span>
        </Link>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {twoStepRequired ? '2-Step Verification' : 'Developer Sign In'}
        </h2>
        <p className="mt-2 text-xs text-slate-600">
          {twoStepRequired
            ? 'Extra security layer: verify your identity with the code sent to your email.'
            : 'Manage your authentication projects, 150 login builders, and user sessions.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-200">
          
          {/* STEP 2: 2-STEP VERIFICATION SCREEN */}
          {twoStepRequired ? (
            <div className="space-y-5">
              <div className="text-center p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-slate-900">Step 2 of 2</div>
                <div className="text-xs text-slate-600 mt-0.5">
                  We sent a 6-digit code to <strong className="text-indigo-700">{twoStepEmail}</strong>
                </div>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerify2Step} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 text-center mb-2">
                    Enter 6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    placeholder="• • • • • •"
                    value={twoStepCode}
                    onChange={(e) => setTwoStepCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-[0.6em] text-2xl font-mono py-3 border-2 border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white"
                  />
                  <p className="mt-2 text-[11px] text-slate-500 text-center">
                    Expires in 10 minutes. Check your inbox and spam folder.
                  </p>
                </div>

                {/* Dev Code Quick Fill Pill */}
                {twoStepDevOtp && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                    <span className="text-amber-900 font-medium">
                      Dev Code: <strong className="font-mono text-amber-700 font-bold">{twoStepDevOtp}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setTwoStepCode(twoStepDevOtp)}
                      className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-colors shadow-2xs"
                    >
                      Fill Code
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || twoStepCode.length !== 6}
                  className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying Code...
                    </>
                  ) : (
                    <>
                      Verify &amp; Sign In <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setTwoStepRequired(false);
                      setTwoStepCode('');
                      setError(null);
                    }}
                    className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to password
                  </button>

                  <div>
                    {twoStepCountdown > 0 ? (
                      <span className="text-slate-400">Resend in {twoStepCountdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend2Step}
                        disabled={loading}
                        className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Resend code
                      </button>
                    )}
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Auth Method Tabs */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('password');
                    setError(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'password'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" /> Password + 2FA
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('otp');
                    setError(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    authMode === 'otp'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                  <span>1-Click OTP</span>
                </button>
              </div>

              {error && (
                <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {otpSentMessage && authMode === 'otp' && (
                <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{otpSentMessage}</span>
                </div>
              )}

              {/* PASSWORD SIGN-IN MODE */}
              {authMode === 'password' && (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Developer Email
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full text-sm pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        Password
                      </label>
                      <Link
                        href="/forgot-password"
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full text-sm pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* 2-Step Verification Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100">
                    <input
                      type="checkbox"
                      checked={enable2Step}
                      onChange={(e) => setEnable2Step(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        Enable Email 2-Step Verification
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Requires 6-digit email code after entering password
                      </span>
                    </div>
                  </label>

                  {/* Quick Demo Autofill Pill */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-medium truncate">
                      Demo: <strong className="text-indigo-700">vishal@gmail.com</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleAutofillDemo}
                      className="px-2.5 py-1 bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg border border-indigo-200 font-semibold shadow-2xs transition-all flex items-center gap-1 shrink-0"
                    >
                      <Sparkles className="w-3 h-3" /> Autofill
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Signing in...
                      </>
                    ) : (
                      <>
                        {enable2Step ? 'Continue to Step 2' : 'Sign In'} <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* OTP PASSWORDLESS MODE */}
              {authMode === 'otp' && (
                <div className="space-y-4">
                  {otpStep === 'email' ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Developer Email Address
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            placeholder="admin@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full text-sm pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                          />
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        </div>
                        <p className="mt-1.5 text-[11px] text-slate-500">
                          We will send a secure 6-digit one-time code to this address. No password needed.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Sending Code...
                          </>
                        ) : (
                          <>
                            Send 6-Digit OTP <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-slate-700">
                            Enter 6-Digit Code
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setOtpStep('email');
                              setOtpCode('');
                              setError(null);
                            }}
                            className="text-xs text-indigo-600 hover:underline"
                          >
                            Change Email
                          </button>
                        </div>

                        <input
                          type="text"
                          maxLength={6}
                          autoFocus
                          required
                          placeholder="• • • • • •"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full text-center tracking-[0.5em] text-2xl font-mono py-2.5 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                        />

                        <p className="mt-1 text-[11px] text-slate-500 text-center">
                          Sent to <strong>{email}</strong> (valid for 10 minutes)
                        </p>
                      </div>

                      {/* Dev OTP Helper Pill */}
                      {devOtp && (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs">
                          <span className="text-amber-900 font-medium">
                            Dev Code: <strong className="font-mono text-amber-700 font-bold">{devOtp}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => setOtpCode(devOtp)}
                            className="px-2 py-0.5 bg-amber-600 text-white rounded font-bold hover:bg-amber-700 transition-colors"
                          >
                            Fill Code
                          </button>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading || otpCode.length !== 6}
                        className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                          </>
                        ) : (
                          <>
                            Verify &amp; Sign In <CheckCircle2 className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="text-center pt-1">
                        {resendCountdown > 0 ? (
                          <span className="text-xs text-slate-400">
                            Resend code in {resendCountdown}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={loading}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" /> Resend OTP Code
                          </button>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              )}

              <div className="mt-6 text-center text-xs text-slate-500">
                Don&apos;t have an AuthCraft account?{' '}
                <Link
                  href="/register"
                  className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
                >
                  Create one for free
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
