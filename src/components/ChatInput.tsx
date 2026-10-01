import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Paperclip,
  Mic,
  MicOff,
  X,
  FileText,
} from 'lucide-react';

interface AttachedFile {
  name: string;
  content: string;
  size: number;
}

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: AttachedFile[]) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  placeholder = 'Message NexusAI... (e.g. Ask a coding question or attach a file)',
  disabled = false,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [input]);

  // Handle Speech Recognition
  const toggleRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setAttachments((prev) => [
            ...prev,
            { name: file.name, content: text, size: file.size },
          ]);
        }
      };
      reader.readAsText(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if ((!input.trim() && attachments.length === 0) || isStreaming || disabled) return;
    onSendMessage(input.trim(), attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-3 sm:px-4">
      {/* Attached Files Preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-neutral-900/90 rounded-lg border border-neutral-800">
          {attachments.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800 rounded-md text-xs text-neutral-200 border border-neutral-700/60"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="max-w-[140px] truncate">{file.name}</span>
              <span className="text-[10px] text-neutral-400">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
              <button
                onClick={() => removeAttachment(idx)}
                className="p-0.5 hover:text-rose-400 text-neutral-400 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Input Box */}
      <div className="relative flex flex-col bg-[#212121] border border-neutral-700/60 rounded-2xl shadow-lg transition-all focus-within:border-neutral-500">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="w-full bg-transparent text-neutral-100 placeholder-neutral-400 text-[14.5px] p-3.5 pb-2 resize-none focus:outline-none min-h-[48px] max-h-[220px]"
        />

        {/* Input Bar Controls */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <div className="flex items-center gap-1">
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
              accept=".txt,.md,.py,.js,.jsx,.ts,.tsx,.json,.csv,.sql,.html,.css,.yaml,.yml"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors"
              title="Attach code or text file"
              type="button"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Mic / Speech Input Button */}
            <button
              onClick={toggleRecording}
              className={`p-1.5 rounded-lg transition-colors ${
                isRecording
                  ? 'text-rose-400 bg-rose-500/20 animate-pulse'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
              }`}
              title={isRecording ? 'Stop voice recording' : 'Dictate with voice'}
              type="button"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-neutral-400 hidden sm:inline">
              Enter to send, Shift+Enter for newline
            </span>

            {/* Submit / Stop Button */}
            {isStreaming ? (
              <button
                onClick={onStopStreaming}
                className="w-8 h-8 rounded-full bg-neutral-200 hover:bg-white text-neutral-900 flex items-center justify-center transition-colors"
                title="Stop generation"
                type="button"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!input.trim() && attachments.length === 0}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  input.trim() || attachments.length > 0
                    ? 'bg-white hover:bg-neutral-200 text-neutral-900 shadow-sm'
                    : 'bg-neutral-800 text-neutral-400 cursor-not-allowed'
                }`}
                title="Send message"
                type="button"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
