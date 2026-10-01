import { AIModel } from '../types/chat';

export const AVAILABLE_MODELS: AIModel[] = [
  // NVIDIA NIM Models
  {
    id: 'meta/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    provider: 'nvidia',
    contextWindow: '128k tokens',
    description: "Meta's flagship versatile open model with state-of-the-art reasoning and coding capabilities.",
    tag: 'Recommended',
  },
  {
    id: 'deepseek-ai/deepseek-r1',
    name: 'DeepSeek-R1',
    provider: 'nvidia',
    contextWindow: '64k tokens',
    description: 'Premier deep reasoning model that surfaces chain-of-thought mathematical & logical deduction.',
    tag: 'Deep Reasoning',
    isReasoning: true,
  },
  {
    id: 'nvidia/llama-3.1-nemotron-70b-instruct',
    name: 'Llama 3.1 Nemotron 70B',
    provider: 'nvidia',
    contextWindow: '128k tokens',
    description: "NVIDIA's customized model optimized for helpfulness, math, and factual alignment.",
    tag: 'NVIDIA Tuned',
  },
  {
    id: 'nvidia/nemotron-4-340b-instruct',
    name: 'Nemotron-4 340B Instruct',
    provider: 'nvidia',
    contextWindow: '4k tokens',
    description: "NVIDIA's massive frontier foundational LLM for synthetic data and complex reasoning.",
    tag: 'Frontier 340B',
  },
  {
    id: 'meta/llama-3.1-405b-instruct',
    name: 'Llama 3.1 405B Instruct',
    provider: 'nvidia',
    contextWindow: '128k tokens',
    description: 'The largest open weights model available, rivaling the top closed frontier systems.',
    tag: 'Flagship 405B',
  },
  {
    id: 'qwen/qwen2.5-72b-instruct',
    name: 'Qwen 2.5 72B Instruct',
    provider: 'nvidia',
    contextWindow: '128k tokens',
    description: 'World-class performance across coding, mathematics, and multilingual reasoning.',
    tag: 'STEM & Code',
  },
  {
    id: 'mistralai/mixtral-8x22b-instruct-v0.1',
    name: 'Mixtral 8x22B Instruct',
    provider: 'nvidia',
    contextWindow: '64k tokens',
    description: 'High-throughput Mixture-of-Experts architecture delivering rapid, nuanced outputs.',
    tag: 'MoE Architecture',
  },
  {
    id: 'meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    provider: 'nvidia',
    contextWindow: '128k tokens',
    description: 'Lightning-fast lightweight model ideal for instant responses and micro-tasks.',
    tag: 'Fast & Agile',
  },

  // Google Gemini Models (Built-in Server Provider)
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    provider: 'gemini',
    contextWindow: '1M tokens',
    description: 'Google’s latest fast multimodal model with huge context window and real-time generation.',
    tag: 'Built-in Provider',
  },
];

export const DEFAULT_SETTINGS = {
  provider: 'nvidia' as const,
  selectedModel: 'meta/llama-3.3-70b-instruct',
  nvidiaApiKey: '',
  systemInstruction: 'You are an intelligent, precise, and helpful AI assistant. Provide thorough, well-reasoned answers formatted in clean Markdown with code blocks where appropriate.',
  temperature: 0.7,
  maxTokens: 4096,
  autoScroll: true,
  streamResponse: true,
};

export const STUDY_PERSONAS = [
  {
    id: 'socratic',
    name: 'Socratic Tutor',
    description: 'Guides you with targeted probing questions without spoiling the final answer directly.',
    badge: 'Step-by-step',
    systemInstruction:
      'You are a master Socratic Study Buddy. Do NOT give away direct answers immediately. Instead, analyze the student\'s question, praise good intuition, explain the core principle, and ask a single guided question or hint to prompt the student to think through the next logical step.',
  },
  {
    id: 'feynman',
    name: 'Feynman Simplifier',
    description: 'Breaks complex concepts down into plain English with vivid analogies and zero jargon.',
    badge: 'ELI5 & Analogies',
    systemInstruction:
      'You are Richard Feynman as a peer study buddy. Explain every concept using crystal-clear language, vivid everyday physical analogies, intuitive mental models, and zero unnecessary jargon. Test if the concept makes intuitive sense.',
  },
  {
    id: 'exam_prep',
    name: 'Exam Drill & Traps',
    description: 'Hardcore exam prep pointing out tricky edge cases, common traps, and testing shortcuts.',
    badge: 'Exam Mode',
    systemInstruction:
      'You are a rigorous exam prep coach. Provide high-yield breakdowns, highlight the #1 most common mistakes students make on exams, point out testing traps, and provide rapid-fire conceptual checks.',
  },
  {
    id: 'notes_master',
    name: 'Cornell Notes Generator',
    description: 'Structures any topic or lecture into Cornell Notes with cues, notes, and a 2-sentence summary.',
    badge: 'Cornell Style',
    systemInstruction:
      'You are an expert study note architect. Format all outputs into structured Cornell Notes with: 1) Cue / Key Questions column, 2) Comprehensive Main Notes, and 3) A high-impact 2-sentence Summary at the bottom.',
  },
  {
    id: 'code_mentor',
    name: 'CS & Code Mentor',
    description: 'Focuses on time/space complexity, algorithmic intuition, and clean idiomatic code.',
    badge: 'Algorithms & Dev',
    systemInstruction:
      'You are an elite Computer Science TA and mentor. Break down algorithms with ASCII diagrams, explain Big-O time and space complexity, discuss edge cases, and guide the student toward clean, optimal implementations.',
  },
];

export const STUDY_QUICK_ACTIONS = [
  {
    id: 'test_me',
    label: '🧠 Test My Knowledge',
    template: 'Test my knowledge on this topic. Ask me 3 challenging questions one at a time, and wait for my response before grading each one.',
  },
  {
    id: 'explain_eli5',
    label: '💡 Explain Simply',
    template: 'Explain this concept as simply as possible with a relatable real-world analogy (ELI5). What is the core intuition?',
  },
  {
    id: 'cornell_notes',
    label: '📑 Cornell Notes',
    template: 'Turn this topic into structured Cornell Notes format with Key Cues, Detailed Notes, and a concise Summary.',
  },
  {
    id: 'common_mistakes',
    label: '⚠️ Common Traps',
    template: 'What are the top 3 most common mistakes or exam traps students make when dealing with this topic, and how do I avoid them?',
  },
];

export const PROMPT_STARTERS = [
  {
    category: 'Engineering & Code',
    title: 'NVIDIA GPU Acceleration',
    prompt: 'Write an optimized Python script demonstrating batch inference on NVIDIA GPUs using PyTorch with mixed precision (fp16 / bf16) and CUDA streams.',
  },
  {
    category: 'Reasoning & Logic',
    title: 'Deep Logical Proof',
    prompt: 'Solve and explain step-by-step: A boat moves with speed v relative to water in a river of speed u. Calculate the time to complete a round trip upstream and downstream versus across and back.',
  },
  {
    category: 'Architecture & Design',
    title: 'Distributed System Design',
    prompt: 'Design a resilient real-time chat architecture capable of supporting 1,000,000 concurrent WebSocket connections with message ordering and fault tolerance.',
  },
  {
    category: 'Writing & Analysis',
    title: 'Executive Technical Brief',
    prompt: 'Draft an executive briefing analyzing the key trade-offs between hosting open-source LLMs on NVIDIA NIM microservices versus proprietary SaaS APIs.',
  },
];
