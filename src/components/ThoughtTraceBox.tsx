import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Sparkles, Copy, Check } from 'lucide-react';

interface ThoughtTraceBoxProps {
  thought: string;
  isThinking?: boolean;
  score?: string;
  personaTitle?: string;
  defaultExpanded?: boolean;
}

export const ThoughtTraceBox: React.FC<ThoughtTraceBoxProps> = ({
  thought,
  isThinking = false,
  score = '99.4%',
  personaTitle = 'PAPAYA INTELLIGENCE',
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [copied, setCopied] = useState<boolean>(false);

  if (!thought && !isThinking) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(thought);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="reasoning-thought-box"
      className="w-full mb-3 rounded-xl border border-amber-500/40 bg-gradient-to-b from-[#130b1e]/90 via-[#0d0715]/95 to-[#09050e] shadow-[0_0_20px_rgba(245,158,11,0.09)] overflow-hidden transition-all text-xs font-mono select-text"
    >
      {/* Header Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3 sm:px-3.5 py-2 flex items-center justify-between border-b border-amber-500/25 bg-amber-500/[0.06] hover:bg-amber-500/[0.1] transition-colors cursor-pointer select-none"
      >
        {/* Left: Icons & Title */}
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div className="relative flex items-center justify-center shrink-0">
            <Brain size={14} className="text-amber-400 fill-amber-400/20" />
            {isThinking && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-pink-400 animate-ping" />
            )}
          </div>

          <span className="text-sm shrink-0" role="img" aria-label="brain">
            🧠
          </span>

          <span className="text-[10.5px] sm:text-xs font-mono font-bold text-amber-400 tracking-wider truncate">
            [{personaTitle} - INTERNER GEDANKENGANG & STRATEGIE]
          </span>
        </div>

        {/* Right: Badge & Collapse Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] sm:text-[10px] font-bold tracking-wider uppercase ${
              isThinking
                ? 'bg-pink-500/15 border-pink-500/40 text-pink-300'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isThinking ? 'bg-pink-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>
              {isThinking ? 'DENKPROZESS AKTIV...' : `REASONING TRACE ${score}`}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded text-neutral-400 hover:text-amber-300 hover:bg-white/5 transition-colors hidden sm:inline-flex"
            title="Gedankengang kopieren"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>

          <button
            type="button"
            className="text-amber-400/80 hover:text-amber-300 p-0.5 transition-transform"
            aria-label={isExpanded ? 'Gedankengang einklappen' : 'Gedankengang ausklappen'}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Body / Thought Content */}
      {isExpanded && (
        <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-black/40 text-neutral-200 text-[11.5px] sm:text-[12.5px] font-mono leading-relaxed border-t border-black/20">
          <p className="whitespace-pre-wrap break-words">
            {thought}
            {isThinking && (
              <span className="inline-block w-2 h-3.5 ml-1 bg-amber-400 animate-pulse align-middle" />
            )}
          </p>

          {isThinking && (
            <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-[10px] text-amber-300/80">
              <Sparkles size={11} className="animate-spin text-amber-400" />
              <span>Neuronale Synthese läuft in Echtzeit...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
