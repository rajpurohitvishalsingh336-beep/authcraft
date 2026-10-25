'use client';

import React from 'react';
import Link from 'next/link';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Terminal,
  Sparkles,
  ExternalLink,
  Crown,
  Key,
  Layers,
  ChevronRight,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { LayoutDefinition } from './types';
import { ProjectConfiguration, PublicProjectConfig } from '@/lib/types';

export interface LayoutRendererProps {
  layout: LayoutDefinition;
  config: ProjectConfiguration | PublicProjectConfig;
  mode?: 'login' | 'register' | 'forgot';
  email: string;
  setEmail: (val: string) => void;
  password?: string;
  setPassword?: (val: string) => void;
  displayName?: string;
  setDisplayName?: (val: string) => void;
  showPassword?: boolean;
  setShowPassword?: (val: boolean) => void;
  submitting?: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  authError?: string | null;
  authSuccess?: any | null;
  redirectUri?: string;
  isBuilderPreview?: boolean;
  onSwitchMode?: (mode: 'login' | 'register' | 'forgot') => void;
  isOtpMode?: boolean;
  setIsOtpMode?: (val: boolean) => void;
  otpStep?: 'email' | 'code';
  setOtpStep?: (val: 'email' | 'code') => void;
  otpCode?: string;
  setOtpCode?: (val: string) => void;
  onSendOtp?: () => void;
  devOtp?: string | null;
}

