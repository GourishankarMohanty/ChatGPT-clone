export type AIProvider = 'nvidia' | 'gemini';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string; // Captured reasoning/thinking trace from DeepSeek-R1 / Nemotron
  timestamp: number;
  model?: string;
  provider?: AIProvider;
  isStreaming?: boolean;
  error?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  model: string;
  provider: AIProvider;
  systemInstruction?: string;
  temperature?: number;
}

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: string;
  description: string;
  tag?: string;
  isReasoning?: boolean;
}

export interface AppSettings {
  provider: AIProvider;
  selectedModel: string;
  nvidiaApiKey: string;
  systemInstruction: string;
  temperature: number;
  maxTokens: number;
  autoScroll: boolean;
  streamResponse: boolean;
}
