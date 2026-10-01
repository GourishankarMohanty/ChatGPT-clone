import React from 'react';
import { GraduationCap, Sparkles, SlidersHorizontal } from 'lucide-react';
import { STUDY_QUICK_ACTIONS, STUDY_PERSONAS } from '../../constants/models';

interface StudyQuickBarProps {
  onSelectAction: (promptTemplate: string) => void;
  onOpenStudio: () => void;
  activePersonaId?: string;
}

export const StudyQuickBar: React.FC<StudyQuickBarProps> = ({
  onSelectAction,
  onOpenStudio,
  activePersonaId,
}) => {
  const activePersona = STUDY_PERSONAS.find((p) => p.id === activePersonaId);

  return (
    <div className="max-w-3xl mx-auto w-full px-3 sm:px-4 mb-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none py-1">
      {/* Study Studio Launcher */}
      <button
        onClick={onOpenStudio}
        className="px-2.5 py-1.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
        title="Open Flashcards & Practice Quiz Arena"
      >
        <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
        <span>Study Studio</span>
        <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1 rounded">
          Cards & Quiz
        </span>
      </button>

      {/* Quick Study Prompt Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {STUDY_QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => onSelectAction(action.template)}
            className="px-2.5 py-1.5 rounded-lg bg-[#242424] hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 text-xs shrink-0 transition-colors whitespace-nowrap"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Active Persona Badge if any */}
      {activePersona && (
        <div
          onClick={onOpenStudio}
          className="cursor-pointer text-[11px] text-purple-300 bg-purple-950/40 border border-purple-500/30 px-2 py-1 rounded-md flex items-center gap-1 shrink-0 whitespace-nowrap"
          title="Click to change study persona"
        >
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>{activePersona.name}</span>
        </div>
      )}
    </div>
  );
};
