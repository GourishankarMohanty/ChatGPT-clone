import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  Layers,
  CheckSquare,
  Sparkles,
  BookOpen,
  ArrowRight,
  Check,
} from 'lucide-react';
import { FlashcardsArena } from './FlashcardsArena';
import { QuizArena } from './QuizArena';
import { AIProvider } from '../../types/chat';
import { STUDY_PERSONAS } from '../../constants/models';

interface StudyStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: AIProvider;
  model: string;
  nvidiaApiKey?: string;
  onSelectPersona: (personaId: string, systemInstruction: string) => void;
  activePersonaId?: string;
  onSendToChat: (prompt: string) => void;
}

export const StudyStudioModal: React.FC<StudyStudioModalProps> = ({
  isOpen,
  onClose,
  provider,
  model,
  nvidiaApiKey,
  onSelectPersona,
  activePersonaId,
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<'flashcards' | 'quiz' | 'personas'>('flashcards');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#1c1c1c] border border-neutral-750 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-[#212121]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-neutral-100 flex items-center gap-1.5">
                <span>AI Study Buddy Studio</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  Interactive
                </span>
              </h2>
              <p className="text-[11px] text-neutral-400">
                Active Recall Flashcards, Practice Tests, and Socratic Tutoring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-800 px-5 bg-neutral-900/60">
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'flashcards'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Recall Flashcards</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'quiz'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
            <span>Practice Quiz Arena</span>
          </button>

          <button
            onClick={() => setActiveTab('personas')}
            className={`py-2.5 px-3.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'personas'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
            <span>Tutor Personas</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {activeTab === 'flashcards' && (
            <FlashcardsArena
              provider={provider}
              model={model}
              nvidiaApiKey={nvidiaApiKey}
              onSendToChat={(prompt) => {
                onClose();
                onSendToChat(prompt);
              }}
            />
          )}

          {activeTab === 'quiz' && (
            <QuizArena
              provider={provider}
              model={model}
              nvidiaApiKey={nvidiaApiKey}
              onSendToChat={(prompt) => {
                onClose();
                onSendToChat(prompt);
              }}
            />
          )}

          {activeTab === 'personas' && (
            <div className="space-y-4">
              <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-xs text-neutral-300">
                <p>
                  Choose a specialized tutor persona to guide your study session. The AI will
                  adapt its teaching pedagogy, formatting, and questioning style to maximize retention.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {STUDY_PERSONAS.map((persona) => {
                  const isActive = activePersonaId === persona.id;
                  return (
                    <div
                      key={persona.id}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        isActive
                          ? 'border-emerald-500/80 bg-emerald-950/20'
                          : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-neutral-100">
                            {persona.name}
                          </span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded font-mono">
                            {persona.badge}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 leading-relaxed max-w-lg">
                          {persona.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            onSelectPersona(persona.id, persona.systemInstruction);
                            onClose();
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                            isActive
                              ? 'bg-emerald-600 text-white'
                              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Select Persona</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-800 bg-[#212121] text-xs text-neutral-400">
          <span>Tips: Use Socratic Tutor mode to prepare for technical interviews and exams.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
