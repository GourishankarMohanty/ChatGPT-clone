import React, { useState } from 'react';
import {
  X,
  Key,
  Cpu,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { AppSettings, AIModel } from '../types/chat';
import { AVAILABLE_MODELS } from '../constants/models';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onClearAllSessions: () => void;
  availableModels: AIModel[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onClearAllSessions,
}) => {
  const [form, setForm] = useState<AppSettings>(settings);
  const [showKey, setShowKey] = useState(false);
  const [activeTab, setActiveTab] = useState<'api' | 'parameters' | 'data'>('api');

  // Key verification status state
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<{
    tested: boolean;
    valid?: boolean;
    message?: string;
    modelCount?: number;
  }>({ tested: false });

  if (!isOpen) return null;

  const handleVerifyNvidiaKey = async () => {
    if (!form.nvidiaApiKey.trim()) {
      setVerifyStatus({
        tested: true,
        valid: false,
        message: 'Please enter an NVIDIA API key first.',
      });
      return;
    }

    setVerifying(true);
    setVerifyStatus({ tested: false });

    try {
      const res = await fetch('/api/nvidia/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: form.nvidiaApiKey.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setVerifyStatus({
          tested: true,
          valid: true,
          message: data.message || 'Key verified successfully!',
          modelCount: data.models ? data.models.length : undefined,
        });
      } else {
        setVerifyStatus({
          tested: true,
          valid: false,
          message: data.error || 'Failed to verify key with NVIDIA endpoint.',
        });
      }
    } catch (e: any) {
      setVerifyStatus({
        tested: true,
        valid: false,
        message: e.message || 'Network error verifying NVIDIA API key.',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = () => {
    onSaveSettings(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#1e1e1e] border border-neutral-700/80 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-neutral-100">
              Settings & Integrations
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-neutral-800 px-5 bg-neutral-900/40">
          <button
            onClick={() => setActiveTab('api')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'api'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>NVIDIA & AI Providers</span>
          </button>
          <button
            onClick={() => setActiveTab('parameters')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'parameters'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Model Parameters</span>
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'data'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Data Management</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'api' && (
            <div className="space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Active AI Provider
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        provider: 'nvidia',
                        selectedModel: 'meta/llama-3.3-70b-instruct',
                      }));
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      form.provider === 'nvidia'
                        ? 'border-emerald-500 bg-emerald-950/20 text-white'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold">NVIDIA NIM</div>
                      <div className="text-[11px] text-neutral-400">
                        Llama 3.3, DeepSeek-R1, Nemotron
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        provider: 'gemini',
                        selectedModel: 'gemini-3.8-flash',
                      }));
                    }}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      form.provider === 'gemini'
                        ? 'border-blue-500 bg-blue-950/20 text-white'
                        : 'border-neutral-800 bg-neutral-900/60 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold">Google Gemini</div>
                      <div className="text-[11px] text-neutral-400">
                        Gemini 3.8 Flash (Built-in)
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* NVIDIA API Key Field */}
              <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold text-neutral-200">
                      NVIDIA API Key
                    </span>
                  </div>
                  <a
                    href="https://build.nvidia.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>Get Key from build.nvidia.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Enter your NVIDIA API key (starts with <code className="text-neutral-300">nvapi-...</code>).
                  NVIDIA provides 1,000 free inference credits on registration.
                </p>

                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={form.nvidiaApiKey}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, nvidiaApiKey: e.target.value }));
                      setVerifyStatus({ tested: false });
                    }}
                    placeholder="nvapi-xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-3 py-2 pr-10 bg-neutral-950 text-neutral-100 placeholder-neutral-400 text-xs font-mono rounded-lg border border-neutral-700 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Key Action & Verification */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleVerifyNvidiaKey}
                    disabled={verifying || !form.nvidiaApiKey.trim()}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      verifying || !form.nvidiaApiKey.trim()
                        ? 'bg-neutral-800 text-neutral-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {verifying ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Test & Verify Key</span>
                      </>
                    )}
                  </button>

                  {verifyStatus.tested && (
                    <div
                      className={`text-xs flex items-center gap-1 ${
                        verifyStatus.valid ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {verifyStatus.valid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            Verified! {verifyStatus.modelCount ? `(${verifyStatus.modelCount} models)` : ''}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span className="max-w-[200px] truncate">{verifyStatus.message}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'parameters' && (
            <div className="space-y-4">
              {/* Default Model */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Default Model
                </label>
                <select
                  value={form.selectedModel}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, selectedModel: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-emerald-500"
                >
                  {AVAILABLE_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* System Instruction / Persona */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  System Instructions
                </label>
                <textarea
                  value={form.systemInstruction}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, systemInstruction: e.target.value }))
                  }
                  rows={3}
                  placeholder="You are an expert software engineer and AI assistant..."
                  className="w-full p-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-xs text-neutral-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-neutral-300">
                    Temperature (Creativity)
                  </label>
                  <span className="text-xs font-mono text-emerald-400">
                    {form.temperature.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.5"
                  step="0.05"
                  value={form.temperature}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      temperature: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 mt-0.5">
                  <span>0.0 (Precise / Code)</span>
                  <span>0.7 (Balanced)</span>
                  <span>1.5 (Creative)</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-neutral-300">
                    Max Output Tokens
                  </label>
                  <span className="text-xs font-mono text-emerald-400">
                    {form.maxTokens} tokens
                  </span>
                </div>
                <input
                  type="range"
                  min="512"
                  max="8192"
                  step="256"
                  value={form.maxTokens}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      maxTokens: parseInt(e.target.value, 10),
                    }))
                  }
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                <div className="text-xs font-semibold text-neutral-200">
                  Local Conversation Storage
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  All messages, session logs, and API settings are securely kept in your local browser cache (`localStorage`).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all chat histories? This cannot be undone.')) {
                      onClearAllSessions();
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All Chat History</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-neutral-800 bg-neutral-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
