import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Sparkles,
  Terminal,
  Command,
  X,
  FileCode,
  Image as ImageIcon,
  Camera,
  Check,
  Maximize2,
  UploadCloud
} from 'lucide-react';
import { SLASH_COMMANDS } from '../data/initialData';
import { ChatAttachment } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, attachments?: ChatAttachment[]) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
  personaName: string;
  onOpenVoiceModal?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onStopGeneration,
  personaName,
  onOpenVoiceModal,
}) => {
  const [input, setInput] = useState('');
  const [showCommands, setShowCommands] = useState(false);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'de-DE';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  // Read & optionally downscale massive photos to ensure snappy uploads
  const processImageFile = (file: File): Promise<ChatAttachment> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 2048;
          let width = img.width;
          let height = img.height;

          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            } else {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            const optimizedUrl = canvas.toDataURL(file.type || 'image/jpeg', 0.88);
            resolve({
              id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              name: file.name || 'foto.jpg',
              type: 'image',
              url: optimizedUrl,
              mimeType: file.type || 'image/jpeg',
              size: file.size,
            });
          } else {
            resolve({
              id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              name: file.name || 'foto.jpg',
              type: 'image',
              url: rawUrl,
              mimeType: file.type || 'image/jpeg',
              size: file.size,
            });
          }
        };
        img.onerror = () => {
          resolve({
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name || 'foto.jpg',
            type: 'image',
            url: rawUrl,
            mimeType: file.type || 'image/jpeg',
            size: file.size,
          });
        };
        img.src = rawUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      const newAttachments = await Promise.all(imageFiles.map(processImageFile));
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
    e.target.value = '';
    textareaRef.current?.focus();
  };

  // Clipboard paste support (e.g. screenshot or copied picture)
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }
    if (imageFiles.length > 0) {
      const newAttachments = await Promise.all(imageFiles.map(processImageFile));
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
  };

  // Drag & drop support
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
    if (files.length > 0) {
      const newAttachments = await Promise.all(files.map(processImageFile));
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    if (val.startsWith('/')) {
      setShowCommands(true);
      setSelectedCommandIndex(0);
    } else {
      setShowCommands(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Navigate slash commands
    if (showCommands) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCommandIndex((prev) => (prev + 1) % SLASH_COMMANDS.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCommandIndex(
          (prev) => (prev - 1 + SLASH_COMMANDS.length) % SLASH_COMMANDS.length
        );
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        const cmd = SLASH_COMMANDS[selectedCommandIndex];
        setInput(`${cmd.command} `);
        setShowCommands(false);
        return;
      }
      if (e.key === 'Escape') {
        setShowCommands(false);
        return;
      }
    }

    // Submit on Enter without Shift
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    onSendMessage(input.trim(), attachments);
    setInput('');
    setAttachments([]);
    setShowCommands(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleSelectCommand = (cmd: string) => {
    setInput(`${cmd} `);
    setShowCommands(false);
    textareaRef.current?.focus();
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      alert('Spracherkennung wird in diesem Browser nicht unterstützt.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  return (
    <div
      id="papaya-chat-input-box"
      className="relative p-3 md:p-4 max-w-4xl mx-auto w-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Inputs for Photos & Camera */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Slash Command Popover */}
      {showCommands && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-neutral-900/95 border border-white/15 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-2xl z-40 animate-in fade-in duration-100">
          <div className="px-3 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between text-xs text-neutral-400">
            <span className="flex items-center gap-1.5 font-semibold text-orange-400">
              <Command size={13} />
              <span>PapayaOS Systembefehle</span>
            </span>
            <span className="text-[10px]">Tab oder ↵ zum Übernehmen</span>
          </div>
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {SLASH_COMMANDS.map((item, idx) => {
              const isSelected = idx === selectedCommandIndex;
              return (
                <button
                  key={item.command}
                  onClick={() => handleSelectCommand(item.command)}
                  className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors text-xs ${
                    isSelected
                      ? 'bg-orange-500/20 text-orange-200 border border-orange-500/30 font-medium'
                      : 'text-neutral-300 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-orange-400">{item.command}</span>
                    <span className="text-neutral-400 text-xs truncate">{item.description}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 font-mono text-neutral-400">
                    {item.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Attachments Preview Bar with Photo Thumbnails */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 mb-2.5 px-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group relative flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-neutral-900/90 border border-orange-500/30 text-xs text-neutral-200 shadow-lg backdrop-blur-md hover:border-orange-500/60 transition-all"
            >
              {/* Photo Thumbnail */}
              {att.type === 'image' && att.url ? (
                <div
                  onClick={() => setPreviewImage(att.url)}
                  className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-black cursor-pointer shrink-0"
                  title="Klicken zum Vergrößern"
                >
                  <img
                    src={att.url}
                    alt={att.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Maximize2 size={12} className="text-white" />
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                  <FileCode size={16} />
                </div>
              )}

              <div className="flex flex-col min-w-0 pr-1">
                <span className="font-mono text-xs text-white truncate max-w-[130px]" title={att.name}>
                  {att.name}
                </span>
                <span className="text-[10px] text-orange-400 font-medium flex items-center gap-1">
                  <span>📸 Papaya Vision</span>
                  {att.size && (
                    <span className="text-neutral-500">
                      • {(att.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  )}
                </span>
              </div>

              <button
                onClick={() => handleRemoveAttachment(att.id)}
                className="p-1 rounded-lg bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-300 transition-colors ml-1 cursor-pointer"
                title="Foto entfernen"
              >
                <X size={13} />
              </button>
            </div>
          ))}

          <span className="text-[11px] text-neutral-400 font-medium pl-1 hidden sm:inline">
            ✨ {attachments.length} {attachments.length === 1 ? 'Foto' : 'Fotos'} bereit für Papaya
          </span>
        </div>
      )}

      {/* Main Omnibar Capsule */}
      <div
        className={`relative flex flex-col bg-neutral-900/90 border rounded-2xl shadow-xl shadow-black/30 backdrop-blur-2xl focus-within:border-orange-500/60 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all ${
          isDragging
            ? 'border-orange-400 ring-4 ring-orange-500/30 bg-orange-950/30 scale-[1.01]'
            : 'border-white/15'
        }`}
      >
        {/* Drag Over Overlay Hint */}
        {isDragging && (
          <div className="absolute inset-0 z-30 rounded-2xl bg-orange-950/80 backdrop-blur-md flex items-center justify-center gap-2 text-orange-300 font-medium pointer-events-none animate-in fade-in">
            <UploadCloud size={20} className="animate-bounce" />
            <span>Fotos hier loslassen, um sie an Papaya zu senden</span>
          </div>
        )}

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          id="chat-textarea"
          rows={1}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            attachments.length > 0
              ? `Beschreibe oder frage ${personaName} etwas zu ${attachments.length === 1 ? 'diesem Foto' : 'diesen Fotos'}...`
              : `Frage ${personaName}, tippe '/', oder ziehe Fotos hierher...`
          }
          className="w-full bg-transparent text-neutral-100 placeholder-neutral-500 text-sm px-4 pt-3.5 pb-2 resize-none focus:outline-none custom-scrollbar min-h-[44px] max-h-[160px]"
        />

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1 border-t border-white/5 text-neutral-400">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Direct Photo Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/40 text-neutral-300 hover:text-orange-300 transition-all cursor-pointer text-xs font-medium"
              title="Foto oder Bild hochladen"
            >
              <ImageIcon size={14} className="text-orange-400" />
              <span className="hidden sm:inline">Foto</span>
            </button>

            {/* Mobile Camera Snapshot Button */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="p-2 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              title="Kamera öffnen / Foto aufnehmen"
            >
              <Camera size={15} />
            </button>

            {/* File attachment shortcut */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
              title="Datei oder Screenshot anfügen"
            >
              <Paperclip size={15} />
            </button>

            {/* Slash Command Shortcut Helper */}
            <button
              type="button"
              onClick={() => {
                setInput('/');
                setShowCommands(true);
                textareaRef.current?.focus();
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-xl hover:bg-white/10 hover:text-white transition-colors text-xs font-mono"
              title="Systembefehle anzeigen"
            >
              <Terminal size={13} className="text-orange-400" />
              <span>/befehle</span>
            </button>

            {/* Voice Dictation or 3D Papaya Voice Modal */}
            {onOpenVoiceModal ? (
              <button
                id="open-voice-modal-btn"
                type="button"
                onClick={onOpenVoiceModal}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 hover:text-white transition-all cursor-pointer text-xs font-medium"
                title="Papaya Voice Chat mit 3D Partikel-Ball öffnen"
              >
                <Mic size={13} className="text-orange-400" />
                <span className="hidden sm:inline">Voice Chat</span>
              </button>
            ) : speechSupported ? (
              <button
                type="button"
                onClick={toggleVoice}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isListening
                    ? 'bg-red-500/20 text-red-400 animate-pulse'
                    : 'hover:bg-white/10 hover:text-white'
                }`}
                title={isListening ? 'Zuhören beenden' : 'Spracheingabe starten'}
              >
                {isListening ? <MicOff size={15} /> : <Mic size={15} />}
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] text-neutral-400 font-mono">
              ↵ Senden • ⇧↵ Zeile
            </span>

            {/* Send Button */}
            <button
              id="send-message-btn"
              type="button"
              onClick={handleSubmit}
              disabled={(!input.trim() && attachments.length === 0) || isLoading}
              className={`flex items-center justify-center p-2 sm:px-3 sm:py-2 rounded-xl font-medium text-white transition-all cursor-pointer shadow-md gap-1.5 ${
                (!input.trim() && attachments.length === 0) || isLoading
                  ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 shadow-orange-500/25'
              }`}
              title="Nachricht senden (Enter)"
            >
              <span className="hidden sm:inline text-xs font-semibold">Senden</span>
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl max-h-[85vh] rounded-2xl overflow-hidden border border-white/20 bg-neutral-900 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-3 bg-white/5 border-b border-white/10 text-xs text-neutral-300">
              <span className="flex items-center gap-1.5 font-medium text-orange-400">
                <ImageIcon size={14} />
                <span>Papaya Vision Foto-Vorschau</span>
              </span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center overflow-auto max-h-[75vh]">
              <img
                src={previewImage}
                alt="Vorschau"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
