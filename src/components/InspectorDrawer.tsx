import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Clock,
  Sparkles,
  Download,
  Volume2,
  VolumeX,
  Zap,
  Layers,
  Terminal,
  X,
  ExternalLink,
  ShieldAlert,
  Coins,
  RefreshCw
} from 'lucide-react';
import { SystemStatus, ChatThread, DailyTokenStats } from '../types';

interface InspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  systemStatus: SystemStatus;
  activeThread: ChatThread | null;
  onOptimizeRAM: () => void;
  isFocusActive: boolean;
  onToggleFocus: () => void;
  isAmbientPlaying: boolean;
  onToggleAmbient: () => void;
  onExportMarkdown: () => void;
  tokenStats?: DailyTokenStats | null;
  onRefreshTokens?: () => void;
}

export const InspectorDrawer: React.FC<InspectorDrawerProps> = ({
  isOpen,
  onClose,
  systemStatus,
  activeThread,
  onOptimizeRAM,
  isFocusActive,
  onToggleFocus,
  isAmbientPlaying,
  onToggleAmbient,
  onExportMarkdown,
  tokenStats,
  onRefreshTokens,
}) => {
  if (!isOpen) return null;

  const used = tokenStats?.usedTokensToday ?? 0;
  const limit = tokenStats?.dailyLimit ?? 500000;
  const remaining = tokenStats?.remainingTokens ?? Math.max(0, limit - used);
  const percentage = tokenStats ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const reqCount = tokenStats?.requestCount ?? 0;

  // Calculate formatted countdown to 00:00 midnight
  const [countdownStr, setCountdownStr] = useState('');
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diffSecs = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
      const hours = Math.floor(diffSecs / 3600);
      const mins = Math.floor((diffSecs % 3600) / 60);
      const secs = diffSecs % 60;
      setCountdownStr(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside
      id="papaya-inspector-drawer"
      className="w-80 shrink-0 bg-neutral-900/95 backdrop-blur-2xl border-l border-white/10 flex flex-col h-full overflow-y-auto custom-scrollbar p-4 space-y-4 text-xs select-none z-20"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Activity size={15} className="text-orange-400" />
          <span className="font-bold text-neutral-100 tracking-tight">System Inspector</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Schließen"
        >
          <X size={15} />
        </button>
      </div>

      {/* Gemini API Token System Live Telemetry */}
      <div
        id="gemini-token-telemetry-card"
        className="bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-neutral-900/60 border border-orange-500/30 rounded-2xl p-3.5 space-y-3 shadow-lg relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Coins size={14} className="text-amber-400" />
            <span className="text-[11px] font-bold text-white tracking-tight">Gemini API Tokens</span>
          </div>
          <div className="flex items-center gap-1.5">
            {onRefreshTokens && (
              <button
                onClick={onRefreshTokens}
                className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Token-Status aktualisieren"
              >
                <RefreshCw size={11} />
              </button>
            )}
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              AKTIV
            </span>
          </div>
        </div>

        {/* Big Numbers: Used vs Remaining */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <div className="bg-black/30 border border-white/5 rounded-xl p-2 flex flex-col">
            <span className="text-[10px] text-neutral-400 font-medium">Heute verbraucht</span>
            <span className="text-sm font-bold font-mono text-orange-400 mt-0.5">
              {used.toLocaleString('de-DE')}
            </span>
            <span className="text-[9px] text-neutral-500 font-mono">
              {reqCount} {reqCount === 1 ? 'Anfrage' : 'Anfragen'}
            </span>
          </div>
          <div className="bg-black/30 border border-white/5 rounded-xl p-2 flex flex-col">
            <span className="text-[10px] text-neutral-400 font-medium">Verfügbar / Rest</span>
            <span className="text-sm font-bold font-mono text-emerald-300 mt-0.5">
              {remaining.toLocaleString('de-DE')}
            </span>
            <span className="text-[9px] text-neutral-500 font-mono">
              von {limit.toLocaleString('de-DE')}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
            <span>Tagesverbrauch ({percentage}%)</span>
            <span>{remaining.toLocaleString('de-DE')} übrig</span>
          </div>
          <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/10 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                percentage > 85
                  ? 'bg-rose-500'
                  : percentage > 60
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-400'
              }`}
              style={{ width: `${Math.max(percentage, 1)}%` }}
            />
          </div>
        </div>

        {/* Midnight Reset Info Banner */}
        <div className="flex items-center justify-between pt-1 border-t border-orange-500/20 text-[10px] text-neutral-300">
          <div className="flex items-center gap-1.5 text-neutral-400">
            <Clock size={11} className="text-orange-400" />
            <span>Reset täglich um 0:00 Uhr</span>
          </div>
          <span className="font-mono text-amber-300 font-semibold tracking-wider">
            in {countdownStr}
          </span>
        </div>

        {tokenStats?.lastRequestTokens && (
          <div className="text-[9px] font-mono text-neutral-400 pt-0.5 flex justify-between bg-black/20 px-2 py-1 rounded-lg border border-white/5">
            <span>Letzter Prompt: {tokenStats.lastRequestTokens.promptTokens} tkn</span>
            <span className="text-orange-300">Antwort: {tokenStats.lastRequestTokens.candidatesTokens} tkn</span>
          </div>
        )}
      </div>

      {/* System Live Telemetry */}
      <div className="bg-black/30 border border-white/10 rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-neutral-300">Systemressourcen</span>
          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
            OPTIMAL
          </span>
        </div>

        {/* CPU */}
        <div className="space-y-1">
          <div className="flex justify-between text-neutral-400">
            <span className="flex items-center gap-1.5">
              <Cpu size={12} className="text-orange-400" />
              <span>CPU Auslastung</span>
            </span>
            <span className="font-mono text-neutral-200">{systemStatus.cpuUsage}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-orange-500 h-full transition-all duration-500"
              style={{ width: `${systemStatus.cpuUsage}%` }}
            />
          </div>
        </div>

        {/* RAM */}
        <div className="space-y-1">
          <div className="flex justify-between text-neutral-400">
            <span className="flex items-center gap-1.5">
              <HardDrive size={12} className="text-amber-400" />
              <span>Arbeitsspeicher</span>
            </span>
            <span className="font-mono text-neutral-200">
              {systemStatus.ramUsageGb} / {systemStatus.ramTotalGb} GB
            </span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-400 to-amber-500 h-full transition-all duration-500"
              style={{
                width: `${(parseFloat(systemStatus.ramUsageGb) / systemStatus.ramTotalGb) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* NPU Latency */}
        <div className="flex justify-between pt-1 border-t border-white/5 text-neutral-400 text-[11px]">
          <span>Neural Engine</span>
          <span className="text-orange-400 font-mono">4.2 ms (Coral NPU)</span>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-neutral-400 px-1 uppercase tracking-wider">
          Schnellaktionen
        </span>

        <button
          onClick={onOptimizeRAM}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>RAM & Cache leeren</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">1-Klick</span>
        </button>

        <button
          onClick={onToggleFocus}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
            isFocusActive
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Clock size={14} className={isFocusActive ? 'text-emerald-400 animate-spin' : 'text-emerald-400'} />
            <span>{isFocusActive ? 'Focus Mode aktiv' : 'Focus Mode starten'}</span>
          </div>
          <span className="text-[10px] font-mono">{isFocusActive ? 'STOP' : '25m'}</span>
        </button>

        <button
          onClick={onToggleAmbient}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
            isAmbientPlaying
              ? 'bg-orange-500/20 border-orange-500/40 text-orange-200'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {isAmbientPlaying ? (
              <Volume2 size={14} className="text-orange-400 animate-pulse" />
            ) : (
              <VolumeX size={14} className="text-neutral-400" />
            )}
            <span>Sunset Focus Drone</span>
          </div>
          <span className="text-[10px] font-mono">{isAmbientPlaying ? 'AN' : 'AUS'}</span>
        </button>

        <button
          onClick={onExportMarkdown}
          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Download size={14} className="text-blue-400" />
            <span>Chat als Markdown exportieren</span>
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">.md</span>
        </button>
      </div>

      {/* PapayaOS Identity Card */}
      <div className="bg-gradient-to-br from-orange-500/15 via-amber-500/10 to-transparent border border-orange-500/20 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-orange-400 tracking-tight">PapayaOS Manifesto</span>
          <span className="text-[10px] font-mono text-neutral-400">PAPAYAOS.COM</span>
        </div>
        <p className="text-[11px] text-neutral-300 italic">
          "A fresher way to do more. Simple. Powerful. Yours."
        </p>
        <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] font-semibold text-neutral-300">
          <span className="px-2 py-1 rounded bg-black/20 text-orange-300">🎯 FOCUS</span>
          <span className="px-2 py-1 rounded bg-black/20 text-amber-300">🎨 CREATE</span>
          <span className="px-2 py-1 rounded bg-black/20 text-cyan-300">⚙️ AUTOMATE</span>
          <span className="px-2 py-1 rounded bg-black/20 text-emerald-300">🚀 EVOLVE</span>
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-black/30 border border-white/10 rounded-2xl p-3 space-y-2">
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
          Tastenkürzel
        </span>
        <div className="space-y-1 text-neutral-300 font-mono text-[11px]">
          <div className="flex justify-between">
            <span className="text-neutral-400">Senden</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">Enter</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Befehle</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">/</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Neuer Chat</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">⌘ + N</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Inspector</span>
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white">⌘ + J</kbd>
          </div>
        </div>
      </div>
    </aside>
  );
};
