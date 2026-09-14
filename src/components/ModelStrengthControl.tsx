import React, { useState, useRef, useEffect } from 'react';
import {
  Zap,
  ChevronDown,
  Sparkles,
  Check,
  Flame,
  Leaf,
  Brain,
  Rocket,
  Minus,
  Plus,
  Sliders,
  AlertTriangle,
  Coins
} from 'lucide-react';
import { ModelStrengthConfig, StrengthLevel } from '../types';

export const STRENGTH_LEVELS: ModelStrengthConfig[] = [
  {
    level: 1,
    modelId: 'gemini-3.5-flash-lite',
    strengthName: 'Schwach',
    modelDisplay: 'Gemini 3.5 Flash-Lite (Ultra-Fast)',
    tagline: 'Ultraschnell (~0.5s) & minimale Latenz (Standard)',
    description: 'Extrem schnelle Echtzeit-Antworten mit unter 600ms Reaktionszeit. Ideal für flüssigen Chat & minimale Tokenlast.',
    color: '#10b981',
    barClass: 'bg-emerald-500',
    pillBg: 'bg-emerald-500/15',
    pillBorder: 'border-emerald-500/35',
    textColor: 'text-emerald-400',
    tokenMultiplier: 1.0,
    tokenConsumptionLabel: '1x Verlust (Eco-Speed)',
    tokenLossWarning: '🍃 Minimaler Verlust: Verbraucht nur Basis-Tokens (1x) bei maximaler Geschwindigkeit.',
  },
  {
    level: 2,
    modelId: 'gemini-3.6-flash',
    strengthName: 'Mittel',
    modelDisplay: 'Gemini 3.6 Flash (Smart)',
    tagline: 'Ausgewogen, smart & multimodal',
    description: 'Neueste Modellarchitektur mit exzellentem Textverständnis und Code-Fähigkeiten.',
    color: '#38bdf8',
    barClass: 'bg-sky-500',
    pillBg: 'bg-sky-500/15',
    pillBorder: 'border-sky-500/35',
    textColor: 'text-sky-400',
    tokenMultiplier: 2.0,
    tokenConsumptionLabel: '2x Verlust',
    tokenLossWarning: '⚡ Ausgewogen: Schnell mit erweitertem Kontext.',
  },
  {
    level: 3,
    modelId: 'gemini-3.8-flash',
    strengthName: 'Stark',
    modelDisplay: 'Gemini 3.8 Flash (Power)',
    tagline: 'Next-Gen Multi-Modal Power',
    description: 'Hohe Allround-Power für komplexe Aufgabenstellungen.',
    color: '#f97316',
    barClass: 'bg-orange-500',
    pillBg: 'bg-orange-500/15',
    pillBorder: 'border-orange-500/35',
    textColor: 'text-orange-400',
    tokenMultiplier: 4.0,
    tokenConsumptionLabel: '4x Hoher Verlust',
    tokenLossWarning: '🔥 Hoher Verlust: Volle Reaktionsstärke verbraucht 4x Tokens vom Tagesguthaben.',
  },
  {
    level: 4,
    modelId: 'gemini-3.1-pro-preview',
    strengthName: 'Max',
    modelDisplay: 'Gemini 3.1 Pro Max',
    tagline: 'Next-Gen Deep Reasoning & Maximale Power',
    description: 'Maximale Modellstärke mit tiefgreifender Logik & Code-Synthese für anspruchsvollste Aufgaben.',
    color: '#f43f5e',
    barClass: 'bg-rose-500',
    pillBg: 'bg-rose-500/15',
    pillBorder: 'border-rose-500/35',
    textColor: 'text-rose-400',
    tokenMultiplier: 6.0,
    tokenConsumptionLabel: '6x EXTREMER TOKEN-VERLUST!',
    tokenLossWarning: '⚠️ MAXIMALER TOKEN-VERLUST: Verbrennt 6x Tokens pro Nachricht!',
  },
];

interface ModelStrengthControlProps {
  selectedModel: string;
  onSelectModel: (modelId: string, levelName: string) => void;
}

