import React, { useState, useEffect } from 'react';
import { PapayaLogo } from './PapayaLogo';
import {
  Wifi,
  Battery,
  Sparkles,
  Sun,
  Moon,
  Sunset,
  Sidebar,
  Sliders,
  Bell,
  Clock,
  ChevronDown,
  Terminal,
  Shield,
  Layers,
  HelpCircle,
  X,
  Mic,
  Coins,
  Rocket,
  FolderArchive,
  Flame,
  Settings
} from 'lucide-react';
import { OSTheme, DailyTokenStats } from '../types';

interface TopMenuBarProps {
  theme: OSTheme;
  onThemeChange: (theme: OSTheme) => void;
  isFocusActive: boolean;
  focusRemainingSecs: number;
  onToggleFocus: () => void;
  isInspectorOpen: boolean;
  onToggleInspector: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onQuickCommand: (cmd: string) => void;
  onOpenVoiceModal?: () => void;
  onOpenBetaPage?: () => void;
  onOpenExportModal?: () => void;
  tokenStats?: DailyTokenStats | null;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  theme,
  onThemeChange,
  isFocusActive,
  focusRemainingSecs,
  onToggleFocus,
  isInspectorOpen,
  onToggleInspector,
  isSidebarOpen,
  onToggleSidebar,
  onQuickCommand,
  onOpenVoiceModal,
  onOpenBetaPage,
  onOpenExportModal,
  tokenStats,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showTokenMenu, setShowTokenMenu] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      setDateStr(
        now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatSecs = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <header
        id="papaya-top-menu"
        className="h-10 px-3 bg-neutral-900/90 text-neutral-200 backdrop-blur-xl border-b border-white/10 flex items-center justify-between text-xs select-none z-40 transition-colors"
      >
        {/* Left: PapayaOS Apple-style menu */}
        <div className="flex items-center gap-1">
          {/* Logo Menu Button */}
          <div className="relative">
            <button
              id="papaya-menu-btn"
              onClick={() => setActiveMenu(activeMenu === 'papaya' ? null : 'papaya')}
              className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/10 transition-colors font-medium text-white"
              title="PapayaOS Menü"
            >
              <PapayaLogo size={18} />
              <span className="font-bold tracking-tight">Papaya<span className="text-orange-400">OS</span></span>
            </button>

            {activeMenu === 'papaya' && (
              <div
                className="absolute left-0 top-8 w-56 bg-neutral-900/95 border border-white/10 rounded-xl shadow-2xl py-1.5 backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setActiveMenu(null)}
              >
                <button
                  onClick={() => setShowAboutModal(true)}
                  className="w-full text-left px-3 py-1.5 hover:bg-orange-500/20 hover:text-orange-300 flex items-center justify-between"
                >
                  <span>Über PapayaOS</span>
                  <span className="text-[10px] text-neutral-400">v4.2</span>
                </button>
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => onQuickCommand('/status')}
                  className="w-full text-left px-3 py-1.5 hover:bg-orange-500/20 hover:text-orange-300 flex items-center gap-2"
                >
                  <Terminal size={13} className="text-orange-400" />
                  <span>System-Diagnose</span>
                </button>
                <button
                  onClick={() => onQuickCommand('/optimize')}
                  className="w-full text-left px-3 py-1.5 hover:bg-orange-500/20 hover:text-orange-300 flex items-center gap-2"
                >
                  <Sparkles size={13} className="text-amber-400" />
                  <span>RAM & NPU bereinigen</span>
                </button>
                <button
                  onClick={onToggleFocus}
                  className="w-full text-left px-3 py-1.5 hover:bg-orange-500/20 hover:text-orange-300 flex items-center gap-2"
                >
                  <Clock size={13} className="text-emerald-400" />
                  <span>{isFocusActive ? 'Fokus beenden' : 'Fokus starten (25m)'}</span>
                </button>
                {onOpenBetaPage && (
                  <button
                    onClick={onOpenBetaPage}
                    className="w-full text-left px-3 py-1.5 hover:bg-orange-500/20 hover:text-orange-300 flex items-center gap-2"
                  >
                    <Rocket size={13} className="text-orange-400" />
                    <span>Closed Beta Landingpage...</span>
                  </button>
                )}
                {onOpenExportModal && (
                  <button
                    onClick={onOpenExportModal}
                    className="w-full text-left px-3 py-1.5 hover:bg-orange-500/20 hover:text-orange-300 flex items-center gap-2"
                  >
                    <FolderArchive size={13} className="text-amber-400" />
                    <span>Export & System-Backup...</span>
                  </button>
                )}
                <div className="h-px bg-white/10 my-1" />
                <button
                  onClick={() => setShowAboutModal(true)}
                  className="w-full text-left px-3 py-1.5 hover:bg-white/10 text-neutral-400 hover:text-neutral-200"
                >
                  Sperren / Abmelden...
                </button>
              </div>
            )}
          </div>

          {/* Quick Submenus */}
          <div className="hidden sm:flex items-center gap-1 text-neutral-300">
            <button
              onClick={() => onQuickCommand('/automate')}
              className="px-2 py-1 rounded hover:bg-white/10 hover:text-white transition-colors"
            >
              Workflows
            </button>
            <button
              onClick={onToggleFocus}
              className="px-2 py-1 rounded hover:bg-white/10 hover:text-white transition-colors"
            >
              Fokus
            </button>
            <button
              onClick={() => onQuickCommand('Erstelle ein kreatives Konzept')}
              className="px-2 py-1 rounded hover:bg-white/10 hover:text-white transition-colors"
            >
              Creative
            </button>
            {onOpenBetaPage && (
              <button
                onClick={onOpenBetaPage}
                className="px-2.5 py-0.5 rounded-full bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                title="Closed Beta Verkaufsseite"
              >
                <Rocket size={12} className="text-[#FF6B53]" />
                <span>Beta Sell Page</span>
              </button>
            )}
          </div>
        </div>

        {/* Center: Papaya Slogan / Focus Status */}
        <div className="flex items-center gap-2">
          {isFocusActive ? (
            <button
              onClick={onToggleFocus}
              className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 transition-all animate-pulse"
              title="Focus Mode aktiv - klicken zum Pausieren"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-semibold text-[11px]">FOCUS ACTIVE</span>
              <span className="text-[11px] font-mono text-emerald-200">
                {formatSecs(focusRemainingSecs)}
              </span>
            </button>
          ) : (
            <div className="hidden md:flex items-center gap-2 text-[11px] text-neutral-400 font-medium">
              <span className="text-orange-400/90 font-semibold tracking-wider text-[10px]">
                PAPAYA INTELLIGENCE
              </span>
              <span className="text-neutral-600">•</span>
              <span className="italic text-neutral-400">"A fresher way to do more"</span>
            </div>
          )}
        </div>

        {/* Right: Status Icons, Themes, Time */}
        <div className="flex items-center gap-2 text-neutral-300">
          {/* Theme Dropdown / Toggle */}
          <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10">
            <button
              onClick={() => onThemeChange('sunset')}
              className={`p-1 rounded-md transition-colors ${
                theme === 'sunset'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Theme: Sunset Terrace (Papaya Glow)"
            >
              <Sunset size={13} />
            </button>
            <button
              onClick={() => onThemeChange('obsidian')}
              className={`p-1 rounded-md transition-colors ${
                theme === 'obsidian'
                  ? 'bg-neutral-700 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Theme: Papaya Obsidian (Dark)"
            >
              <Moon size={13} />
            </button>
            <button
              onClick={() => onThemeChange('citrus')}
              className={`p-1 rounded-md transition-colors ${
                theme === 'citrus'
                  ? 'bg-amber-400 text-neutral-900 font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Theme: Citrus Clean (Light)"
            >
              <Sun size={13} />
            </button>
          </div>

          {/* Gemini AI Live Status & Token Counter Pill */}
          <div className="relative">
            <button
              id="top-token-stats-pill"
              onClick={() => setShowTokenMenu(!showTokenMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-800/80 hover:bg-neutral-800 border border-white/10 text-[11px] text-neutral-200 transition-all cursor-pointer shadow-sm hover:border-orange-500/40"
              title="Gemini API Token-System: Klicken für Details"
            >
              <Coins size={12} className="text-amber-400" />
              <span className="font-mono text-[10px] font-semibold text-neutral-300">
                {tokenStats
                  ? `${tokenStats.usedTokensToday.toLocaleString('de-DE')} / ${(tokenStats.dailyLimit / 1000).toFixed(0)}k`
                  : '0 / 500k'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {showTokenMenu && (
              <div
                className="absolute right-0 top-8 w-64 bg-neutral-900/95 border border-white/15 rounded-xl shadow-2xl p-3 backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-100 space-y-2.5 text-xs text-neutral-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <Coins size={13} className="text-amber-400" />
                    <span>Gemini API Token-System</span>
                  </div>
                  <button
                    onClick={() => setShowTokenMenu(false)}
                    className="p-0.5 text-neutral-400 hover:text-white"
                  >
                    <X size={13} />
                  </button>
                </div>

                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Heute verbraucht:</span>
                    <span className="font-mono font-bold text-orange-400">
                      {tokenStats ? tokenStats.usedTokensToday.toLocaleString('de-DE') : '0'} Tokens
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Tageskontingent:</span>
                    <span className="font-mono text-neutral-300">
                      {tokenStats ? tokenStats.dailyLimit.toLocaleString('de-DE') : '500.000'} Tokens
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Verfügbar / Rest:</span>
                    <span className="font-mono font-semibold text-emerald-300">
                      {tokenStats ? tokenStats.remainingTokens.toLocaleString('de-DE') : '500.000'} Tokens
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/10">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all"
                    style={{
                      width: `${tokenStats ? Math.max(tokenStats.usagePercentage, 1) : 1}%`,
                    }}
                  />
                </div>

                <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-200 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock size={11} className="text-orange-400" />
                    <span>Reset täglich um 0:00 Uhr</span>
                  </div>
                  <span className="font-mono font-semibold text-white">00:00</span>
                </div>

                <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] text-neutral-300 flex items-center gap-1.5">
                  <Flame size={11} className="text-orange-400 shrink-0" />
                  <span>Modellstärke skaliert Token-Verlust (1x bis 6x).</span>
                </div>

                <button
                  onClick={() => {
                    setShowTokenMenu(false);
                    if (!isInspectorOpen) onToggleInspector();
                  }}
                  className="w-full py-1.5 text-center rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-neutral-300 hover:text-white transition-colors cursor-pointer"
                >
                  Im System Inspector öffnen →
                </button>
              </div>
            )}
          </div>

          {/* Papaya Voice Assistant Quick Launcher */}
          {onOpenVoiceModal && (
            <button
              id="papaya-top-voice-btn"
              onClick={onOpenVoiceModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 hover:text-white font-medium text-xs transition-all cursor-pointer shadow-sm active:scale-95"
              title="Papaya Sprachchat öffnen (3D Partikel-Ball)"
            >
              <Mic size={13} className="text-orange-400 animate-pulse" />
              <span className="font-medium">Voice</span>
            </button>
          )}

          {/* Wi-Fi & Battery */}
          <div className="hidden sm:flex items-center gap-1.5 text-neutral-400">
            <Wifi size={13} className="text-neutral-300" />
            <Battery size={14} className="text-emerald-400" />
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-1.5 font-medium pl-1 border-l border-white/10">
            <span className="hidden sm:inline text-neutral-400 text-[11px]">{dateStr}</span>
            <span className="font-semibold text-white tracking-wide text-[11px] sm:text-xs">{timeStr}</span>
          </div>

          {/* Toggle Inspector Drawer (Zahnrad) */}
          <button
            id="toggle-inspector-btn"
            onClick={onToggleInspector}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
              isInspectorOpen
                ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
                : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
            }`}
            title="System Inspector & Einstellungen (Zahnrad) (⌘J)"
            aria-label="System Inspector ein/ausblenden"
          >
            <Settings size={13} className={`transition-transform duration-300 ${isInspectorOpen ? 'rotate-90 text-orange-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* About PapayaOS Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-neutral-200">
            <button
              onClick={() => setShowAboutModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center">
              <PapayaLogo size={64} className="mb-3 drop-shadow-lg" />
              <h2 className="text-2xl font-black tracking-tight text-white">
                Papaya<span className="text-orange-500">OS</span>
              </h2>
              <span className="text-xs uppercase font-bold tracking-widest text-orange-400 mt-1">
                A Fresher Way To Do More
              </span>
              <p className="text-xs text-neutral-400 mt-1">Version 4.2.1 LTS 'Sunset Edition'</p>

              <div className="w-full bg-white/5 rounded-xl p-3 mt-5 text-left text-xs space-y-1.5 border border-white/5 font-mono">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Kernel:</span>
                  <span className="text-white">Coral-Micro 6.4.1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">AI Hub:</span>
                  <span className="text-orange-400 font-semibold">Gemini 3.8 Flash + Local NPU</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Hardware Arch:</span>
                  <span className="text-white">Coral Silicon-64</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Pillars:</span>
                  <span className="text-emerald-400">Focus • Create • Automate • Evolve</span>
                </div>
              </div>

              <p className="text-xs text-neutral-400 mt-4 leading-relaxed">
                Simple. Powerful. Yours. Entwickelt für Klarheit, fokussiertes Arbeiten und mühelose Workflows.
              </p>

              <button
                onClick={() => setShowAboutModal(false)}
                className="mt-5 w-full py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl text-xs transition-all shadow-md"
              >
                Fertig
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
