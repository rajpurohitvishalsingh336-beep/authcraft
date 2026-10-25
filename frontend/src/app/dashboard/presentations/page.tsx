'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Download,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  Layout,
  Layers,
  ChevronRight,
  MessageSquare,
  Eye,
  Sliders,
  Palette,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { apiRequest, getStoredToken } from '@/lib/api';
import { useDashboard } from '../layout';

interface Slide {
  id: string;
  slide_number: number;
  layout_type: string;
  title: string;
  subtitle?: string;
  content_json: string;
  speaker_notes?: string;
  background_color: string;
  accent_color: string;
}

interface Presentation {
  id: string;
  title: string;
  description: string;
  topic: string;
  audience: string;
  tone: string;
  template_id: string;
  slide_count: number;
  slides: Slide[];
  created_at: string;
}

const THEME_OPTIONS = [
  { id: 'modern-indigo', name: 'Modern Indigo (Tech & SaaS)', bg: '#0F172A', accent: '#6366F1' },
  { id: 'emerald-growth', name: 'Emerald Growth (Finance)', bg: '#064E3B', accent: '#10B981' },
  { id: 'slate-corporate', name: 'Slate Corporate (Enterprise)', bg: '#1E293B', accent: '#3B82F6' },
  { id: 'minimal-white', name: 'Minimalist White (Clean)', bg: '#FFFFFF', accent: '#4F46E5' },
  { id: 'sunset-pitch', name: 'Sunset Pitch (Showcase)', bg: '#18181B', accent: '#F43F5E' },
  { id: 'cyber-dark', name: 'Cyber Dark (DevOps)', bg: '#09090B', accent: '#A855F7' },
];

