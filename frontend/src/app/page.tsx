'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Palette,
  KeyRound,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Globe,
  Sliders,
  Users,
  Code2,
  ChevronDown,
  Eye,
  ExternalLink,
} from 'lucide-react';

export default function LandingPage() {
  // Interactive preview state on the landing page
  const [previewTemplate, setPreviewTemplate] = useState<'modern' | 'minimal' | 'dark' | 'startup'>('modern');
  const [previewPrimaryColor, setPreviewPrimaryColor] = useState('#4F46E5');
  const [previewRadius, setPreviewRadius] = useState(8);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const templates = [
    { id: 'modern', name: 'Modern Indigo', color: '#4F46E5', radius: 8 },
    { id: 'minimal', name: 'Minimal Slate', color: '#18181B', radius: 4 },
    { id: 'dark', name: 'Dark Violet', color: '#8B5CF6', radius: 12 },
    { id: 'startup', name: 'Startup Emerald', color: '#10B981', radius: 16 },
  ];

  const handleTemplateChange = (tmpl: any) => {
    setPreviewTemplate(tmpl.id);
    setPreviewPrimaryColor(tmpl.color);
    setPreviewRadius(tmpl.radius);
  };

  const toggleFaq = (idx: number) => {
    setFaqOpen(faqOpen === idx ? null : idx);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-[Inter]">
      {/* 1. Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Auth<span className="text-indigo-600">Craft</span>
            </span>
            <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              No-Code AaaS
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#preview" className="hover:text-slate-900 transition-colors">Live Preview</a>
            <a href="#security" className="hover:text-slate-900 transition-colors">Security</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Free Tier</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Configuration-Driven Authentication Platform
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight md:leading-[1.15]">
            Authentication, Without the Complexity.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Create, customize, and publish secure login experiences for your applications without building an authentication backend from scratch.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-base shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#preview"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-800 font-semibold text-base hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4 text-slate-500" /> Try Interactive Builder
            </a>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs sm:text-sm text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> RFC 9106 Argon2id Hashing
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Strict Project-Isolated Database
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> One-Click Hosted Login Link
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No AI Dependencies or API Keys
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Hosted Login Page Live Preview */}
      <section id="preview" className="py-20 bg-slate-100 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-indigo-600 tracking-wider uppercase">Visual Builder Experience</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Preview Your Hosted Login Page in Real Time
            </p>
            <p className="mt-3 text-base text-slate-600">
              Customize colors, presets, and button styles. The changes you see here are exactly how AuthCraft renders your application users' hosted authentication flow.
            </p>
          </div>

          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm max-w-4xl mx-auto mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Templates:</span>
              <div className="flex flex-wrap gap-2">
                {templates.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleTemplateChange(tmpl)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      previewTemplate === tmpl.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary Color:</span>
                <input
                  type="color"
                  value={previewPrimaryColor}
                  onChange={(e) => setPreviewPrimaryColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Radius:</span>
                <select
                  value={previewRadius}
                  onChange={(e) => setPreviewRadius(Number(e.target.value))}
                  className="text-xs font-medium border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-800"
                >
                  <option value={0}>Sharp (0px)</option>
                  <option value={4}>Small (4px)</option>
                  <option value={8}>Medium (8px)</option>
                  <option value={12}>Large (12px)</option>
                  <option value={16}>Pill (16px)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Interactive Preview Canvas */}
          <div className="max-w-md mx-auto bg-white border border-slate-200/90 shadow-xl rounded-2xl p-6 sm:p-8 transition-all">
            <div className="text-center mb-6">
              <div
                className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center text-white mb-3 shadow-md"
                style={{ backgroundColor: previewPrimaryColor, borderRadius: `${previewRadius}px` }}
              >
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Sign in to Acme Cloud</h3>
              <p className="text-xs text-slate-500 mt-1">Welcome back! Please enter your details.</p>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value="developer@acme.io"
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none"
                  style={{ borderRadius: `${previewRadius}px` }}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-700">Password</label>
                  <span className="text-xs font-medium text-indigo-600 hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                </div>
                <input
                  type="password"
                  disabled
                  value="••••••••••••"
                  className="w-full text-sm px-3.5 py-2.5 border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none"
                  style={{ borderRadius: `${previewRadius}px` }}
                />
              </div>

              <button
                type="button"
                className="w-full py-2.5 text-sm font-semibold text-white shadow-md transition-all flex items-center justify-center gap-2"
                style={{
                  backgroundColor: previewPrimaryColor,
                  borderRadius: `${previewRadius}px`,
                }}
              >
                Sign In
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-slate-500">
              Don&apos;t have an account?{' '}
              <span className="font-semibold text-indigo-600 hover:underline cursor-pointer">
                Create account
              </span>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
              Protected by AuthCraft No-Code Security
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works */}
      <section id="how-it-works" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 tracking-wider uppercase">Streamlined Workflow</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              From Zero to Live Authentication in 3 Minutes
            </p>
            <p className="mt-3 text-base text-slate-600">
              No SDK installation required for the hosted workflow. Configure in our visual dashboard and deploy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center mb-4 text-sm shadow-md shadow-indigo-100">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Create a Project</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sign up for an AuthCraft developer account and create your application. Receive a secure unique Project ID and project slug immediately.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center mb-4 text-sm shadow-md shadow-indigo-100">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Customize the Page</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Use the visual builder to customize your logo, brand colors, typography, border radius, and feature toggles with immediate live preview.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center mb-4 text-sm shadow-md shadow-indigo-100">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Publish with One Click</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hit Publish to make your configuration active. AuthCraft generates a dedicated hosted login URL for your application.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center mb-4 text-sm shadow-md shadow-indigo-100">
                4
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Manage Users & Events</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your users authenticate seamlessly. Inspect user records, revoke active sessions, and monitor security events right from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Features Grid */}
      <section id="features" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 tracking-wider uppercase">Built for Real Applications</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Everything You Need in an Authentication Provider
            </p>
            <p className="mt-3 text-base text-slate-600">
              Engineered with clean separation of concerns, complete project isolation, and zero unnecessary complexity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">One-Click Hosted Login URL</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Directly shareable login URL for your application. Anyone with the published link can authenticate without creating an AuthCraft developer account.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">RFC 9106 Argon2id Hashes</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Passwords are never stored in plaintext. We utilize industry-standard Argon2id hashing with constant-time verification and zero user-enumeration leaks.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Strict Project Isolation</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every project has its own logical end-user namespace. A user registered in Project A can never access or compromise sessions in Project B.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Visual Theme Builder</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Choose from predefined templates or customize individual styles. Save drafts independently and publish to production when satisfied.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">User & Session Controls</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Inspect registered users, view last login timestamps, toggle user active status, and revoke active sessions on demand.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Audit & Security Logs</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Filter and inspect authentication events including successful logins, failed attempts, and password reset requests without exposing private secrets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Security and Privacy */}
      <section id="security" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
                <ShieldCheck className="w-4 h-4" /> Built with Security as a Foundation
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Enterprise-Grade Cryptography & Isolation
              </h2>
              <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                AuthCraft adheres to strict security standards. Passwords use Argon2id, tokens are cryptographically generated and stored solely as SHA-256 hashes, redirect URIs are strictly allowlisted, and project data is completely segregated.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Never stores passwords in plaintext
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Never leaks password reset tokens
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> HTTP-only SameSite session cookies
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Generic anti-enumeration auth errors
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Free Tier Explanation */}
      <section id="pricing" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-indigo-600 tracking-wider uppercase">Transparent Pricing</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              100% Free Developer MVP
            </p>
            <p className="mt-3 text-base text-slate-600">
              Zero AI subscription fees. Zero mandatory third-party credit card locks. Run locally with Docker or deploy to your own servers.
            </p>
          </div>

          <div className="max-w-lg mx-auto bg-white border border-indigo-200 rounded-3xl p-8 shadow-lg shadow-indigo-100 relative">
            <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-sm">
              Free Community Edition
            </div>
            <div className="text-center mb-6">
              <span className="text-4xl font-extrabold text-slate-900">$0</span>
              <span className="text-sm font-medium text-slate-500"> / forever</span>
              <p className="mt-2 text-xs text-slate-500">Designed for developers, startups, students, and small teams.</p>
            </div>

            <div className="space-y-3 mb-8 text-xs sm:text-sm text-slate-700">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Up to 10 isolated application projects
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Unlimited hosted authentications
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Visual builder with 6 preset templates
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Audit logs & security event monitoring
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Local development email catcher
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Full source code with Docker Compose
              </div>
            </div>

            <Link
              href="/register"
              className="block w-full py-3 text-center text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-all"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section id="faq" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold text-indigo-600 tracking-wider uppercase">Got Questions?</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Frequently Asked Questions
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: 'What is a Hosted Login URL?',
                a: 'A hosted login URL is a direct web link (e.g., http://localhost:3000/login/my-app) generated by AuthCraft. Your end users visit this page to register or sign in. Once authenticated, they are securely redirected back to your application with their session.',
              },
              {
                q: 'Do my end users need an AuthCraft developer account?',
                a: 'No! Only the software developer creates an AuthCraft account to configure and manage projects. Your end users authenticate solely through your project\'s branded hosted page.',
              },
              {
                q: 'Can a user from Project A log into Project B?',
                a: 'Never. AuthCraft implements strict project-level data isolation. Application user databases, credentials, and sessions are segregated by project ID.',
              },
              {
                q: 'Are any AI models or paid AI APIs used in AuthCraft?',
                a: 'No. AuthCraft is strictly built upon deterministic software engineering, configuration templates, and verified cryptography. It has zero AI dependencies and zero unexpected cloud AI bills.',
              },
              {
                q: 'How does local email verification work in development?',
                a: 'AuthCraft includes a built-in development outbox. When an email verification or password reset email is sent locally, the token and message are recorded to an inspection endpoint, allowing you to test the complete flow without external SMTP credentials.',
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 transition-colors"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center text-sm sm:text-base font-semibold text-slate-900 focus:outline-none"
                >
                  {faq.q}
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      faqOpen === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {faqOpen === i && (
                  <div className="px-6 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/50 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">AuthCraft</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">Developer Portal</Link>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#security" className="hover:text-white transition-colors">Security Specs</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <p className="text-slate-500 text-center sm:text-right">
            &copy; {new Date().getFullYear()} AuthCraft. No-Code Authentication-as-a-Service Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
