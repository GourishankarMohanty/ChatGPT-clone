import React from 'react';
import { Cpu, Sparkles, ArrowRight, ShieldCheck, GraduationCap, Layers, CheckSquare } from 'lucide-react';
import { PROMPT_STARTERS } from '../constants/models';
import { AIModel, AIProvider } from '../types/chat';

interface EmptyStateProps {
  currentModel: AIModel;
  provider: AIProvider;
  hasNvidiaKey: boolean;
  onSelectPrompt: (prompt: string) => void;
  onOpenSettings: () => void;
  onOpenStudyStudio?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  currentModel,
  provider,
  hasNvidiaKey,
  onSelectPrompt,
  onOpenSettings,
  onOpenStudyStudio,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-3xl mx-auto w-full my-auto text-center">
      {/* Brand Icon & Heading */}
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600/30 to-teal-400/20 border border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400 shadow-inner">
        {provider === 'nvidia' ? (
          <Cpu className="w-6 h-6 text-emerald-400" />
        ) : (
          <Sparkles className="w-6 h-6 text-blue-400" />
        )}
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100 mb-2">
        What would you like to build or explore?
      </h1>
      <p className="text-sm text-neutral-400 max-w-md mb-6 leading-relaxed">
        Powered by {provider === 'nvidia' ? 'NVIDIA NIM Microservices' : 'Google Gemini'} with{' '}
        <span className="text-neutral-200 font-medium">{currentModel.name}</span>.
      </p>

      {/* AI Study Buddy Feature Hero Card */}
      {onOpenStudyStudio && (
        <div className="w-full max-w-2xl mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-neutral-900 to-teal-950/30 border border-emerald-500/40 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <span>AI Study Buddy Hub</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
                  New
                </span>
              </div>
              <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
                Interactive active recall flashcards, instant practice quizzes, and Socratic tutoring.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenStudyStudio}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
          >
            <span>Open Study Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* NVIDIA Key Alert Callout if needed */}
      {provider === 'nvidia' && !hasNvidiaKey && (
        <div className="w-full max-w-lg mb-6 p-3 rounded-xl bg-amber-950/30 border border-amber-500/40 text-left flex items-start justify-between gap-3 text-xs">
          <div>
            <div className="font-semibold text-amber-300 mb-0.5">
              NVIDIA API Key Recommended
            </div>
            <p className="text-amber-200/80 leading-relaxed">
              Add your free NVIDIA API key from build.nvidia.com to access Llama 3.3, DeepSeek-R1, and Nemotron models.
            </p>
          </div>
          <button
            onClick={onOpenSettings}
            className="shrink-0 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold rounded-lg text-xs transition-colors"
          >
            Add Key
          </button>
        </div>
      )}

      {/* Prompt Starters Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
        {PROMPT_STARTERS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => onSelectPrompt(item.prompt)}
            className="p-3.5 rounded-xl border border-neutral-800 bg-[#1c1c1c]/70 hover:bg-neutral-800/80 hover:border-neutral-700 transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="text-[11px] font-medium text-emerald-400 mb-1">
                {item.category}
              </div>
              <div className="text-sm font-semibold text-neutral-200 group-hover:text-white mb-1">
                {item.title}
              </div>
              <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                {item.prompt}
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-neutral-400 group-hover:text-neutral-300 mt-3 pt-2 border-t border-neutral-800/60 font-medium">
              <span>Send prompt</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>

      {/* Subtle trust badge */}
      <div className="mt-8 flex items-center gap-2 text-xs text-neutral-400">
        <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
        <span>Keys stored locally in your browser session</span>
      </div>
    </div>
  );
};
