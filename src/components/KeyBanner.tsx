import React from 'react';
import { KeyRound, Sparkles, X } from 'lucide-react';

interface KeyBannerProps {
  onOpenSettings: () => void;
  onSwitchToGemini: () => void;
  onDismiss: () => void;
}

export const KeyBanner: React.FC<KeyBannerProps> = ({
  onOpenSettings,
  onSwitchToGemini,
  onDismiss,
}) => {
  return (
    <div className="bg-gradient-to-r from-emerald-950/60 via-neutral-900 to-emerald-950/40 border-b border-emerald-500/30 px-4 py-2 flex items-center justify-between gap-3 text-xs text-neutral-200 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="truncate">
          Running with <strong>NVIDIA NIM</strong>. Add your API key from <a href="https://build.nvidia.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-medium">build.nvidia.com</a> or switch to built-in Gemini.
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenSettings}
          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors"
        >
          Enter Key
        </button>
        <button
          onClick={onSwitchToGemini}
          className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded font-medium transition-colors flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3 text-blue-400" />
          <span className="hidden sm:inline">Use Gemini</span>
        </button>
        <button
          onClick={onDismiss}
          className="p-1 hover:text-white text-neutral-400 transition-colors"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
