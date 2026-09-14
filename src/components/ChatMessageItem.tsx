import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { motion } from 'motion/react';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  Sparkles,
  Terminal,
  Play,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Coins,
  Image as ImageIcon,
  Maximize2,
  X,
  Download
} from 'lucide-react';
import { ChatMessage, ActionItem } from '../types';
import { PapayaLogo } from './PapayaLogo';
import { ThoughtTraceBox } from './ThoughtTraceBox';
import { parseThoughtAndContent, getFallbackThoughtForMessage } from '../utils/thoughtUtils';

interface ChatMessageItemProps {
  message: ChatMessage;
  onExecuteAction?: (action: ActionItem) => void;
  onRetry?: () => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  onExecuteAction,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const isModel = message.role === 'model';

  // Parse internal thought trace (<thought>...</thought>)
  const parsedThought = isModel ? parseThoughtAndContent(message.content) : null;
  const isThinking = Boolean(isModel && parsedThought?.isThinking);
  const displayContent = isModel
    ? (parsedThought?.cleanContent ?? message.content)
    : message.content;
  const hasAnswer = Boolean(displayContent && displayContent.trim().length > 0);
  const thoughtText = isModel && hasAnswer
    ? message.thought || parsedThought?.thought || getFallbackThoughtForMessage(displayContent)
    : '';
  const reasoningScore = message.reasoningScore || parsedThought?.score || '99.4%';
  const isAwaitingResponse = Boolean(isModel && !hasAnswer);

  const photoAttachments = message.attachments?.filter(
    (a) => a.type === 'image' || (a.url && a.url.startsWith('data:image/'))
  ) || [];

