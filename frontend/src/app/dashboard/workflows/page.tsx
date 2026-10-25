'use client';

import React, { useState, useEffect } from 'react';
import {
  Share2,
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Zap,
  Activity,
  Layers,
  RefreshCw,
  Check,
  AlertCircle,
} from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { useDashboard } from '../layout';

interface WorkflowNode {
  id: string;
  label: string;
  type: string;
  description: string;
  action: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  status: string;
  definition: {
    nodes: WorkflowNode[];
    edges: { source: string; target: string }[];
  };
  execution_count: number;
  recent_executions?: any[];
  created_at: string;
}

export default function WorkflowsPage() {
  const { activeProject } = useDashboard();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [lastExecution, setLastExecution] = useState<any | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl_enterprise_onboarding');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wfs, tpls] = await Promise.all([
        apiRequest<Workflow[]>('/workflows'),
        apiRequest<any[]>('/workflows/templates'),
      ]);
      setWorkflows(wfs);
      setTemplates(tpls);

      if (wfs.length > 0 && !activeWorkflow) {
        setActiveWorkflow(wfs[0]);
      }
    } catch (err) {
      console.error('Failed to load workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateWorkflow = async () => {
    try {
      const created = await apiRequest<Workflow>('/workflows', {
        method: 'POST',
        body: JSON.stringify({
          template_id: selectedTemplateId,
          name: '',
          project_id: activeProject?.id || null,
        }),
      });

      setWorkflows((prev) => [created, ...prev]);
      setActiveWorkflow(created);
      setCreateModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to create workflow.');
    }
  };

  const handleRunWorkflow = async () => {
    if (!activeWorkflow) return;
    try {
      setRunning(true);
      const res = await apiRequest<any>(`/workflows/${activeWorkflow.id}/run`, {
        method: 'POST',
      });
      setLastExecution(res);
      // Refresh workflow executions count
      setActiveWorkflow((prev) =>
        prev ? { ...prev, execution_count: prev.execution_count + 1 } : null
      );
    } catch (err: any) {
      alert(err.message || 'Workflow execution error.');
    } finally {
      setRunning(false);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workflow pipeline?')) return;
    try {
      await apiRequest(`/workflows/${id}`, { method: 'DELETE' });
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
      if (activeWorkflow?.id === id) {
        const remaining = workflows.filter((w) => w.id !== id);
        setActiveWorkflow(remaining[0] || null);
        setLastExecution(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete workflow.');
    }
  };

  const nodes = activeWorkflow?.definition?.nodes || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Share2 className="w-6 h-6 text-indigo-500" />
              Interactive Workflow Automation Center
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Live Engine
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build and execute connected flowchart pipelines with backend-enforced prerequisites and audit traces.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeWorkflow && (
            <button
              onClick={handleRunWorkflow}
              disabled={running}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-white" />
              {running ? 'Executing Pipeline...' : 'Run Pipeline'}
            </button>
          )}

          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            New Workflow
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : !activeWorkflow ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
            <Share2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Workflows Configured</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
            Choose an enterprise blueprint template to automate your security response, onboarding flow, or deck delivery.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Create Workflow from Blueprint
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Workflow Selector Bar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <select
                value={activeWorkflow.id}
                onChange={(e) => {
                  const found = workflows.find((w) => w.id === e.target.value);
                  if (found) {
                    setActiveWorkflow(found);
                    setLastExecution(null);
                  }
                }}
                className="text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-200"
              >
                {workflows.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.trigger_type})
                  </option>
                ))}
              </select>

              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {activeWorkflow.execution_count} total runs
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDeleteWorkflow(activeWorkflow.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Workflow
              </button>
            </div>
          </div>

          {/* Connected Flowchart Nodes Visualizer */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-8 shadow-xl overflow-x-auto">
            <div className="min-w-[700px] flex items-center justify-between gap-4">
              {nodes.map((node, idx) => (
                <React.Fragment key={node.id}>
                  {/* Node Box */}
                  <div className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl p-4 shadow-lg text-white hover:border-indigo-500 transition relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center font-bold text-xs text-indigo-300">
                        {idx + 1}
                      </span>
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-800 text-slate-400">
                        {node.type}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-100">{node.label}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{node.description}</p>
                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-indigo-400 font-mono">
                      <span>{node.action}</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                  </div>

                  {/* Connecting Arrow */}
                  {idx < nodes.length - 1 && (
                    <div className="shrink-0 flex items-center justify-center text-slate-600 px-1">
                      <ArrowRight className="w-6 h-6 text-indigo-500/80" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Execution Telemetry Logs */}
          {lastExecution && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Live Execution Telemetry (#{lastExecution.execution_id})
                  </h3>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold uppercase">
                    {lastExecution.status}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono">
                    {lastExecution.duration_ms}ms total duration
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">Step</th>
                      <th className="p-2.5">Node Action</th>
                      <th className="p-2.5">Duration</th>
                      <th className="p-2.5">Verified Status</th>
                      <th className="p-2.5 rounded-r-lg">Output Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {lastExecution.logs?.map((step: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">
                          {step.step_index}. {step.label}
                        </td>
                        <td className="p-2.5 font-mono text-indigo-500">{step.action}</td>
                        <td className="p-2.5 text-slate-500">{step.duration_ms}ms</td>
                        <td className="p-2.5">
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <Check className="w-3.5 h-3.5" />
                            {step.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-500 truncate max-w-xs">
                          {step.output?.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Template Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-indigo-500" />
                Select Workflow Blueprint Template
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    selectedTemplateId === tpl.id
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{tpl.name}</h4>
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                      {tpl.nodes?.length || 0} Nodes
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{tpl.description}</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWorkflow}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Instantiate Pipeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
