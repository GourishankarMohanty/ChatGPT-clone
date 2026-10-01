import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  RotateCw,
  Volume2,
  VolumeX,
  Edit3,
  Cpu,
  User,
  ChevronDown,
  ChevronRight,
  Brain,
} from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../types/chat';

interface ChatMessageProps {
  message: ChatMessageType;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  isLast?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRegenerate,
  onEdit,
  isLast,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.content);
  const [isThinkingOpen, setIsThinkingOpen] = useState(true);

  // Extract <think> tags if embedded in content
  let displayContent = message.content;
  let embeddedReasoning = message.reasoning || '';

  if (!embeddedReasoning && displayContent.includes('<think>')) {
    const startIdx = displayContent.indexOf('<think>');
    const endIdx = displayContent.indexOf('</think>');
    if (endIdx !== -1) {
      embeddedReasoning = displayContent.substring(startIdx + 7, endIdx).trim();
      displayContent = displayContent.substring(endIdx + 8).trim();
    } else if (message.isStreaming) {
      // In process of thinking
      embeddedReasoning = displayContent.substring(startIdx + 7).trim();
      displayContent = '';
    }
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(displayContent);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const isUser = message.role === 'user';

  return (
    <div
      className={`py-4 px-3 sm:px-6 transition-colors ${
        isUser ? 'bg-transparent' : 'bg-[#1e1e1e]/40 border-y border-neutral-800/40'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-neutral-700 flex items-center justify-center text-neutral-200">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-neutral-200">
              {isUser ? 'You' : message.model ? message.model.split('/').pop() : 'NexusAI'}
            </span>
            <span className="text-[11px] text-neutral-400">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {/* Reasoning / Thinking Drawer for DeepSeek-R1 / Nemotron */}
          {embeddedReasoning && (
            <div className="mb-3 rounded-lg border border-neutral-750 bg-neutral-900/80 overflow-hidden">
              <button
                onClick={() => setIsThinkingOpen(!isThinkingOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-850/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                  <span>Thinking Process</span>
                </div>
                {isThinkingOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                )}
              </button>
              {isThinkingOpen && (
                <div className="p-3 text-xs text-neutral-400 font-mono leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto border-t border-neutral-800 bg-[#141414]">
                  {embeddedReasoning}
                </div>
              )}
            </div>
          )}

          {/* Editing state for User */}
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full p-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-emerald-500"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (onEdit && editedText.trim()) {
                      onEdit(editedText.trim());
                    }
                    setIsEditing(false);
                  }}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded"
                >
                  Save & Submit
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-[14.5px] leading-relaxed break-words">
              {displayContent ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Custom Code Block Renderer
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeString = String(children).replace(/\n$/, '');
                      const isInline = !match && !codeString.includes('\n');

                      if (isInline) {
                        return (
                          <code
                            className="bg-neutral-800 text-neutral-200 px-1.5 py-0.5 rounded text-[13px] font-mono border border-neutral-700/60"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      }

                      const lang = match ? match[1] : 'code';

                      return (
                        <div className="my-3 rounded-lg overflow-hidden border border-neutral-750 bg-[#161616]">
                          <div className="flex items-center justify-between px-3 py-1.5 bg-[#202020] text-xs text-neutral-400 border-b border-neutral-800 font-mono">
                            <span>{lang}</span>
                            <button
                              onClick={() => handleCopy(codeString)}
                              className="flex items-center gap-1 hover:text-white transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </button>
                          </div>
                          <pre className="p-3 text-[13px] font-mono overflow-x-auto text-neutral-200">
                            <code>{children}</code>
                          </pre>
                        </div>
                      );
                    },
                    table({ children }) {
                      return (
                        <div className="overflow-x-auto my-3">
                          <table className="min-w-full divide-y divide-neutral-800 border border-neutral-800 rounded-lg text-xs">
                            {children}
                          </table>
                        </div>
                      );
                    },
                    th({ children }) {
                      return (
                        <th className="px-3 py-2 bg-neutral-850 text-left font-semibold text-neutral-200 border-b border-neutral-750">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="px-3 py-2 text-neutral-300 border-b border-neutral-850">
                          {children}
                        </td>
                      );
                    },
                  }}
                >
                  {displayContent}
                </ReactMarkdown>
              ) : message.isStreaming ? (
                <div className="flex items-center gap-1.5 text-neutral-400 text-sm italic">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Generating response...</span>
                </div>
              ) : null}

              {/* Streaming Cursor */}
              {message.isStreaming && displayContent && (
                <span className="inline-block w-1.5 h-4 ml-0.5 bg-emerald-400 animate-pulse align-middle" />
              )}
            </div>
          )}

          {/* Error Banner */}
          {message.error && (
            <div className="mt-2.5 p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
              <span className="font-semibold">Error:</span> {message.error}
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 mt-2.5 pt-1 text-neutral-400">
            <button
              onClick={() => handleCopy(displayContent)}
              className="p-1 hover:text-neutral-200 rounded transition-colors"
              title="Copy message"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {!isUser && (
              <button
                onClick={handleSpeech}
                className={`p-1 rounded transition-colors ${
                  isSpeaking ? 'text-emerald-400' : 'hover:text-neutral-200'
                }`}
                title={isSpeaking ? 'Stop speech' : 'Read aloud'}
              >
                {isSpeaking ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {!isUser && onRegenerate && isLast && !message.isStreaming && (
              <button
                onClick={onRegenerate}
                className="p-1 hover:text-neutral-200 rounded transition-colors"
                title="Regenerate response"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            )}

            {isUser && onEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 hover:text-neutral-200 rounded transition-colors"
                title="Edit message"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
