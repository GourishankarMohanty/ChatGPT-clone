import React, { useState } from 'react';
import {
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Plus,
} from 'lucide-react';
import { Flashcard } from '../../types/study';
import { AIProvider } from '../../types/chat';

interface FlashcardsArenaProps {
  provider: AIProvider;
  model: string;
  nvidiaApiKey?: string;
  onSendToChat?: (text: string) => void;
}

const DEFAULT_DECK: Flashcard[] = [
  {
    id: '1',
    topic: 'GPU Architecture & Deep Learning',
    question: 'What is the role of Tensor Cores in modern NVIDIA GPUs (e.g., Hopper / Blackwell)?',
    answer: 'Tensor Cores are specialized hardware execution units designed specifically to perform mixed-precision matrix multiply-accumulate (MMA) calculations (D = A * B + C) in a single clock cycle, dramatically speeding up transformer and LLM training and inference.',
    hint: 'Think: Matrix Multiplication (GEMM) hardware acceleration.',
  },
  {
    id: '2',
    topic: 'Data Structures & Algorithms',
    question: 'Why does a Hash Table have an average O(1) time complexity but worst-case O(n)?',
    answer: 'Average case is O(1) assuming a uniform hash distribution with minimal collisions. Worst-case is O(n) if all keys hash to the same bucket, causing the internal bucket structure (linked list) to require linear search.',
    hint: 'Think about hash collision resolution via chaining.',
  },
  {
    id: '3',
    topic: 'Machine Learning',
    question: 'What is the difference between Self-Attention and Cross-Attention in Transformer models?',
    answer: 'Self-Attention computes attention weights between tokens within the same sequence (Query, Key, Value all come from the same source). Cross-Attention allows one sequence to attend to another (e.g., Queries come from the decoder, while Keys and Values come from the encoder).',
    hint: 'Decoder attending to Encoder output vs sequence attending to itself.',
  },
  {
    id: '4',
    topic: 'Operating Systems',
    question: 'What is the difference between a Process and a Thread in modern OS architecture?',
    answer: 'A Process is an independent execution unit with its own private virtual address space and isolated system resources. A Thread is a lightweight segment of a process that shares the parent process\'s memory, code, and file descriptors with other threads.',
    hint: 'Memory address space isolation vs shared heap/code segment.',
  },
];

export const FlashcardsArena: React.FC<FlashcardsArenaProps> = ({
  provider,
  model,
  nvidiaApiKey,
  onSendToChat,
}) => {
  const [cards, setCards] = useState<Flashcard[]>(DEFAULT_DECK);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [topicInput, setTopicInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currentCard = cards[currentIndex] || cards[0];
  const masteredCount = cards.filter((c) => c.mastered).length;
  const progressPercent = Math.round((masteredCount / cards.length) * 100);

  const handleNext = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setShowHint(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  };

  const toggleMastered = () => {
    setCards((prev) =>
      prev.map((c, idx) =>
        idx === currentIndex ? { ...c, mastered: !c.mastered } : c
      )
    );
  };

  const handleGenerateDeck = async () => {
    if (!topicInput.trim()) return;
    setIsGenerating(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/study/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicInput.trim(),
          count: 6,
          provider,
          model,
          nvidiaApiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate flashcards.');
      }

      if (data.cards && data.cards.length > 0) {
        setCards(data.cards);
        setCurrentIndex(0);
        setIsFlipped(false);
        setShowHint(false);
        setTopicInput('');
      } else {
        throw new Error('No flashcards returned from model.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Generation failed. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Generator Bar */}
      <div className="p-3 bg-neutral-900/90 rounded-xl border border-neutral-800 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Generate Flashcard Deck with AI</span>
          </label>
          <span className="text-[11px] text-neutral-400">
            Powered by {provider === 'nvidia' ? 'NVIDIA NIM' : 'Gemini'}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateDeck()}
            placeholder="Enter any topic (e.g. Organic Chemistry Reactions, React Fiber Architecture, Calculus Derivatives)..."
            className="flex-1 bg-neutral-950 text-xs text-neutral-100 placeholder-neutral-500 px-3 py-2 rounded-lg border border-neutral-700/80 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleGenerateDeck}
            disabled={isGenerating || !topicInput.trim()}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              isGenerating || !topicInput.trim()
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
            }`}
          >
            {isGenerating ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Generate</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="text-xs text-rose-400 bg-rose-950/30 p-2 rounded border border-rose-800/40">
            {errorMsg}
          </div>
        )}

        {/* Preset quick suggestions */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px] text-neutral-400">
          <span>Try:</span>
          {['Python AsyncIO & GIL', 'Photosynthesis Light Reactions', 'Linear Algebra Eigenvalues', 'System Design Caching'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => {
                setTopicInput(suggestion);
              }}
              className="text-neutral-300 hover:text-emerald-400 bg-neutral-800/60 px-2 py-0.5 rounded text-[10.5px] border border-neutral-700/40 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Progress & Deck Status */}
      <div className="flex items-center justify-between px-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-200">
            Card {currentIndex + 1} of {cards.length}
          </span>
          {currentCard?.topic && (
            <span className="text-neutral-400">· {currentCard.topic}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-neutral-400">
          <span>Mastery:</span>
          <span className="font-mono text-emerald-400 font-semibold">
            {masteredCount}/{cards.length} ({progressPercent}%)
          </span>
        </div>
      </div>

      {/* Interactive Flashcard with Flip Animation */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer select-none perspective-1000 min-h-[220px] sm:min-h-[250px] relative rounded-2xl border border-neutral-700/80 bg-gradient-to-b from-[#242424] to-[#1c1c1c] p-6 flex flex-col justify-between shadow-xl hover:border-neutral-600 transition-all group"
      >
        {/* Card Header */}
        <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-800 pb-2.5">
          <span className="font-mono font-medium tracking-wider text-emerald-400">
            {isFlipped ? 'ANSWER (REVEALED)' : 'QUESTION (TAP TO FLIP)'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMastered();
            }}
            className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${
              currentCard.mastered
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>{currentCard.mastered ? 'Mastered' : 'Mark Mastered'}</span>
          </button>
        </div>

        {/* Card Body */}
        <div className="my-auto py-4 text-center">
          <p className="text-base sm:text-lg font-medium text-neutral-100 leading-relaxed max-w-xl mx-auto">
            {isFlipped ? currentCard.answer : currentCard.question}
          </p>

          {/* Hint view */}
          {showHint && currentCard.hint && !isFlipped && (
            <div className="mt-3 p-2 bg-neutral-900/90 rounded-lg text-xs text-amber-300/90 border border-amber-500/30 inline-flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>Hint: {currentCard.hint}</span>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            {currentCard.hint && !isFlipped && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHint(!showHint);
                }}
                className="hover:text-amber-400 flex items-center gap-1 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{showHint ? 'Hide Hint' : 'Show Hint'}</span>
              </button>
            )}
          </div>
          <span className="text-[11px]">Click or tap card to flip</span>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={handlePrev}
          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Card</span>
        </button>

        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="px-4 py-1.5 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors border border-neutral-700/60"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Flip Card</span>
        </button>

        <button
          onClick={handleNext}
          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
        >
          <span>Next Card</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