export default function PresentationStudioPage() {
  const { activeProject } = useDashboard();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [activePres, setActivePres] = useState<Presentation | null>(null);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [promptTopic, setPromptTopic] = useState('');
  const [audience, setAudience] = useState('Enterprise Executives & Architects');
  const [tone, setTone] = useState('Executive');
  const [slideCount, setSlideCount] = useState(5);
  const [selectedTheme, setSelectedTheme] = useState('modern-indigo');

  // Slide editor local state
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editSpeakerNotes, setEditSpeakerNotes] = useState('');
  const [editLayoutType, setEditLayoutType] = useState('split_content');
  const [savingSlide, setSavingSlide] = useState(false);

  const fetchPresentations = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Presentation[]>('/presentations');
      setPresentations(data);
      if (data.length > 0 && !activePres) {
        setActivePres(data[0]);
        setActiveSlideIdx(0);
      }
    } catch (err) {
      console.error('Failed to load presentations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresentations();
  }, []);

  // Sync active slide to editor form
  useEffect(() => {
    if (activePres && activePres.slides && activePres.slides[activeSlideIdx]) {
      const s = activePres.slides[activeSlideIdx];
      setEditTitle(s.title || '');
      setEditSubtitle(s.subtitle || '');
      setEditSpeakerNotes(s.speaker_notes || '');
      setEditLayoutType(s.layout_type || 'split_content');
    }
  }, [activePres, activeSlideIdx]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptTopic.trim()) return;

    try {
      setGenerating(true);
      const newDeck = await apiRequest<Presentation>('/presentations/generate', {
        method: 'POST',
        body: JSON.stringify({
          topic: promptTopic.trim(),
          audience,
          tone,
          slide_count: Number(slideCount),
          template_id: selectedTheme,
          project_id: activeProject?.id || null,
        }),
      });

      setPresentations((prev) => [newDeck, ...prev]);
      setActivePres(newDeck);
      setActiveSlideIdx(0);
      setModalOpen(false);
      setPromptTopic('');
    } catch (err: any) {
      alert(err.message || 'Failed to generate presentation deck.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveSlide = async () => {
    if (!activePres || !activePres.slides[activeSlideIdx]) return;
    const slide = activePres.slides[activeSlideIdx];

    try {
      setSavingSlide(true);
      const updated = await apiRequest<Slide>(
        `/presentations/${activePres.id}/slides/${slide.id}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            title: editTitle,
            subtitle: editSubtitle,
            speaker_notes: editSpeakerNotes,
            layout_type: editLayoutType,
          }),
        }
      );

      setActivePres((prev) => {
        if (!prev) return null;
        const slides = [...prev.slides];
        slides[activeSlideIdx] = { ...slides[activeSlideIdx], ...updated };
        return { ...prev, slides };
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update slide.');
    } finally {
      setSavingSlide(false);
    }
  };

  const handleExportPPTX = async () => {
    if (!activePres) return;
    try {
      setExporting(true);
      const token = getStoredToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const endpoint = `${apiUrl}/presentations/${activePres.id}/export/pptx`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download PPTX file.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activePres.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.pptx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || 'Error downloading PowerPoint file.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteDeck = async (id: string) => {
    if (!confirm('Are you sure you want to delete this presentation deck?')) return;
    try {
      await apiRequest(`/presentations/${id}`, { method: 'DELETE' });
      setPresentations((prev) => prev.filter((p) => p.id !== id));
      if (activePres?.id === id) {
        const remaining = presentations.filter((p) => p.id !== id);
        setActivePres(remaining[0] || null);
        setActiveSlideIdx(0);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete presentation.');
    }
  };

  const currentSlide = activePres?.slides?.[activeSlideIdx];
  const slideContent = currentSlide
    ? (() => {
        try {
          return JSON.parse(currentSlide.content_json);
        } catch {
          return {};
        }
      })()
    : {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-500" />
              AuthCraft AI Presentation Studio
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Genuine .PPTX
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Prompt-to-deck engine producing widescreen, fully editable PowerPoint presentations via OpenXML.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activePres && (
            <button
              onClick={handleExportPPTX}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Generating PPTX...' : 'Export Genuine .PPTX'}
            </button>
          )}

          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Generate New Deck
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : !activePres ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Presentations Yet</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
            Enter any strategic prompt or product topic to synthesize a complete slide deck with editable cards, metrics, and genuine PowerPoint export.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
          >
            <Sparkles className="w-4 h-4" />
            Synthesize First Presentation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Deck Selector & Slide Thumbnails */}
          <div className="lg:col-span-3 space-y-4">
            {/* Deck Selector Card */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Active Deck
              </label>
              <select
                value={activePres.id}
                onChange={(e) => {
                  const found = presentations.find((p) => p.id === e.target.value);
                  if (found) {
                    setActivePres(found);
                    setActiveSlideIdx(0);
                  }
                }}
                className="w-full text-sm font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
              >
                {presentations.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.slides?.length || 0} slides)
                  </option>
                ))}
              </select>
            </div>

            {/* Slide Navigation Strip */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Slides ({activePres.slides?.length || 0})
                </span>
                <button
                  onClick={() => handleDeleteDeck(activePres.id)}
                  title="Delete deck"
                  className="p-1 text-slate-400 hover:text-rose-500 rounded transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {activePres.slides?.map((slide, idx) => (
                  <button
                    key={slide.id}
                    onClick={() => setActiveSlideIdx(idx)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-center gap-2.5 ${
                      activeSlideIdx === idx
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-sm font-semibold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <div className="truncate flex-1">
                      <p className="truncate font-medium">{slide.title || `Slide ${idx + 1}`}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{slide.layout_type}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column: 16:9 Slide Canvas Preview */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden p-6 aspect-video flex flex-col justify-between text-white relative">
              {/* Top Accent Stripe */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: currentSlide?.accent_color || '#6366F1' }}
              />

              {/* Slide Header */}
              <div>
                <span className="text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
                  // {currentSlide?.layout_type?.toUpperCase() || 'SLIDE'}
                </span>
                <h2 className="text-2xl font-black tracking-tight mt-1 text-slate-100">
                  {currentSlide?.title || 'Slide Title'}
                </h2>
                {currentSlide?.subtitle && (
                  <p className="text-xs text-slate-400 mt-1">{currentSlide.subtitle}</p>
                )}
              </div>

              {/* Dynamic Layout Visual Body */}
              <div className="my-auto py-3">
                {currentSlide?.layout_type === 'title' && (
                  <div className="text-center py-6 bg-slate-800/50 rounded-xl border border-slate-700/60 p-4">
                    <p className="text-lg font-bold text-indigo-300">AuthCraft AI Executive Briefing</p>
                    <p className="text-xs text-slate-400 mt-1">Tone: {activePres.tone} | Audience: {activePres.audience}</p>
                  </div>
                )}

                {currentSlide?.layout_type === 'metrics' && (
                  <div className="grid grid-cols-2 gap-3">
                    {(slideContent.metrics || [
                      { value: '99.9%', label: 'Uptime' },
                      { value: '<45ms', label: 'Latency' },
                    ]).map((m: any, i: number) => (
                      <div key={i} className="bg-slate-800/70 border border-slate-700 rounded-xl p-3 text-center">
                        <p className="text-2xl font-black text-indigo-400">{m.value}</p>
                        <p className="text-xs font-semibold text-slate-200 mt-0.5">{m.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {currentSlide?.layout_type === 'cards' && (
                  <div className="grid grid-cols-3 gap-2">
                    {(slideContent.cards || [
                      { title: 'Security', description: 'Argon2id hashing' },
                      { title: 'Speed', description: 'Global edge cache' },
                      { title: 'Scale', description: 'Multi-tenant DB' },
                    ]).map((c: any, i: number) => (
                      <div key={i} className="bg-slate-800/70 border border-slate-700 rounded-xl p-2.5 text-left">
                        <p className="text-xs font-bold text-indigo-400">{c.title}</p>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-3">{c.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {currentSlide?.layout_type === 'quote' && (
                  <div className="bg-slate-800/60 border-l-4 border-indigo-500 rounded-r-xl p-4 my-2">
                    <p className="text-sm italic text-slate-200">
                      "{slideContent.quote || currentSlide.title}"
                    </p>
                    {slideContent.author && (
                      <p className="text-xs font-bold text-indigo-400 mt-2">— {slideContent.author}</p>
                    )}
                  </div>
                )}

                {currentSlide?.layout_type === 'split_content' && (
                  <div className="space-y-2">
                    {slideContent.left_body && (
                      <p className="text-xs text-slate-300 mb-2">{slideContent.left_body}</p>
                    )}
                    {(slideContent.bullets || []).map((b: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                )}

                {currentSlide?.layout_type === 'conclusion' && (
                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 space-y-2">
                    <p className="text-xs text-slate-300">{slideContent.summary}</p>
                    <div className="pt-2 border-t border-slate-700/60 text-[11px] text-indigo-400 font-semibold">
                      {slideContent.contact}
                    </div>
                  </div>
                )}
              </div>

              {/* Slide Footer */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-800 pt-2">
                <span>AuthCraft Presentation Studio (16:9 HD)</span>
                <span>
                  Slide {activeSlideIdx + 1} of {activePres.slides?.length || 0}
                </span>
              </div>
            </div>

            {/* Speaker Notes Box */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-indigo-500" />
                Speaker Teleprompter Notes (Exported to PPTX notes pane)
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                {currentSlide?.speaker_notes || 'No speaker notes recorded for this slide.'}
              </p>
            </div>
          </div>

          {/* Right Column: Slide Editor Panel */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Edit Slide #{activeSlideIdx + 1}
                </span>
                <span className="text-[10px] font-mono text-indigo-500 font-bold">
                  {currentSlide?.id}
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Layout Blueprint
                </label>
                <select
                  value={editLayoutType}
                  onChange={(e) => setEditLayoutType(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                >
                  <option value="title">Title / Cover Slide</option>
                  <option value="split_content">Split Bullet Content</option>
                  <option value="metrics">4-Card KPI Metrics</option>
                  <option value="cards">Feature & Pillar Cards</option>
                  <option value="quote">Executive Testimonial Quote</option>
                  <option value="conclusion">Call to Action & Conclusion</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Slide Headline
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Speaker Notes
                </label>
                <textarea
                  rows={4}
                  value={editSpeakerNotes}
                  onChange={(e) => setEditSpeakerNotes(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200 resize-none"
                  placeholder="Talking points for this slide..."
                />
              </div>

              <button
                onClick={handleSaveSlide}
                disabled={savingSlide}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {savingSlide ? 'Saving...' : 'Apply Slide Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Generate AI Presentation Deck
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Topic or Strategic Objective
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Enterprise Zero-Trust Identity Strategy for 2026"
                  value={promptTopic}
                  onChange={(e) => setPromptTopic(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Target Audience
                  </label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Enterprise CISO & Platform Architects">CISO & Architects</option>
                    <option value="Executive Board of Directors">Board of Directors</option>
                    <option value="Venture Capital Investors">Investors (Pitch)</option>
                    <option value="Engineering & DevOps Teams">DevOps & Engineers</option>
                    <option value="General Enterprise Clients">Enterprise Clients</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tone & Style
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  >
                    <option value="Executive">Executive</option>
                    <option value="Technical">Technical</option>
                    <option value="Persuasive">Persuasive</option>
                    <option value="Creative">Creative</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Slide Count
                  </label>
                  <select
                    value={slideCount}
                    onChange={(e) => setSlideCount(Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  >
                    <option value={4}>4 Slides (Fast Brief)</option>
                    <option value={5}>5 Slides (Standard)</option>
                    <option value={6}>6 Slides (Extended)</option>
                    <option value={8}>8 Slides (Deep Dive)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Design Theme
                  </label>
                  <select
                    value={selectedTheme}
                    onChange={(e) => setSelectedTheme(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
                  >
                    {THEME_OPTIONS.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {generating ? 'Synthesizing Slides...' : 'Generate Deck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