  const handleCopy = () => {
    navigator.clipboard.writeText(displayContent || message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanSpeechText = (displayContent || message.content).replace(/[#*`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.lang = 'de-DE';
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`group relative flex gap-3.5 my-3.5 ${
        isModel ? 'items-start' : 'items-start flex-row-reverse'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 mt-0.5">
        {isModel ? (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/30 flex items-center justify-center shadow-md">
            <PapayaLogo size={20} />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-white shadow-sm">
            <span>U</span>
          </div>
        )}
      </div>

      {/* Message Content Container */}
      <div
        className={`max-w-[85%] md:max-w-[78%] flex flex-col ${
          isModel ? 'items-start' : 'items-end'
        }`}
      >
        {/* Meta / Header */}
        <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-neutral-400">
          <span className="font-medium text-neutral-300">
            {isModel ? 'Papaya Intelligence' : 'Du'}
          </span>

          {isModel && (
            <span
              className={`flex items-center gap-1 px-1.5 py-0.2 rounded-full border text-[9px] font-mono ${
                message.metadata?.model?.includes('3.5-flash-lite') || message.metadata?.model?.includes('3.1-flash-lite')
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : message.metadata?.model?.includes('3.6')
                  ? 'bg-sky-500/10 text-sky-300 border-sky-500/20'
                  : message.metadata?.model?.includes('3.1-pro')
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                  : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
              }`}
            >
              <Cpu size={9} />
              {message.metadata?.model?.includes('3.5-flash-lite') || message.metadata?.model?.includes('3.1-flash-lite')
                ? '⚡ Ultra-Fast: 3.5 Lite'
                : message.metadata?.model?.includes('3.6')
                ? '✨ Smart: 3.6 Flash'
                : message.metadata?.model?.includes('3.8')
                ? '🚀 Power: 3.8 Flash'
                : message.metadata?.model?.includes('3.1-pro')
                ? '🧠 Pro: 3.1 Pro Max'
                : message.source === 'gemini'
                ? 'Gemini 3.5 Lite'
                : 'Papaya Core Engine'}
            </span>
          )}

          {isModel && message.metadata?.tokens && (
            <span
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono border ${
                message.metadata.tokenMultiplier && message.metadata.tokenMultiplier >= 6
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : message.metadata.tokenMultiplier && message.metadata.tokenMultiplier >= 4
                  ? 'bg-orange-500/15 text-orange-300 border-orange-500/30'
                  : message.metadata.tokenMultiplier && message.metadata.tokenMultiplier >= 2.5
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}
              title={
                message.metadata.tokenMultiplier && message.metadata.tokenMultiplier > 1
                  ? `${message.metadata.tokens} Tokens abgezogen (${message.metadata.tokenMultiplier}x Multiplikator durch gewählte Modellstärke)`
                  : `${message.metadata.tokens} Tokens für diese Antwort verbraucht`
              }
            >
              <Coins size={9} />
              <span>{message.metadata.tokens} tkn</span>
              {message.metadata.tokenMultiplier && message.metadata.tokenMultiplier > 1 && (
                <span className="font-bold opacity-90">
                  (-{message.metadata.tokenMultiplier}x)
                </span>
              )}
            </span>
          )}

          <span className="text-[10px] text-neutral-500">{message.timestamp}</span>
        </div>

        {/* Awaiting response loading indicator (clean pulsing state, NO brain box yet) */}
        {isAwaitingResponse && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-neutral-900/90 border border-white/10 text-neutral-300 text-xs shadow-md backdrop-blur-md w-fit mb-1">
            <div className="flex gap-1.5 items-center">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
            </div>
            <span className="text-neutral-300 font-medium text-xs">Papaya Intelligence denkt nach...</span>
          </div>
        )}

        {/* Das Gehirn / Internal Thought Box kommt ERST, wenn die Antwort auch tatsächlich da ist! */}
        {isModel && hasAnswer && Boolean(thoughtText) && (
          <ThoughtTraceBox
            thought={thoughtText}
            isThinking={false}
            score={reasoningScore}
            personaTitle="PAPAYA INTELLIGENCE"
            defaultExpanded={true}
          />
        )}

        {/* Bubble */}
        {(hasAnswer || !isModel || photoAttachments.length > 0) && (
          <div
            className={`relative rounded-2xl p-4 text-sm leading-relaxed transition-all shadow-md ${
              isModel
                ? 'bg-neutral-900/90 text-neutral-100 border border-white/10 backdrop-blur-md w-full'
                : 'bg-gradient-to-br from-orange-600 to-amber-600 text-white rounded-tr-none shadow-orange-500/20'
            }`}
          >
            {/* Photo Attachments Display */}
            {photoAttachments.length > 0 && (
              <div className={`mb-3 ${photoAttachments.length > 1 ? 'grid grid-cols-2 gap-2' : ''}`}>
                {photoAttachments.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => photo.url && setSelectedPhoto(photo.url)}
                    className="group relative rounded-xl overflow-hidden border border-white/20 bg-black/40 cursor-pointer shadow-md hover:border-orange-400/80 transition-all max-w-sm"
                    title="Foto vergrößern"
                  >
                    <img
                      src={photo.url}
                      alt={photo.name}
                      className="w-full max-h-60 object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5">
                      <span className="text-[11px] font-mono text-white/90 truncate max-w-[150px]">
                        {photo.name}
                      </span>
                      <span className="p-1 rounded-md bg-white/20 text-white backdrop-blur-sm">
                        <Maximize2 size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Text / Markdown */}
            {displayContent ? (
              <div className="prose prose-invert prose-sm max-w-none text-sm break-words leading-relaxed space-y-2.5">
                <Markdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-base font-bold text-orange-400 mt-2 mb-1 border-b border-white/10 pb-1">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-sm font-bold text-orange-300 mt-2 mb-1">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xs font-semibold text-amber-300 mt-2 mb-0.5 tracking-wide uppercase">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => <p className="mb-2 leading-relaxed text-neutral-200">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-5 mb-2 space-y-1 text-neutral-200">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 space-y-1 text-neutral-200">{children}</ol>,
                    li: ({ children }) => <li className="leading-snug">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-orange-500 pl-3 py-0.5 my-2 italic text-neutral-300 bg-orange-500/5 rounded-r">
                        {children}
                      </blockquote>
                    ),
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const isInline = !match && !String(children).includes('\n');

                      if (isInline) {
                        return (
                          <code
                            className="px-1.5 py-0.5 rounded bg-black/40 text-orange-300 font-mono text-xs border border-white/5"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      }

                      return (
                        <div className="my-2.5 rounded-xl overflow-hidden border border-white/15 bg-black/70 shadow-inner">
                          <div className="flex items-center justify-between px-3 py-1.5 bg-white/5 border-b border-white/10 text-[11px] font-mono text-neutral-400">
                            <span className="flex items-center gap-1.5 text-orange-400">
                              <Terminal size={12} />
                              {match ? match[1] : 'papaya-code'}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(String(children));
                              }}
                              className="hover:text-white flex items-center gap-1 text-[10px]"
                            >
                              <Copy size={10} />
                              <span>Kopieren</span>
                            </button>
                          </div>
                          <pre className="p-3 text-xs font-mono text-neutral-200 overflow-x-auto">
                            <code>{children}</code>
                          </pre>
                        </div>
                      );
                    },
                  }}
                >
                  {displayContent}
                </Markdown>
              </div>
            ) : null}

          {/* Interactive Action items attached to assistant reply */}
          {isModel && message.actions && message.actions.length > 0 && (
            <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap gap-2">
              {message.actions.map((act) => (
                <button
                  key={act.id}
                  onClick={() => onExecuteAction && onExecuteAction(act)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-200 text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <Play size={11} className="text-orange-400 fill-orange-400" />
                  <span>{act.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

        {/* Message action bar (Copy, Speak, Retry) - only when answer is present */}
        {(hasAnswer || !isModel) && (
          <div
            className={`flex items-center gap-1 mt-1 px-1 transition-opacity ${
              isModel ? 'text-neutral-400' : 'text-neutral-400 flex-row-reverse'
            }`}
          >
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors"
              title="Text kopieren"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>

            {isModel && (
              <button
                onClick={handleSpeak}
                className={`p-1 rounded hover:bg-white/10 hover:text-white transition-colors ${
                  isSpeaking ? 'text-orange-400 animate-pulse' : ''
                }`}
                title="Vorlesen"
              >
                {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>
            )}

            {isModel && onRetry && (
              <button
                onClick={onRetry}
                className="p-1 rounded hover:bg-white/10 hover:text-white transition-colors"
                title="Antwort neu generieren"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox for clicked image */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden border border-white/20 bg-neutral-950 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10 text-xs text-neutral-300">
              <span className="flex items-center gap-1.5 font-medium text-orange-400">
                <ImageIcon size={14} />
                <span>Foto in voller Auflösung</span>
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={selectedPhoto}
                  download="papaya-photo.jpg"
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                  title="Herunterladen"
                >
                  <Download size={13} />
                  <span>Speichern</span>
                </a>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-2 flex items-center justify-center overflow-auto max-h-[80vh] bg-black/50">
              <img
                src={selectedPhoto}
                alt="Vergrößertes Foto"
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