export const ModelStrengthControl: React.FC<ModelStrengthControlProps> = ({
  selectedModel,
  onSelectModel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine current active config (defaults to level 3 - Stark / 3.5 Flash)
  const currentConfig =
    STRENGTH_LEVELS.find((lvl) => lvl.modelId === selectedModel) ||
    STRENGTH_LEVELS[2];

  const currentLevel = currentConfig.level;

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLevelChange = (newLevel: StrengthLevel) => {
    const target = STRENGTH_LEVELS.find((l) => l.level === newLevel);
    if (target) {
      onSelectModel(target.modelId, target.strengthName);
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10) as StrengthLevel;
    handleLevelChange(val);
  };

  const stepDown = () => {
    if (currentLevel > 1) {
      handleLevelChange((currentLevel - 1) as StrengthLevel);
    }
  };

  const stepUp = () => {
    if (currentLevel < 4) {
      handleLevelChange((currentLevel + 1) as StrengthLevel);
    }
  };

  const getLevelIcon = (level: StrengthLevel, size = 14) => {
    switch (level) {
      case 1:
        return <Leaf size={size} className="text-emerald-400" />;
      case 2:
        return <Brain size={size} className="text-amber-400" />;
      case 3:
        return <Flame size={size} className="text-orange-400" />;
      case 4:
        return <Rocket size={size} className="text-rose-400" />;
    }
  };

  return (
    <div id="papaya-model-strength-container" ref={containerRef} className="relative z-50">
      {/* Main Trigger Pill with 4-Segment Strength Bar - Pure Papaya Orange */}
      <button
        id="model-strength-trigger-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl border border-orange-500/35 bg-orange-500/15 hover:bg-orange-500/25 text-orange-200 transition-all shadow-sm cursor-pointer hover:border-orange-500/50 active:scale-98 shrink-0"
        title="KI-Stärke anpassen (Schwach • Mittel • Stark • Max)"
      >
        {/* Pulsing Strength / Zap Icon */}
        <div className="flex items-center gap-1 shrink-0">
          <Zap
            size={13}
            className="text-orange-400 fill-orange-400 animate-pulse"
          />
          <span className="text-[11px] font-medium text-orange-200/90 hidden md:inline">
            Stärke:
          </span>
        </div>

        {/* 4-Segment Visual Strength Bar - Orange Glow */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-black/40 p-0.5 sm:p-1 rounded-md border border-orange-500/25 shrink-0">
          {[1, 2, 3, 4].map((step) => {
            const isFilled = step <= currentLevel;
            return (
              <div
                key={step}
                className={`h-2 sm:h-2.5 w-2 sm:w-3.5 rounded-xs transition-all duration-300 ${
                  isFilled
                    ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]'
                    : 'bg-white/10'
                }`}
                title={`Stufe ${step}`}
              />
            );
          })}
        </div>

        {/* Current Strength Text Badge */}
        <div className="flex items-center gap-1 font-mono text-[11px] sm:text-xs font-semibold shrink-0">
          <span className="text-orange-300 font-bold">
            {currentConfig.strengthName}
          </span>
          <span className="text-[10px] text-orange-200/60 hidden lg:inline">
            ({currentConfig.modelDisplay.replace('Gemini ', '')})
          </span>
        </div>

        {/* Token Loss Multiplier Tag */}
        <span
          className={`text-[9px] font-mono px-1 sm:px-1.5 py-0.5 rounded-md border font-semibold flex items-center gap-0.5 sm:gap-1 shrink-0 ${
            currentLevel === 1
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : currentLevel === 2
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              : currentLevel === 3
              ? 'bg-orange-500/20 border-orange-500/40 text-orange-300'
              : 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
          }`}
          title={`Token-Verlust: ${currentConfig.tokenMultiplier}x Multiplikator`}
        >
          <Flame size={10} className={currentLevel >= 3 ? 'text-orange-400' : 'text-emerald-400'} />
          <span>{currentConfig.tokenMultiplier}x</span>
          <span className="hidden sm:inline">Tokens</span>
        </span>

        <ChevronDown
          size={12}
          className={`text-orange-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-orange-300' : ''
          }`}
        />
      </button>

      {/* Popover Menu with Interactive Slider & Level Cards */}
      {isOpen && (
        <>
          {/* Mobile backdrop for smooth tap outside */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[95] sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div
            id="model-strength-popover"
            className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-full mt-1 sm:mt-2 max-w-[calc(100vw-16px)] sm:w-[400px] bg-neutral-950/98 border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-3.5 z-[100] backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-150 font-sans mx-auto sm:mx-0 max-h-[82vh] overflow-y-auto"
          >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10 text-xs">
            <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-orange-400 text-[11px]">
              <Sliders size={13} />
              <span>KI-Stärke & Token-Verbrauch</span>
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border bg-orange-500/15 border-orange-500/35 text-orange-300">
              Stufe {currentLevel}/4 • {currentConfig.strengthName}
            </span>
          </div>

          {/* Interactive Range Slider with Glowing Gradient Bar */}
          <div className="px-1 py-2 mb-3 bg-black/40 rounded-xl border border-white/5">
            <div className="flex items-center justify-between mb-1.5 text-[11px] text-neutral-400 font-mono px-1">
              <span>1: Schwach</span>
              <span>2: Mittel</span>
              <span>3: Stark</span>
              <span className="text-rose-400 font-semibold">4: Max</span>
            </div>

            {/* Slider Track Container */}
            <div className="relative flex items-center px-1 my-2">
              {/* Colored Progress Fill */}
              <div className="absolute left-1 right-1 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400"
                  style={{
                    width: `${((currentLevel - 1) / 3) * 100}%`,
                  }}
                />
              </div>

              {/* Native Range Input */}
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={currentLevel}
                onChange={handleSliderChange}
                className="relative z-10 w-full h-4 appearance-none bg-transparent cursor-pointer accent-orange-500 focus:outline-none"
              />
            </div>

            {/* Step adjustment buttons */}
            <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5 px-1">
              <button
                type="button"
                onClick={stepDown}
                disabled={currentLevel <= 1}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                  currentLevel <= 1
                    ? 'text-neutral-600 cursor-not-allowed'
                    : 'text-neutral-300 hover:bg-white/10 hover:text-white cursor-pointer'
                }`}
              >
                <Minus size={12} />
                <span>Schwächer</span>
              </button>

              <span className="text-[11px] font-semibold text-orange-300">
                {currentConfig.modelDisplay}
              </span>

              <button
                type="button"
                onClick={stepUp}
                disabled={currentLevel >= 4}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                  currentLevel >= 4
                    ? 'text-neutral-600 cursor-not-allowed'
                    : 'text-neutral-300 hover:bg-white/10 hover:text-white cursor-pointer'
                }`}
              >
                <span>Stärker</span>
                <Plus size={12} />
              </button>
            </div>

            {/* Prominent Token-Verlust Scaling Indicator */}
            <div className="mt-2.5 mx-1 p-2 rounded-lg bg-neutral-900/90 border border-white/10 text-xs">
              <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                <span className="flex items-center gap-1.5 text-neutral-300 font-semibold">
                  <Coins size={12} className="text-amber-400" />
                  <span>Token-Verlust Multiplikator:</span>
                </span>
                <span
                  className={`font-bold px-1.5 py-0.5 rounded border text-[11px] flex items-center gap-1 ${
                    currentLevel === 4
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                      : currentLevel === 3
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : currentLevel === 2
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  <Flame size={11} />
                  <span>{currentConfig.tokenMultiplier}x Verlust</span>
                </span>
              </div>

              {/* Dynamic burn meter */}
              <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden my-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    currentLevel === 4
                      ? 'bg-rose-500 w-full shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                      : currentLevel === 3
                      ? 'bg-orange-500 w-[66%]'
                      : currentLevel === 2
                      ? 'bg-amber-500 w-[42%]'
                      : 'bg-emerald-500 w-[17%]'
                  }`}
                />
              </div>

              <div className="text-[10px] text-neutral-300 leading-snug flex items-center gap-1.5 pt-0.5">
                <AlertTriangle size={12} className="shrink-0 text-amber-400" />
                <span>
                  <strong>Token-Verlust-Skalierung:</strong> {currentConfig.tokenLossWarning}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Level Cards */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar pr-0.5">
            {STRENGTH_LEVELS.map((lvl) => {
              const isSelected = lvl.level === currentLevel;
              return (
                <button
                  key={lvl.level}
                  type="button"
                  onClick={() => handleLevelChange(lvl.level)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer border ${
                    isSelected
                      ? 'bg-orange-500/15 border-orange-500/35 shadow-md'
                      : 'bg-white/5 border-transparent hover:bg-white/10 text-neutral-300'
                  }`}
                >
                  {/* Icon & Notch */}
                  <div
                    className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                      isSelected ? 'bg-black/40 border border-orange-500/30' : 'bg-white/5'
                    }`}
                  >
                    {getLevelIcon(lvl.level, 16)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold text-xs ${isSelected ? 'text-orange-300' : 'text-neutral-200'}`}>
                          {lvl.strengthName}
                        </span>
                        <span className="text-[11px] font-medium text-white">
                          • {lvl.modelDisplay}
                        </span>
                      </div>
                      {isSelected && (
                        <Check size={14} className="text-orange-400 shrink-0" />
                      )}
                    </div>

                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                      {lvl.tagline}
                    </div>

                    <div className="text-[10px] text-neutral-400 mt-1 leading-snug">
                      {lvl.description}
                    </div>

                    {/* Token penalty badge on each level */}
                    <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-white/5 text-[10px] font-mono">
                      <span className={`px-1.5 py-0.5 rounded font-semibold border flex items-center gap-1 ${
                        lvl.level === 4
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                          : lvl.level === 3
                          ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
                          : lvl.level === 2
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      }`}>
                        <Flame size={10} />
                        <span>{lvl.tokenMultiplier}x Verlust</span>
                      </span>
                      <span className="text-neutral-400 text-[9px]">
                        {lvl.level === 1 ? 'Minimaler Verlust' : lvl.level === 4 ? 'Extremer Token-Verlust' : `${lvl.tokenMultiplier}x mehr Verlust`}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Footer note */}
          <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-neutral-400">
            <span className="flex items-center gap-1">
              <Sparkles size={11} className="text-orange-400" />
              <span>Gilt sofort für alle neuen Nachrichten</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-orange-400 hover:text-orange-300 font-medium cursor-pointer"
            >
              Fertig
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
};
