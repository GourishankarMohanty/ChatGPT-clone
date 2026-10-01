import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  RotateCw,
  Sparkles,
  Trophy,
  ArrowRight,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { QuizQuestion } from '../../types/study';
import { AIProvider } from '../../types/chat';

interface QuizArenaProps {
  provider: AIProvider;
  model: string;
  nvidiaApiKey?: string;
  onSendToChat?: (text: string) => void;
}

const DEFAULT_QUIZ: QuizQuestion[] = [
  {
    id: 'q1',
    question: 'In deep neural network training, what is the primary benefit of FP16/BF16 mixed precision on modern NVIDIA GPUs?',
    options: [
      'It increases parameter count without requiring more RAM',
      'It leverages Tensor Cores for 2-4x higher compute throughput while halving memory bandwidth demands',
      'It completely removes the need for backpropagation gradients',
      'It makes models inherently immune to overfitting',
    ],
    correctIndex: 1,
    explanation:
      'Mixed precision leverages specialized Tensor Core hardware instructions (FP16/BF16 MMA) which execute much faster than FP32, while also slashing VRAM footprint and memory bandwidth bottlenecks by 50%.',
  },
  {
    id: 'q2',
    question: 'When analyzing asymptotic Big-O runtime, what is the worst-case time complexity of QuickSort?',
    options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'],
    correctIndex: 2,
    explanation:
      'While QuickSort has an average runtime of O(n log n), its worst-case occurs when the pivot chosen is consistently the smallest or largest element (e.g., on already sorted data with naive pivot selection), leading to O(n²) comparisons.',
  },
  {
    id: 'q3',
    question: 'Which of the following is true regarding Socratic dialogue in academic learning?',
    options: [
      'The instructor lectures continuously without student participation',
      'The tutor leads with guided questions that prompt the student to expose logical contradictions and deduce the solution',
      'It relies purely on rote memorization drills without conceptual reasoning',
      'Answers are directly provided before the question is contemplated',
    ],
    correctIndex: 1,
    explanation:
      'The Socratic method fosters critical thinking through collaborative dialogue and targeted questioning, guiding the student to discover truths through their own deductive reasoning.',
  },
  {
    id: 'q4',
    question: 'In computer networking, why does TCP guarantee reliable in-order delivery while UDP does not?',
    options: [
      'TCP uses sequence numbers, acknowledgments (ACKs), and retransmissions to track and reconstruct packet streams',
      'TCP physically reserves a dedicated wire between sender and receiver',
      'UDP encrypts packets so routers cannot read their destination order',
      'TCP operates exclusively on local area networks (LANs)',
    ],
    correctIndex: 0,
    explanation:
      'TCP is a connection-oriented protocol that numbers each byte of payload, requiring explicit acknowledgments and timer-based retransmission of dropped packets to guarantee delivery and order.',
  },
];

