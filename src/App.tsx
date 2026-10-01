import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { EmptyState } from './components/EmptyState';
import { SettingsModal } from './components/SettingsModal';
import { KeyBanner } from './components/KeyBanner';
import { StudyStudioModal } from './components/study/StudyStudioModal';
import { StudyQuickBar } from './components/study/StudyQuickBar';
import { ChatSession, ChatMessage as ChatMessageType, AIModel } from './types/chat';
import { AVAILABLE_MODELS, STUDY_PERSONAS } from './constants/models';
import {
  loadSettings,
  saveSettings,
  loadSessions,
  saveSessions,
  loadCurrentSessionId,
  saveCurrentSessionId,
  createNewSession,
  exportSessionAsMarkdown,
} from './utils/storage';

export default function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const loaded = loadSessions();
    if (loaded.length > 0) return loaded;
    const initial = createNewSession(settings.provider, settings.selectedModel);
    return [initial];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    const savedId = loadCurrentSessionId();
    if (savedId && sessions.some((s) => s.id === savedId)) return savedId;
    return sessions[0]?.id || '';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStudyStudioOpen, setIsStudyStudioOpen] = useState(false);
  const [activePersonaId, setActivePersonaId] = useState<string>('socratic');
  const [isStreaming, setIsStreaming] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [serverHasNvidiaKey, setServerHasNvidiaKey] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync settings & sessions to localStorage
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveSessions(sessions);
  }, [sessions]);

  useEffect(() => {
    if (currentSessionId) {
      saveCurrentSessionId(currentSessionId);
    }
  }, [currentSessionId]);

  // Check server configuration on mount
  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasServerNvidiaKey) {
          setServerHasNvidiaKey(true);
        }
      })
      .catch(() => {});
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K for new chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings]);

  // Scroll to bottom when messages update
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const currentSession =
    sessions.find((s) => s.id === currentSessionId) || sessions[0];

  const currentModel =
    AVAILABLE_MODELS.find((m) => m.id === (currentSession?.model || settings.selectedModel)) ||
    AVAILABLE_MODELS[0];

  const hasNvidiaKey = Boolean(settings.nvidiaApiKey.trim() || serverHasNvidiaKey);

  // New Chat Handler
  const handleNewChat = () => {
    if (isStreaming) {
      handleStopStreaming();
    }
    const newSession = createNewSession(settings.provider, settings.selectedModel);
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  // Select Model
  const handleSelectModel = (model: AIModel) => {
    setSettings((prev) => ({
      ...prev,
      provider: model.provider,
      selectedModel: model.id,
    }));

    if (currentSession) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id
            ? { ...s, model: model.id, provider: model.provider, updatedAt: Date.now() }
            : s
        )
      );
    }
  };

  // Delete Session
  const handleDeleteSession = (id: string) => {
    const remaining = sessions.filter((s) => s.id !== id);
    if (remaining.length === 0) {
      const fresh = createNewSession(settings.provider, settings.selectedModel);
      setSessions([fresh]);
      setCurrentSessionId(fresh.id);
    } else {
      setSessions(remaining);
      if (currentSessionId === id) {
        setCurrentSessionId(remaining[0].id);
      }
    }
  };

  // Rename Session
  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle, updatedAt: Date.now() } : s))
    );
  };

  // Clear all sessions
  const handleClearAllSessions = () => {
    const fresh = createNewSession(settings.provider, settings.selectedModel);
    setSessions([fresh]);
    setCurrentSessionId(fresh.id);
  };

  // Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Send Message Logic with Real-Time SSE Streaming
  const handleSendMessage = async (
    content: string,
    attachments?: Array<{ name: string; content: string; size: number }>
  ) => {
    if (isStreaming || !currentSession) return;

    // Compose final prompt text including file attachments if any
    let finalPrompt = content;
    if (attachments && attachments.length > 0) {
      const fileContext = attachments
        .map(
          (f) =>
            `\n\n--- Attached File: ${f.name} ---\n\`\`\`\n${f.content}\n\`\`\``
        )
        .join('');
      finalPrompt = `${content}${fileContext}`;
    }

    const userMessage: ChatMessageType = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: finalPrompt,
      timestamp: Date.now(),
    };

    const assistantPlaceholderId = `msg_asst_${Date.now() + 1}`;
    const assistantMessage: ChatMessageType = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      reasoning: '',
      timestamp: Date.now() + 1,
      model: currentSession.model,
      provider: currentSession.provider,
      isStreaming: true,
    };

    // Auto-title session if it's the first message
    const isFirstMessage = currentSession.messages.length === 0;
    const newTitle = isFirstMessage
      ? content.slice(0, 36).trim() + (content.length > 36 ? '...' : '')
      : currentSession.title;

    const updatedMessages = [...currentSession.messages, userMessage, assistantMessage];

    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSession.id
          ? {
              ...s,
              title: newTitle,
              updatedAt: Date.now(),
              messages: updatedMessages,
            }
          : s
      )
    );

    setIsStreaming(true);
    setTimeout(() => scrollToBottom(), 50);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Build message payload
      const historyPayload = currentSession.messages
        .concat(userMessage)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          provider: currentSession.provider,
          model: currentSession.model,
          messages: historyPayload,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens,
          nvidiaApiKey: settings.nvidiaApiKey.trim(),
          systemInstruction: settings.systemInstruction,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No stream body received from server.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      let accumulatedReasoning = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(dataStr);

            if (parsed.error) {
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === currentSession.id
                    ? {
                        ...s,
                        messages: s.messages.map((m) =>
                          m.id === assistantPlaceholderId
                            ? { ...m, isStreaming: false, error: parsed.error }
                            : m
                        ),
                      }
                    : s
                )
              );
              break;
            }

            if (parsed.content) {
              accumulatedContent += parsed.content;
            }

            if (parsed.reasoning) {
              accumulatedReasoning += parsed.reasoning;
            }

            // Update streaming message in state
            setSessions((prev) =>
              prev.map((s) =>
                s.id === currentSession.id
                  ? {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === assistantPlaceholderId
                          ? {
                              ...m,
                              content: accumulatedContent,
                              reasoning: accumulatedReasoning,
                              isStreaming: !parsed.done,
                            }
                          : m
                      ),
                    }
                  : s
              )
            );

            if (settings.autoScroll) {
              scrollToBottom('smooth');
            }
          } catch {
            // Ignore partial JSON frames
          }
        }
      }

      // Mark streaming complete
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id
            ? {
                ...s,
                messages: s.messages.map((m) =>
                  m.id === assistantPlaceholderId
                    ? { ...m, isStreaming: false }
                    : m
                ),
              }
            : s
        )
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User stopped generation manually
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSession.id
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantPlaceholderId
                      ? { ...m, isStreaming: false }
                      : m
                  ),
                }
              : s
          )
        );
      } else {
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSession.id
              ? {
                  ...s,
                  messages: s.messages.map((m) =>
                    m.id === assistantPlaceholderId
                      ? {
                          ...m,
                          isStreaming: false,
                          error: err.message || 'Generation failed',
                        }
                      : m
                  ),
                }
              : s
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last assistant response
  const handleRegenerate = () => {
    if (!currentSession || isStreaming) return;
    const msgs = currentSession.messages;
    if (msgs.length === 0) return;

    // Find last user message
    let lastUserPrompt = '';
    const sliceIndex = msgs[msgs.length - 1].role === 'assistant' ? msgs.length - 1 : msgs.length;
    for (let i = sliceIndex - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserPrompt = msgs[i].content;
        break;
      }
    }

    if (!lastUserPrompt) return;

    // Remove the last assistant message
    const trimmed = msgs.slice(0, sliceIndex - 1);
    setSessions((prev) =>
      prev.map((s) => (s.id === currentSession.id ? { ...s, messages: trimmed } : s))
    );

    handleSendMessage(lastUserPrompt);
  };

  // Edit user message
  const handleEditUserMessage = (newContent: string) => {
    handleSendMessage(newContent);
  };

  // Change Study Persona
  const handleSelectPersona = (personaId: string, systemInstruction: string) => {
    setActivePersonaId(personaId);
    setSettings((prev) => ({ ...prev, systemInstruction }));
    if (currentSession) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSession.id
            ? { ...s, systemInstruction, updatedAt: Date.now() }
            : s
        )
      );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#131314] text-neutral-100 font-sans selection:bg-emerald-500/30 selection:text-white">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={(id) => setCurrentSessionId(id)}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onRenameSession={handleRenameSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasNvidiaKey={hasNvidiaKey}
        provider={currentSession?.provider || settings.provider}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#171717] relative">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onNewChat={handleNewChat}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenStudyStudio={() => setIsStudyStudioOpen(true)}
          selectedModelId={currentSession?.model || settings.selectedModel}
          onSelectModel={handleSelectModel}
          provider={currentSession?.provider || settings.provider}
          hasNvidiaKey={hasNvidiaKey}
          onExport={() => currentSession && exportSessionAsMarkdown(currentSession)}
          isSidebarOpen={isSidebarOpen}
          activePersonaId={activePersonaId}
        />

        {/* NVIDIA Key Alert Banner if provider is nvidia and no key is set */}
        {currentSession?.provider === 'nvidia' && !hasNvidiaKey && !dismissedBanner && (
          <KeyBanner
            onOpenSettings={() => setIsSettingsOpen(true)}
            onSwitchToGemini={() => {
              const geminiModel = AVAILABLE_MODELS.find((m) => m.provider === 'gemini');
              if (geminiModel) handleSelectModel(geminiModel);
            }}
            onDismiss={() => setDismissedBanner(true)}
          />
        )}

        {/* Chat Messages or Empty Greeting State */}
        <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col">
          {currentSession && currentSession.messages.length > 0 ? (
            <div className="flex-1 py-4">
              {currentSession.messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onRegenerate={handleRegenerate}
                  onEdit={handleEditUserMessage}
                  isLast={index === currentSession.messages.length - 1}
                />
              ))}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          ) : (
            <EmptyState
              currentModel={currentModel}
              provider={currentSession?.provider || settings.provider}
              hasNvidiaKey={hasNvidiaKey}
              onSelectPrompt={(prompt) => handleSendMessage(prompt)}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenStudyStudio={() => setIsStudyStudioOpen(true)}
            />
          )}
        </div>

        {/* Bottom Floating Chat Input Capsule with Study Quick Bar */}
        <div className="p-3 sm:p-4 bg-gradient-to-t from-[#171717] via-[#171717]/90 to-transparent shrink-0">
          <StudyQuickBar
            onSelectAction={(promptTemplate) => handleSendMessage(promptTemplate)}
            onOpenStudio={() => setIsStudyStudioOpen(true)}
            activePersonaId={activePersonaId}
          />
          <ChatInput
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            onStopStreaming={handleStopStreaming}
            placeholder={`Ask Study Buddy with ${currentModel.name}...`}
          />
        </div>
      </div>

      {/* AI Study Buddy Studio Modal */}
      <StudyStudioModal
        isOpen={isStudyStudioOpen}
        onClose={() => setIsStudyStudioOpen(false)}
        provider={currentSession?.provider || settings.provider}
        model={currentSession?.model || settings.selectedModel}
        nvidiaApiKey={settings.nvidiaApiKey}
        onSelectPersona={handleSelectPersona}
        activePersonaId={activePersonaId}
        onSendToChat={(prompt) => handleSendMessage(prompt)}
      />

      {/* Settings & NVIDIA Key Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          if (currentSession) {
            setSessions((prev) =>
              prev.map((s) =>
                s.id === currentSession.id
                  ? {
                      ...s,
                      model: newSettings.selectedModel,
                      provider: newSettings.provider,
                    }
                  : s
              )
            );
          }
        }}
        onClearAllSessions={handleClearAllSessions}
        availableModels={AVAILABLE_MODELS}
      />
    </div>
  );
}
