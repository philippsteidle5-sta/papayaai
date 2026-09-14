import React from 'react';
import { Play, Pause, X, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { motion } from 'motion/react';

interface FocusWidgetProps {
  isActive: boolean;
  remainingSecs: number;
  isPaused: boolean;
  onTogglePause: () => void;
  onStop: () => void;
  isSoundOn: boolean;
  onToggleSound: () => void;
}

export const FocusWidget: React.FC<FocusWidgetProps> = ({
  isActive,
  remainingSecs,
  isPaused,
  onTogglePause,
  onStop,
  isSoundOn,
  onToggleSound,
}) => {
  if (!isActive) return null;

  const minutes = Math.floor(remainingSecs / 60);
  const seconds = remainingSecs % 60;
  const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const totalSecs = 25 * 60;
  const progressPercent = Math.max(0, Math.min(100, ((totalSecs - remainingSecs) / totalSecs) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.95 }}
      className="fixed bottom-24 right-6 z-40 bg-neutral-900/90 border border-emerald-500/40 rounded-2xl shadow-2xl backdrop-blur-2xl p-3 flex items-center gap-3 text-neutral-100 select-none"
    >
      {/* Progress ring or dot */}
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-white/10"
            strokeWidth="3"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className="text-emerald-400 transition-all duration-300"
            strokeDasharray={`${progressPercent}, 100`}
            strokeWidth="3"
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span className="absolute text-[10px] font-bold font-mono text-emerald-300">
          🧘
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
          {isPaused ? 'Fokus Pausiert' : 'Deep Work Fokus'}
        </span>
        <span className="text-base font-bold font-mono text-white tracking-wider">
          {timeFormatted}
        </span>
      </div>

      <div className="flex items-center gap-1 pl-2 border-l border-white/10">
        <button
          onClick={onTogglePause}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          title={isPaused ? 'Fortsetzen' : 'Pausieren'}
        >
          {isPaused ? <Play size={14} className="fill-white" /> : <Pause size={14} />}
        </button>

        <button
          onClick={onToggleSound}
          className={`p-2 rounded-xl transition-all cursor-pointer ${
            isSoundOn
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-white/10 hover:bg-white/20 text-neutral-400'
          }`}
          title={isSoundOn ? 'Hintergrundklang stumm' : 'Sunset Focus Drone an'}
        >
          {isSoundOn ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>

        <button
          onClick={onStop}
          className="p-2 rounded-xl hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-all cursor-pointer"
          title="Fokus beenden"
        >
          <X size={14} />
        </button>
      </div>
    </motion.div>
  );
};