export const QuizArena: React.FC<QuizArenaProps> = ({
  provider,
  model,
  nvidiaApiKey,
  onSendToChat,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(DEFAULT_QUIZ);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [topicInput, setTopicInput] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [errorMsg, setErrorMsg] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  const currentQ = questions[currentIdx] || questions[0];
  const userSelection = selectedAnswers[currentIdx];
  const isAnswered = typeof userSelection === 'number';

  // Calculate score
  const totalQuestions = questions.length;
  const correctCount = questions.reduce((acc, q, idx) => {
    return acc + (selectedAnswers[idx] === q.correctIndex ? 1 : 0);
  }, 0);

  const handleSelectOption = (optionIdx: number) => {
    if (isAnswered) return; // Prevent changing after answered
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIdx]: optionIdx,
    }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleRestart = () => {
    setSelectedAnswers({});
    setCurrentIdx(0);
    setIsCompleted(false);
  };

  const handleGenerateQuiz = async () => {
    if (!topicInput.trim()) return;
    setIsGenerating(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/study/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicInput.trim(),
          count: 5,
          difficulty,
          provider,
          model,
          nvidiaApiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate quiz.');
      }

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setSelectedAnswers({});
        setCurrentIdx(0);
        setIsCompleted(false);
        setTopicInput('');
      } else {
        throw new Error('No quiz questions returned from model.');
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
            <span>Generate Practice Test with AI</span>
          </label>
          <div className="flex items-center gap-1 bg-neutral-850 p-0.5 rounded border border-neutral-750">
            {(['Easy', 'Medium', 'Hard'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setDifficulty(lvl)}
                className={`px-2 py-0.5 rounded text-[10.5px] font-medium transition-colors ${
                  difficulty === lvl
                    ? 'bg-neutral-700 text-white shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateQuiz()}
            placeholder="Enter exam or subject topic (e.g. AP Microeconomics, Quantum Physics, Docker & Kubernetes)..."
            className="flex-1 bg-neutral-950 text-xs text-neutral-100 placeholder-neutral-500 px-3 py-2 rounded-lg border border-neutral-700/80 focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleGenerateQuiz}
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
                <span>Building...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Create Quiz</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="text-xs text-rose-400 bg-rose-950/30 p-2 rounded border border-rose-800/40">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Completion View */}
      {isCompleted ? (
        <div className="p-8 text-center bg-gradient-to-b from-neutral-900 to-[#191919] border border-neutral-700/80 rounded-2xl shadow-xl space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Quiz Finished!</h3>
            <p className="text-xs text-neutral-400">
              You scored{' '}
              <span className="font-semibold text-emerald-400 text-sm font-mono">
                {correctCount}
              </span>{' '}
              out of <span className="font-semibold text-white">{totalQuestions}</span> (
              {Math.round((correctCount / totalQuestions) * 100)}%)
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleRestart}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Retry Quiz</span>
            </button>
            {onSendToChat && (
              <button
                onClick={() => {
                  onSendToChat(
                    `I scored ${correctCount}/${totalQuestions} on this study quiz. Can you analyze the concepts I might have missed and give me targeted study tips?`
                  );
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discuss in Chat</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Active Question Card */
        <div className="p-5 bg-neutral-900/90 border border-neutral-750 rounded-2xl shadow-lg space-y-4">
          {/* Question Header & Indicator */}
          <div className="flex items-center justify-between text-xs text-neutral-400 border-b border-neutral-800 pb-2.5">
            <span className="font-mono font-medium text-emerald-400">
              QUESTION {currentIdx + 1} OF {questions.length}
            </span>
            <div className="flex gap-1">
              {questions.map((_, i) => {
                const ans = selectedAnswers[i];
                const isCurrent = i === currentIdx;
                let bg = 'bg-neutral-800';
                if (typeof ans === 'number') {
                  bg = ans === questions[i].correctIndex ? 'bg-emerald-500' : 'bg-rose-500';
                } else if (isCurrent) {
                  bg = 'bg-neutral-400';
                }
                return <div key={i} className={`w-3.5 h-1.5 rounded-full ${bg}`} />;
              })}
            </div>
          </div>

          {/* Question Title */}
          <h4 className="text-sm sm:text-base font-semibold text-neutral-100 leading-snug">
            {currentQ.question}
          </h4>

          {/* 4 Multiple Choice Options */}
          <div className="space-y-2">
            {currentQ.options.map((option, optIdx) => {
              const isSelected = userSelection === optIdx;
              const isCorrect = optIdx === currentQ.correctIndex;

              let style =
                'bg-neutral-950/80 hover:bg-neutral-800/80 border-neutral-800 text-neutral-300';

              if (isAnswered) {
                if (isCorrect) {
                  style =
                    'bg-emerald-950/50 border-emerald-500/80 text-emerald-200 font-medium';
                } else if (isSelected && !isCorrect) {
                  style = 'bg-rose-950/50 border-rose-500/80 text-rose-200';
                } else {
                  style = 'bg-neutral-950/40 border-neutral-850 text-neutral-500 opacity-60';
                }
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={isAnswered}
                  className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition-all ${style}`}
                >
                  <span className="w-5 h-5 rounded-full border border-neutral-700/80 flex items-center justify-center text-[11px] font-mono shrink-0 mt-0.5">
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span className="flex-1 leading-relaxed">{option}</span>

                  {isAnswered && isCorrect && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {isAnswered && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Banner (Shows once answered) */}
          {isAnswered && (
            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1.5 animate-fadeIn">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Concept Explanation</span>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Next Button */}
          {isAnswered && (
            <div className="flex justify-end pt-1">
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <span>{currentIdx < questions.length - 1 ? 'Next Question' : 'View Results'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
