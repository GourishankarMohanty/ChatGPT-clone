import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Plus,
  Settings,
  ChevronDown,
  Cpu,
  Sparkles,
  KeyRound,
  Check,
  Share2,
  GraduationCap,
} from 'lucide-react';
import { AIModel, AIProvider } from '../types/chat';
import { AVAILABLE_MODELS } from '../constants/models';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenStudyStudio?: () => void;
  selectedModelId: string;
  onSelectModel: (model: AIModel) => void;
  provider: AIProvider;
  hasNvidiaKey: boolean;
  onExport: () => void;
  isSidebarOpen: boolean;
  activePersonaId?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onNewChat,
  onOpenSettings,
  onOpenStudyStudio,
  selectedModelId,
  onSelectModel,
  provider,
  hasNvidiaKey,
  onExport,
  activePersonaId,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 border-b border-neutral-800/80 bg-[#171717]/95 backdrop-blur px-3 md:px-4 flex items-center justify-between z-20 shrink-0">
      {/* Zone 1: Brand & Sidebar Toggle */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors"
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-base text-neutral-100 tracking-tight">
            NexusAI
          </span>
          <span className="hidden sm:inline-flex text-xs px-2 py-0.5 rounded text-neutral-400 border border-neutral-700/60 bg-neutral-800/40">
            {provider === 'nvidia' ? 'NVIDIA NIM' : 'Gemini'}
          </span>
        </div>
      </div>

      {/* Zone 2: Model Selector Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors border border-neutral-700/50"
        >
          {provider === 'nvidia' ? (
            <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <span className="max-w-[150px] sm:max-w-[240px] truncate">{currentModel.name}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-0 mt-1.5 w-80 max-h-[460px] overflow-y-auto bg-[#1e1e1e] border border-neutral-700 rounded-xl shadow-2xl p-2 z-50">
            {/* NVIDIA Section */}
            <div className="px-2 py-1.5 text-[11px] font-semibold text-neutral-400 tracking-wider flex items-center justify-between">
              <span>NVIDIA NIM MODELS</span>
              {!hasNvidiaKey && (
                <span className="text-[10px] text-amber-400 font-normal">Key required</span>
              )}
            </div>

            {AVAILABLE_MODELS.filter((m) => m.provider === 'nvidia').map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  onSelectModel(m);
                  setIsDropdownOpen(false);
                }}
                className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-colors mb-1 ${
                  selectedModelId === m.id
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-300 hover:bg-neutral-800/60'
                }`}
              >
                <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold truncate">{m.name}</span>
                    {m.tag && (
                      <span className="text-[10px] text-neutral-400 shrink-0">{m.tag}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                    {m.description}
                  </p>
                </div>
                {selectedModelId === m.id && (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                )}
              </button>
            ))}

            {/* Google Gemini Section */}
            <div className="border-t border-neutral-800 my-1 pt-1.5 px-2 text-[11px] font-semibold text-neutral-400 tracking-wider">
              GOOGLE GEMINI
            </div>

            {AVAILABLE_MODELS.filter((m) => m.provider === 'gemini').map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  onSelectModel(m);
                  setIsDropdownOpen(false);
                }}
                className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 transition-colors ${
                  selectedModelId === m.id
                    ? 'bg-neutral-800 text-white'
                    : 'text-neutral-300 hover:bg-neutral-800/60'
                }`}
              >
                <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold truncate">{m.name}</span>
                    <span className="text-[10px] text-neutral-400 shrink-0">{m.tag}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                    {m.description}
                  </p>
                </div>
                {selectedModelId === m.id && (
                  <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {onOpenStudyStudio && (
          <button
            onClick={onOpenStudyStudio}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-xs"
            title="Open AI Study Buddy Studio (Flashcards, Quizzes, Socratic Tutor)"
          >
            <GraduationCap className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Study Studio</span>
          </button>
        )}

        <button
          onClick={onNewChat}
          className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1 text-xs"
          title="New conversation"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New</span>
        </button>

        <button
          onClick={onExport}
          className="p-1.5 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          title="Export conversation"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettings}
          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs ${
            provider === 'nvidia' && !hasNvidiaKey
              ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40'
              : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
          }`}
          title="Settings and API Keys"
        >
          {provider === 'nvidia' && !hasNvidiaKey ? (
            <>
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline font-medium">Add NVIDIA Key</span>
            </>
          ) : (
            <Settings className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
};