export function UniversalLayoutRenderer({
  layout,
  config,
  mode = 'login',
  email,
  setEmail,
  password = '',
  setPassword,
  displayName = '',
  setDisplayName,
  showPassword = false,
  setShowPassword,
  submitting = false,
  handleSubmit,
  authError = null,
  authSuccess = null,
  redirectUri = '',
  isBuilderPreview = false,
  onSwitchMode,
  isOtpMode = false,
  setIsOtpMode,
  otpStep = 'email',
  setOtpStep,
  otpCode = '',
  setOtpCode,
  onSendOtp,
  devOtp = null,
}: LayoutRendererProps) {
  const tokens = layout.tokens;

  // Background pattern styles
  const getPatternOverlay = () => {
    if (tokens.decorations === 'grid') {
      return (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.12]"
          style={{
            backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      );
    }
    if (tokens.decorations === 'dots') {
      return (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.08] dark:opacity-[0.15]"
          style={{
            backgroundImage: `radial-gradient(currentColor 1.5px, transparent 1.5px)`,
            backgroundSize: '24px 24px',
          }}
        />
      );
    }
    if (tokens.decorations === 'mesh') {
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[30%] -left-[20%] w-[70vw] h-[70vw] rounded-full blur-[120px] opacity-30 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
          <div className="absolute -bottom-[30%] -right-[20%] w-[60vw] h-[60vw] rounded-full blur-[120px] opacity-25 bg-gradient-to-tl from-cyan-400 via-blue-600 to-purple-600" />
        </div>
      );
    }
    if (tokens.decorations === 'gold-border') {
      return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
          <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[50vw] h-[50vw] rounded-full blur-[140px] opacity-15 bg-amber-500" />
        </div>
      );
    }
    return null;
  };

  // Badge variant pill
  const renderBadge = () => {
    if (!tokens.badge) return null;
    const { text, variant } = tokens.badge;
    const variantClasses = {
      gold: 'bg-amber-500/10 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10',
      silver: 'bg-slate-200/10 text-slate-200 border-slate-400/40',
      emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      blue: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      purple: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      amber: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      slate: 'bg-slate-800 text-slate-300 border-slate-700',
    }[variant || 'blue'];

    return (
      <div className="flex items-center gap-1.5 mb-3">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase border ${variantClasses}`}
        >
          {variant === 'gold' && <Crown className="w-3 h-3 text-amber-400" />}
          {variant === 'emerald' && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
          {variant === 'blue' && <Sparkles className="w-3 h-3 text-sky-400" />}
          {text}
        </span>
      </div>
    );
  };

  // Standard Header (Brand + Title)
  const renderHeader = () => (
    <div className="mb-6">
      {renderBadge()}
      <div className="flex items-center gap-3 mb-2">
        {config.logo_url ? (
          <img
            src={config.logo_url}
            alt={config.brand_name || 'Brand Logo'}
            className="h-9 w-auto object-contain"
          />
        ) : (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
            style={{
              backgroundColor: tokens.accentColor || config.primary_color || '#4f46e5',
            }}
          >
            {(config.brand_name || 'AC')[0].toUpperCase()}
          </div>
        )}
        <h2 className="text-xl font-bold tracking-tight">
          {config.brand_name || 'AuthCraft'}
        </h2>
      </div>

      <h1 className="text-2xl font-bold tracking-tight mb-1">
        {mode === 'login' && (config.page_title || 'Sign In')}
        {mode === 'register' && (config.register_text || 'Create Account')}
        {mode === 'forgot' && 'Reset Password'}
      </h1>

      <p className="text-sm opacity-70">
        {mode === 'login' &&
          (config.welcome_message ||
            'Welcome back! Enter your details to continue.')}
        {mode === 'register' && 'Enter your details to create an application account.'}
        {mode === 'forgot' && 'Enter your email to receive recovery instructions.'}
      </p>
    </div>
  );

  // Form Fields Component
  const renderAuthForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {authError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}

      {authSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Authentication Successful</span>
          </div>
          <p className="opacity-90">
            Welcome back, {authSuccess.user?.email || email}! Session established.
          </p>
        </div>
      )}

      {/* Mode Switch for Password vs Email OTP (When allowed on login) */}
      {mode === 'login' && config.allow_otp_login !== false && setIsOtpMode && (
        <div className="grid grid-cols-2 p-1 bg-black/5 dark:bg-white/5 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setIsOtpMode(false)}
            className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              !isOtpMode ? 'bg-white dark:bg-slate-800 shadow-xs text-indigo-600 dark:text-indigo-400' : 'opacity-70'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Password
          </button>
          <button
            type="button"
            onClick={() => setIsOtpMode(true)}
            className={`py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              isOtpMode ? 'bg-white dark:bg-slate-800 shadow-xs text-indigo-600 dark:text-indigo-400' : 'opacity-70'
            }`}
          >
            <Key className="w-3.5 h-3.5" /> 1-Click OTP
          </button>
        </div>
      )}

      {/* OTP MODE FORM */}
      {mode === 'login' && isOtpMode ? (
        <div className="space-y-4">
          {otpStep === 'email' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 opacity-80">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full pl-9 pr-3 py-2.5 text-sm bg-transparent border rounded-lg transition-colors outline-none ${tokens.inputStyle}`}
                  />
                </div>
                <p className="mt-1 text-[11px] opacity-60">
                  We will send a 6-digit one-time code to sign you in passwordless.
                </p>
              </div>

              <button
                type="button"
                onClick={onSendOtp}
                disabled={submitting}
                className={`w-full py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${tokens.primaryBtn}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send 6-Digit OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold opacity-80">
                    Enter 6-Digit Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setOtpStep && setOtpStep('email')}
                    className="text-xs hover:underline opacity-80"
                    style={{ color: tokens.accentColor }}
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
                  onChange={(e) => setOtpCode && setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className={`w-full py-2.5 text-center tracking-[0.5em] text-xl font-mono bg-transparent border rounded-lg transition-colors outline-none ${tokens.inputStyle}`}
                />
                <p className="mt-1 text-[11px] opacity-60 text-center">
                  Code sent to <strong>{email}</strong>
                </p>
              </div>

              {devOtp && (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center justify-between">
                  <span>Dev OTP: <strong className="font-mono font-bold">{devOtp}</strong></span>
                  <button
                    type="button"
                    onClick={() => setOtpCode && setOtpCode(devOtp)}
                    className="px-2 py-0.5 bg-amber-600 text-white rounded text-[11px] font-bold"
                  >
                    Fill
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || otpCode.length !== 6}
                className={`w-full py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${tokens.primaryBtn}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify OTP &amp; Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* STANDARD PASSWORD FORM */
        <>
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold mb-1.5 opacity-80">
                Full Name (Optional)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName && setDisplayName(e.target.value)}
                  placeholder="Alex Smith"
                  className={`w-full pl-9 pr-3 py-2.5 text-sm bg-transparent border rounded-lg transition-colors outline-none ${tokens.inputStyle}`}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1.5 opacity-80">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full pl-9 pr-3 py-2.5 text-sm bg-transparent border rounded-lg transition-colors outline-none ${tokens.inputStyle}`}
              />
            </div>
          </div>

          {mode !== 'forgot' && setPassword && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold opacity-80">Password</label>
                {mode === 'login' && config.show_forgot_password !== false && (
                  <button
                    type="button"
                    onClick={() => onSwitchMode && onSwitchMode('forgot')}
                    className="text-xs hover:underline opacity-80"
                    style={{ color: tokens.accentColor }}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full pl-9 pr-10 py-2.5 text-sm bg-transparent border rounded-lg transition-colors outline-none ${tokens.inputStyle}`}
                />
                {setShowPassword && config.show_password_toggle !== false && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-80"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3 px-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${tokens.primaryBtn}`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>
                  {mode === 'login' && (config.login_text || 'Sign In')}
                  {mode === 'register' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Link'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </>
      )}

      {/* Switch mode links */}
      <div className="text-center pt-2 text-xs opacity-70">
        {mode === 'login' && config.show_registration !== false && (
          <p>
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => onSwitchMode && onSwitchMode('register')}
              className="font-semibold underline hover:opacity-100"
              style={{ color: tokens.accentColor }}
            >
              Sign up
            </button>
          </p>
        )}
        {mode === 'register' && (
          <p>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => onSwitchMode && onSwitchMode('login')}
              className="font-semibold underline hover:opacity-100"
              style={{ color: tokens.accentColor }}
            >
              Sign in
            </button>
          </p>
        )}
        {mode === 'forgot' && (
          <p>
            Remembered your credentials?{' '}
            <button
              type="button"
              onClick={() => onSwitchMode && onSwitchMode('login')}
              className="font-semibold underline hover:opacity-100"
              style={{ color: tokens.accentColor }}
            >
              Back to sign in
            </button>
          </p>
        )}
      </div>

      {/* Social login buttons */}
      {mode !== 'forgot' && (
        <div className="pt-2">
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-current opacity-10 w-full" />
            <span className="bg-transparent px-2 text-[11px] opacity-40 uppercase tracking-widest absolute">
              or continue with
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                if (isBuilderPreview) alert('Social OAuth is active in production.');
              }}
              className="py-2 px-3 border border-current border-opacity-15 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (isBuilderPreview) alert('Social OAuth is active in production.');
              }}
              className="py-2 px-3 border border-current border-opacity-15 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>
        </div>
      )}

      {/* Footer copyright */}
      <div className="pt-4 text-center text-[11px] opacity-40">
        {config.footer_text || 'Protected by AuthCraft No-Code Security'}
      </div>
    </form>
  );

  // FAMILY 1 & 2: Centered Card & Centered Minimal
  if (
    layout.family === 'centered-card' ||
    layout.family === 'centered-minimal' ||
    layout.family === 'glassmorphism'
  ) {
    return (
      <div
        className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-${tokens.fontFamily} ${tokens.container}`}
      >
        {getPatternOverlay()}
        <div className={`w-full max-w-md relative z-10 ${tokens.card}`}>
          {renderHeader()}
          {renderAuthForm()}
        </div>
      </div>
    );
  }

  // FAMILY 3: Split Left (Hero on Left, Form on Right)
  if (layout.family === 'split-left') {
    return (
      <div
        className={`min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden font-${tokens.fontFamily} ${tokens.container}`}
      >
        {getPatternOverlay()}
        {/* Left Hero Pane */}
        <div className="hidden lg:flex flex-col justify-between p-12 lg:p-16 relative bg-black/10 backdrop-blur-sm border-r border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                style={{ backgroundColor: tokens.accentColor }}
              >
                {(config.brand_name || 'AC')[0].toUpperCase()}
              </div>
              <span className="font-bold text-lg">{config.brand_name || 'AuthCraft'}</span>
            </div>
            {renderBadge()}
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4">
              {tokens.heroTitle || 'Securing the world’s most ambitious applications.'}
            </h2>
            <p className="text-base opacity-75 max-w-md leading-relaxed">
              {tokens.heroSubtitle ||
                'Autonomous zero-trust authentication infrastructure with sub-millisecond response latency and verified enterprise compliance.'}
            </p>
          </div>

          {tokens.heroQuote && (
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <p className="italic text-sm opacity-90 mb-3">"{tokens.heroQuote}"</p>
              <div>
                <p className="font-semibold text-xs">{tokens.heroAuthor}</p>
                <p className="text-[11px] opacity-60">{tokens.heroAuthorRole}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Form Pane */}
        <div className="flex items-center justify-center p-6 sm:p-12 relative z-10">
          <div className={`w-full max-w-md ${tokens.card}`}>
            {renderHeader()}
            {renderAuthForm()}
          </div>
        </div>
      </div>
    );
  }

  // FAMILY 4: Split Right (Form on Left, Hero on Right)
  if (layout.family === 'split-right') {
    return (
      <div
        className={`min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 relative overflow-hidden font-${tokens.fontFamily} ${tokens.container}`}
      >
        {getPatternOverlay()}
        {/* Left Form Pane */}
        <div className="flex items-center justify-center p-6 sm:p-12 relative z-10">
          <div className={`w-full max-w-md ${tokens.card}`}>
            {renderHeader()}
            {renderAuthForm()}
          </div>
        </div>

        {/* Right Hero Pane */}
        <div className="hidden lg:flex flex-col justify-between p-12 lg:p-16 relative bg-black/10 backdrop-blur-sm border-l border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                style={{ backgroundColor: tokens.accentColor }}
              >
                {(config.brand_name || 'AC')[0].toUpperCase()}
              </div>
              <span className="font-bold text-lg">{config.brand_name || 'AuthCraft'}</span>
            </div>
            {renderBadge()}
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight mb-4">
              {tokens.heroTitle || 'Next-generation access control and user security.'}
            </h2>
            <p className="text-base opacity-75 max-w-md leading-relaxed">
              {tokens.heroSubtitle ||
                'Accelerate developer velocity with zero backend friction, automatic session tokens, and Argon2id cryptosecurity.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold" style={{ color: tokens.accentColor }}>
                99.999%
              </p>
              <p className="text-xs opacity-60">Authentication SLA</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-2xl font-bold" style={{ color: tokens.accentColor }}>
                &lt; 5ms
              </p>
              <p className="text-xs opacity-60">Token Verification</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // FAMILY 5: Luxury Crest
  if (layout.family === 'luxury-crest') {
    return (
      <div
        className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-${tokens.fontFamily} ${tokens.container}`}
      >
        {getPatternOverlay()}
        <div className="relative z-10 w-full max-w-md">
          {/* Royal Crest Monogram Header */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <Crown className="w-8 h-8" />
            </div>
            <p className="text-xs tracking-[0.3em] uppercase text-amber-400 font-semibold mb-1">
              {tokens.badge?.text || 'HAUTE EXPEDITION'}
            </p>
            <h1 className="text-2xl font-serif font-bold text-amber-100">
              {config.brand_name || 'Private Salon'}
            </h1>
          </div>

          <div className={tokens.card}>
            {renderHeader()}
            {renderAuthForm()}
          </div>
        </div>
      </div>
    );
  }

  // FAMILY 6: Terminal CLI
  if (layout.family === 'terminal') {
    return (
      <div
        className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-mono ${tokens.container}`}
      >
        {getPatternOverlay()}
        <div className="w-full max-w-lg relative z-10">
          {/* Terminal Window Chrome */}
          <div className="bg-zinc-900 border border-zinc-700 rounded-t-xl px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <div className="text-xs text-zinc-400 font-mono flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>authcraft://session/{layout.id}</span>
            </div>
            <div className="text-[10px] text-zinc-500">BASH 5.2</div>
          </div>

          {/* Terminal Card Body */}
          <div className={`rounded-b-xl border-t-0 ${tokens.card}`}>
            <div className="text-xs mb-4 opacity-75 font-mono text-emerald-400">
              $ ./authcraft-authenticate --project={config.brand_name || 'app'} --protocol=argon2id
            </div>
            {renderHeader()}
            {renderAuthForm()}
          </div>
        </div>
      </div>
    );
  }

  // FAMILY 7: Editorial Broadsheet
  if (layout.family === 'editorial') {
    return (
      <div
        className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-8 relative overflow-hidden font-serif ${tokens.container}`}
      >
        <div className="w-full max-w-xl relative z-10">
          {/* Broadsheet Masthead */}
          <div className="text-center pb-6 border-b-2 border-current mb-8">
            <div className="flex items-center justify-between text-[10px] tracking-widest uppercase opacity-70 pb-2">
              <span>EST. 1892</span>
              <span>THE DAILY CHRONICLE</span>
              <span>SPECIAL EDITION</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif font-black tracking-tight my-2">
              {config.brand_name || 'THE BROADSHEET'}
            </h1>
            <div className="border-t border-current pt-1 text-[11px] italic opacity-80">
              "All the Authentication Architecture Fit to Print"
            </div>
          </div>

          <div className={tokens.card}>
            {renderHeader()}
            {renderAuthForm()}
          </div>
        </div>
      </div>
    );
  }

  // FAMILY 8: Compact Dock (Mobile-First Sheet)
  if (layout.family === 'compact-dock') {
    return (
      <div
        className={`min-h-screen w-full flex flex-col justify-end sm:justify-center p-2 sm:p-6 relative overflow-hidden font-${tokens.fontFamily} ${tokens.container}`}
      >
        {getPatternOverlay()}
        <div className="w-full max-w-sm mx-auto relative z-10">
          <div className="w-12 h-1 bg-current opacity-20 rounded-full mx-auto mb-3 sm:hidden" />
          <div className={tokens.card}>
            {renderHeader()}
            {renderAuthForm()}
          </div>
        </div>
      </div>
    );
  }

  // FAMILY 9 & 10: Banner Stacked & Corporate Portal
  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden font-${tokens.fontFamily} ${tokens.container}`}
    >
      {getPatternOverlay()}
      {/* Top Banner Bar */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-between text-xs py-2 px-4 rounded-xl bg-black/10 dark:bg-white/5 border border-current border-opacity-10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 opacity-75" />
          <span className="font-semibold">{config.brand_name || 'Enterprise System'}</span>
        </div>
        <div className="flex items-center gap-1.5 opacity-80">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SOC 2 Type II Certified</span>
        </div>
      </div>

      <div className={`w-full max-w-lg relative z-10 ${tokens.card}`}>
        {renderHeader()}
        {renderAuthForm()}
      </div>
    </div>
  );
}
