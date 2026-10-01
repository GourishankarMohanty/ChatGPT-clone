import { AppSettings, ChatSession, AIProvider } from '../types/chat';
import { DEFAULT_SETTINGS } from '../constants/models';

const SETTINGS_KEY = 'nexus_ai_settings_v1';
const SESSIONS_KEY = 'nexus_ai_sessions_v1';
const CURRENT_SESSION_KEY = 'nexus_ai_current_session_id';

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage', e);
  }
}

export function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions to localStorage', e);
  }
}

export function loadCurrentSessionId(): string | null {
  try {
    return localStorage.getItem(CURRENT_SESSION_KEY);
  } catch {
    return null;
  }
}

export function saveCurrentSessionId(id: string): void {
  try {
    localStorage.setItem(CURRENT_SESSION_KEY, id);
  } catch {}
}

export function createNewSession(provider: AIProvider, model: string): ChatSession {
  const now = Date.now();
  return {
    id: `session_${now}_${Math.random().toString(36).substring(2, 7)}`,
    title: 'New Conversation',
    createdAt: now,
    updatedAt: now,
    messages: [],
    model,
    provider,
  };
}

export function exportSessionAsMarkdown(session: ChatSession): void {
  let md = `# ${session.title}\n`;
  md += `*Provider: ${session.provider.toUpperCase()} | Model: ${session.model} | Date: ${new Date(session.createdAt).toLocaleString()}*\n\n---\n\n`;

  for (const msg of session.messages) {
    const roleName = msg.role === 'user' ? '### User' : '### Assistant';
    md += `${roleName}\n\n`;
    if (msg.reasoning) {
      md += `> **Thinking Trace:**\n> ${msg.reasoning.split('\n').join('\n> ')}\n\n`;
    }
    md += `${msg.content}\n\n---\n\n`;
  }

  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${session.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSessionAsJson(session: ChatSession): void {
  const jsonStr = JSON.stringify(session, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${session.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
