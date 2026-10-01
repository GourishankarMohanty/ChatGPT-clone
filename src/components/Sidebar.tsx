import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Key,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { ChatSession, AIProvider } from '../types/chat';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onOpenSettings: () => void;
  hasNvidiaKey: boolean;
  provider: AIProvider;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onOpenSettings,
  hasNvidiaKey,
  provider,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startEditing = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveEdit = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  // Group sessions by relative date
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const todaySessions: ChatSession[] = [];
  const yesterdaySessions: ChatSession[] = [];
  const previous7DaysSessions: ChatSession[] = [];
  const olderSessions: ChatSession[] = [];

  for (const s of filteredSessions) {
    const diff = now - s.updatedAt;
    if (diff < oneDay) {
      todaySessions.push(s);
    } else if (diff < 2 * oneDay) {
      yesterdaySessions.push(s);
    } else if (diff < 7 * oneDay) {
      previous7DaysSessions.push(s);
    } else {
      olderSessions.push(s);
    }
  }

  const renderSessionGroup = (title: string, groupSessions: ChatSession[]) => {
    if (groupSessions.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="px-3 py-1 text-[11px] font-semibold text-neutral-400">
          {title}
        </div>
        <div className="space-y-0.5">
          {groupSessions.map((session) => {
            const isCurrent = session.id === currentSessionId;
            const isEditing = editingId === session.id;

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors ${
                  isCurrent
                    ? 'bg-neutral-800 text-white font-medium'
                    : 'text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(session.id, e as any);
                        if (e.key === 'Escape') cancelEdit(e as any);
                      }}
                      className="bg-neutral-900 text-white text-xs px-1.5 py-0.5 rounded border border-neutral-600 focus:outline-none focus:border-emerald-500 w-full"
                      autoFocus
                    />
                  ) : (
                    <span className="truncate text-xs">{session.title}</span>
                  )}
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                  {isEditing ? (
                    <>
                      <button
                        onClick={(e) => saveEdit(session.id, e)}
                        className="p-1 hover:text-emerald-400"
                        title="Save"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 hover:text-rose-400"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => startEditing(session, e)}
                        className="p-1 hover:text-neutral-200"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="p-1 hover:text-rose-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-[#171717] border-r border-neutral-800/80 flex flex-col transition-transform duration-200 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:hidden'
        }`}
      >
        {/* Top: New Chat button */}
        <div className="p-3 border-b border-neutral-800/80 space-y-2">
          <button
            onClick={onNewChat}
            className="w-full py-2 px-3 bg-neutral-800 hover:bg-neutral-750 text-white rounded-lg text-xs font-semibold flex items-center justify-between transition-colors border border-neutral-700/60 shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>New chat</span>
            </div>
            <span className="text-[10px] text-neutral-400">Ctrl+K</span>
          </button>

          {/* Search sessions */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-900/80 text-xs text-neutral-200 placeholder-neutral-400 rounded-md border border-neutral-800 focus:outline-none focus:border-neutral-700"
            />
          </div>
        </div>

        {/* Middle: Session history list */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
          {sessions.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-neutral-400">
              No conversations yet. Start a chat!
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="px-3 py-8 text-center text-xs text-neutral-400">
              No chats matching "{searchQuery}"
            </div>
          ) : (
            <>
              {renderSessionGroup('Today', todaySessions)}
              {renderSessionGroup('Yesterday', yesterdaySessions)}
              {renderSessionGroup('Previous 7 Days', previous7DaysSessions)}
              {renderSessionGroup('Older', olderSessions)}
            </>
          )}
        </div>

        {/* Bottom: Provider & Key Quick Indicator */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-900/40">
          <div
            onClick={onOpenSettings}
            className="flex items-center justify-between p-2 rounded-lg bg-neutral-800/40 hover:bg-neutral-800 cursor-pointer border border-neutral-800 transition-colors"
          >
            <div className="flex items-center gap-2">
              {provider === 'nvidia' ? (
                <Cpu className="w-4 h-4 text-emerald-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-blue-400" />
              )}
              <div className="text-left">
                <div className="text-xs font-semibold text-neutral-200">
                  {provider === 'nvidia' ? 'NVIDIA NIM' : 'Google Gemini'}
                </div>
                <div className="text-[10px] text-neutral-400">
                  {provider === 'nvidia'
                    ? hasNvidiaKey
                      ? 'NVIDIA Key Configured'
                      : 'Missing NVIDIA Key'
                    : 'Server Key Active'}
                </div>
              </div>
            </div>
            <Key className="w-3.5 h-3.5 text-neutral-400" />
          </div>
        </div>
      </aside>
    </>
  );
};
