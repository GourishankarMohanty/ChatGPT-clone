export type StudyPersona =
  | 'socratic'      // Socratic Tutor: Guides with questions, doesn't spoil answers
  | 'feynman'       // Feynman Technique: Simplifies with vivid real-world analogies
  | 'exam_prep'     // Strict Exam Prep: Drills edge cases, formulas, testing traps
  | 'notes_master'  // Cornell Notes & Summarizer: Structured cheat sheets
  | 'code_mentor';  // Step-by-step code mentor: algorithmic complexity & debugging

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
  topic?: string;
  mastered?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  userSelectedIndex?: number;
}

export interface StudyPlanItem {
  day: string;
  topics: string[];
  goals: string;
  duration: string;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  description: string;
  cards: Flashcard[];
  createdAt: number;
}
