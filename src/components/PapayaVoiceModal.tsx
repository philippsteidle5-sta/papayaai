/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Sparkles,
  Square,
  AlertCircle,
  Cpu
} from 'lucide-react';
import { VoiceState, PersonaType } from '../types';
import { PapayaParticleBall } from './PapayaParticleBall';
import { PapayaLogo } from './PapayaLogo';
import {
  playVoiceOpenChime,
  playVoiceCloseChime,
  playPapayaSendSound,
  playPapayaReceiveSound,
  speakPapayaSpeech,
  stopPapayaSpeech,
  getAudioContext,
} from '../utils/papayaSound';

interface PapayaVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePersona: PersonaType;
  onSendMessage: (text: string) => Promise<void> | void;
  onAddVoiceExchange?: (userText: string, assistantReply: string) => void;
  selectedModel: string;
}

export const PapayaVoiceModal: React.FC<PapayaVoiceModalProps> = ({
  isOpen,
  onClose,
  activePersona,
  onSendMessage,
  onAddVoiceExchange,
  selectedModel,
}) => {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isOpenAsPapaya, setIsOpenAsPapaya] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastAssistantReply, setLastAssistantReply] = useState('');
  const [audioEnergy, setAudioEnergy] = useState(0);
  const [isTTSActive, setIsTTSActive] = useState(true);
  const [manualText, setManualText] = useState('');
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);

  const voiceStateRef = useRef<VoiceState>('idle');
  voiceStateRef.current = voiceState;

  const isListeningDesiredRef = useRef<boolean>(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const autoSendTimerRef = useRef<any>(null);

  // Quick starter suggestions
  const quickPrompts = [
    'Wie ist der aktuelle PapayaOS Systemstatus?',
    'Starte einen 25-Minuten Focus Mode Block.',
    'Erstelle mir eine Papaya Flow Automatisierung.',
    'Was ist das Besondere an PapayaOS?',
    'Optimiere den System-Cache und Speicher.',
  ];

  // Open / Close lifecycle
  useEffect(() => {
    if (isOpen) {
      setIsOpenAsPapaya(true);
      playVoiceOpenChime();
      setPermissionNotice(null);
      // Wait a short beat for modal entrance transition before starting mic
      const t = setTimeout(() => {
        startListeningSession();
      }, 350);
      return () => clearTimeout(t);
    } else {
      stopListeningSession();
      stopPapayaSpeech();
      if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);
    }
  }, [isOpen]);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Audio frequency analyzer for realistic visual reactivity
  const initAudioAnalyser = async () => {
    if (micStreamRef.current) return; // already active

    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const ctx = getAudioContext();
      if (!ctx) return;
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const loop = () => {
        if (!isListeningDesiredRef.current && voiceStateRef.current !== 'speaking') {
          setAudioEnergy(0);
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 70);
        setAudioEnergy(normalized);

        animFrameRef.current = requestAnimationFrame(loop);
      };

      animFrameRef.current = requestAnimationFrame(loop);
    } catch (err: any) {
      console.warn('Microphone stream access notice:', err?.message || err);
      // Fallback smooth energy wave during listening
      setPermissionNotice('Mikrofon im Browser nicht freigegeben. Klicke auf ein Thema unten oder tippe deine Frage.');
    }
  };

  // Start Speech Recognition with continuous listening & auto-restart
  const startListeningSession = () => {
    isListeningDesiredRef.current = true;
    setVoiceState('listening');
    setTranscript('');
    setInterimTranscript('');
    setPermissionNotice(null);

    // Cancel ongoing speech if any
    stopPapayaSpeech();

    // Start Audio Analyser for particles
    initAudioAnalyser();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setPermissionNotice('Web Speech API wird von diesem Browser nicht nativ unterstützt. Nutze die Vorschläge oder das Textfeld.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'de-DE';
      recognition.continuous = true; // DO NOT EXIT on pause!
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setVoiceState('listening');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        if (final) {
          setTranscript((prev) => {
            const updated = prev ? `${prev} ${final.trim()}` : final.trim();
            // Debounce auto-submit: if user pauses for 1.8s after speaking a final sentence
            if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);
            autoSendTimerRef.current = setTimeout(() => {
              if (isListeningDesiredRef.current && updated.trim().length > 2) {
                handleProcessVoicePrompt(updated.trim());
              }
            }, 1800);
            return updated;
          });
          setInterimTranscript('');
        } else if (interim) {
          setInterimTranscript(interim);
          // Reset timer while actively speaking
          if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('SpeechRecognition event notice:', e.error);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setPermissionNotice('Mikrofon-Berechtigung im Browser erforderlich. Klicke auf ein Thema oder nutze die Tastatur.');
          isListeningDesiredRef.current = false;
          setVoiceState('idle');
        } else if (e.error === 'no-speech') {
          // Normal silence, keep listening!
        }
      };

      recognition.onend = () => {
        // If the user still wants to listen, seamlessly restart so it doesn't snap shut
        if (isListeningDesiredRef.current && voiceStateRef.current === 'listening') {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e: any) {
      console.warn('SpeechRecognition initial start exception:', e);
    }
  };

  const stopListeningSession = () => {
    isListeningDesiredRef.current = false;
    if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setVoiceState('idle');
    setAudioEnergy(0);
  };

  // Submit recognized or selected query to Gemini
  const handleProcessVoicePrompt = async (promptText: string) => {
    const text = promptText.trim();
    if (!text) return;

    if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);
    isListeningDesiredRef.current = false;

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    setTranscript(text);
    setInterimTranscript('');
    setVoiceState('thinking');
    playPapayaSendSound();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `${text}\n\n[Regel für Sprachausgabe: Antworte als extrem lebendiger, charismatischer und herzlicher PapayaOS Begleiter mit echter Persönlichkeit, Begeisterung und Humor. Antworte gesprochen, flüssig und mitreißend auf Deutsch in 2 bis maximal 3 Sätzen. Keine starren Floskeln wie 'Zu deiner Anfrage' oder 'Ich bin dein Assistent', keine Markdown-Listen.]`,
            },
          ],
          persona: activePersona,
          model: selectedModel,
        }),
      });

      const data = await res.json();
      const reply = data.reply || 'Mega Idee! Ich bin absolut begeistert und voll dabei – lass uns das anpacken!';
      setLastAssistantReply(reply);

      // Mirror into primary chat thread cleanly without triggering duplicate network requests
      if (onAddVoiceExchange) {
        onAddVoiceExchange(text, reply);
      } else {
        onSendMessage(text);
      }
      playPapayaReceiveSound();

      if (isTTSActive) {
        setVoiceState('speaking');
        // Simulated voice energy pulse during TTS
        const speakInterval = setInterval(() => {
          setAudioEnergy(0.25 + Math.random() * 0.45);
        }, 80);

        speakPapayaSpeech(
          reply,
          () => {
            setVoiceState('speaking');
          },
          () => {
            clearInterval(speakInterval);
            setAudioEnergy(0);
            setVoiceState('idle');
          },
          () => {
            clearInterval(speakInterval);
            setAudioEnergy(0);
            setVoiceState('idle');
          }
        );
      } else {
        setVoiceState('idle');
      }
    } catch (err) {
      console.error('Gemini Voice query error:', err);
      setLastAssistantReply('Die Antwort konnte nicht geladen werden. Bitte versuche es erneut.');
      setVoiceState('idle');
    }
  };

  const handleToggleMorph = () => {
    const next = !isOpenAsPapaya;
    setIsOpenAsPapaya(next);
    if (next) {
      playVoiceOpenChime();
    } else {
      playVoiceCloseChime();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    const q = manualText.trim();
    setManualText('');
    handleProcessVoicePrompt(q);
  };

  const handleMicButtonClick = () => {
    if (voiceState === 'listening') {
      // If user has already spoken, submit it immediately!
      const current = (transcript + ' ' + interimTranscript).trim();
      if (current.length > 1) {
        handleProcessVoicePrompt(current);
      } else {
        stopListeningSession();
      }
    } else if (voiceState === 'speaking') {
      stopPapayaSpeech();
      setVoiceState('idle');
      setAudioEnergy(0);
    } else if (voiceState === 'thinking') {
      setVoiceState('idle');
    } else {
      startListeningSession();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        id="papaya-voice-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          id="papaya-voice-window"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-4xl h-[92vh] max-h-[740px] bg-[#0C0805]/95 border border-orange-500/30 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col"
        >
          {/* Top Bar with clear, un-duplicated controls */}
          <div className="h-14 px-5 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md shadow-orange-500/20">
                <PapayaLogo size={18} />
              </div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-tight">
                  Papaya<span className="text-orange-500">OS</span> Voice
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/25">
                  <Cpu size={10} />
                  <span>NPU GEMINI 3.8</span>
                </span>
              </div>
            </div>

            {/* Single Clean Segmented View Toggle & Audio Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                <button
                  id="view-papaya-toggle-btn"
                  type="button"
                  onClick={() => {
                    if (!isOpenAsPapaya) handleToggleMorph();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    isOpenAsPapaya
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Aufgeschnittene Papaya mit Kernen anzeigen"
                >
                  <span>🥭</span>
                  <span className="hidden sm:inline">Papaya</span>
                </button>
                <button
                  id="view-sphere-toggle-btn"
                  type="button"
                  onClick={() => {
                    if (isOpenAsPapaya) handleToggleMorph();
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    !isOpenAsPapaya
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                  title="Als geschlossene Kugel anzeigen"
                >
                  <span>🔮</span>
                  <span className="hidden sm:inline">Sphäre</span>
                </button>
              </div>

              {/* TTS Sound Toggle */}
              <button
                id="voice-tts-toggle-btn"
                type="button"
                onClick={() => {
                  const next = !isTTSActive;
                  setIsTTSActive(next);
                  if (!next) stopPapayaSpeech();
                }}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isTTSActive
                    ? 'bg-orange-500/15 border-orange-500/30 text-orange-300 hover:bg-orange-500/25'
                    : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white'
                }`}
                title={isTTSActive ? 'Sprachausgabe aktiv' : 'Sprachausgabe stummgeschaltet'}
              >
                {isTTSActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              {/* Modal Close Button */}
              <button
                id="voice-modal-close-btn"
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white transition-colors cursor-pointer ml-1"
                title="Schließen (ESC)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Central 3D Stage (Completely Flicker-Free, Clean & Spacious) */}
          <div className="flex-1 flex flex-col items-center justify-between p-4 overflow-hidden relative">
            {/* Status Pill */}
            <div className="z-10 mt-1">
              <div
                className={`inline-flex items-center gap-2 px-4 py-1 rounded-full border text-[11px] font-mono uppercase tracking-wider backdrop-blur-md shadow-lg transition-all ${
                  voiceState === 'listening'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-emerald-500/20'
                    : voiceState === 'thinking'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-amber-500/20'
                    : voiceState === 'speaking'
                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 shadow-orange-500/20'
                    : 'bg-neutral-900/80 border-white/10 text-neutral-400'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      voiceState === 'listening'
                        ? 'bg-emerald-400'
                        : voiceState === 'thinking'
                        ? 'bg-amber-400'
                        : voiceState === 'speaking'
                        ? 'bg-orange-400'
                        : 'bg-neutral-500'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      voiceState === 'listening'
                        ? 'bg-emerald-500'
                        : voiceState === 'thinking'
                        ? 'bg-amber-500'
                        : voiceState === 'speaking'
                        ? 'bg-orange-500'
                        : 'bg-neutral-500'
                    }`}
                  />
                </span>
                <span className="font-semibold">
                  {voiceState === 'listening'
                    ? 'Zuhören... (Sprich jetzt)'
                    : voiceState === 'thinking'
                    ? 'Papaya Intelligence generiert...'
                    : voiceState === 'speaking'
                    ? 'Papaya antwortet per Stimme...'
                    : 'Bereit zum Sprechen'}
                </span>
              </div>
            </div>

            {/* 3D Particle Ball Canvas Component */}
            <div className="relative flex items-center justify-center w-full max-w-[380px] aspect-square my-auto">
              <PapayaParticleBall
                voiceState={voiceState}
                isOpenAsPapaya={isOpenAsPapaya}
                audioEnergy={audioEnergy}
                size={340}
              />
            </div>

            {/* Live Transcription / Assistant Speech Card */}
            <div className="w-full max-w-xl mx-auto z-10 mb-2">
              {permissionNotice && (
                <div className="mb-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-200">
                  <AlertCircle size={15} className="text-amber-400 shrink-0" />
                  <span className="leading-snug">{permissionNotice}</span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-xl shadow-xl min-h-[76px] flex flex-col justify-center">
                {interimTranscript || transcript ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Deine Spracheingabe:
                      </span>
                      {voiceState === 'listening' && (
                        <button
                          type="button"
                          onClick={() => handleProcessVoicePrompt((transcript + ' ' + interimTranscript).trim())}
                          className="text-[11px] font-medium text-orange-400 hover:text-orange-300 underline cursor-pointer"
                        >
                          Jetzt senden →
                        </button>
                      )}
                    </div>
                    <p className="text-sm font-medium text-white leading-relaxed">
                      {transcript || interimTranscript}
                      {interimTranscript && (
                        <span className="inline-block w-1.5 h-3 ml-1 bg-orange-400 animate-pulse" />
                      )}
                    </p>
                  </div>
                ) : lastAssistantReply ? (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-orange-400 flex items-center gap-1.5">
                        <Sparkles size={11} />
                        Papaya Intelligence:
                      </span>
                      {voiceState === 'speaking' && (
                        <button
                          type="button"
                          onClick={() => {
                            stopPapayaSpeech();
                            setVoiceState('idle');
                          }}
                          className="flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-200 cursor-pointer"
                        >
                          <Square size={10} />
                          <span>Stoppen</span>
                        </button>
                      )}
                    </div>
                    <p className="text-xs md:text-sm text-neutral-200 leading-relaxed max-h-24 overflow-y-auto custom-scrollbar">
                      {lastAssistantReply}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-1">
                    <p className="text-xs text-neutral-400">
                      {voiceState === 'listening'
                        ? 'Sprich eine Frage aus oder klicke auf einen der Schnellstarter unten...'
                        : 'Klicke auf den orangen Button, um die Spracheingabe zu starten.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Starter Chips */}
          <div className="px-5 py-2 overflow-x-auto custom-scrollbar flex items-center gap-2 bg-black/30 border-t border-white/5 shrink-0">
            <span className="text-[10px] font-mono uppercase text-neutral-400 shrink-0">
              Vorschläge:
            </span>
            {quickPrompts.map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTranscript(qp);
                  handleProcessVoicePrompt(qp);
                }}
                className="px-3 py-1 rounded-full bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/30 text-neutral-300 hover:text-white text-xs whitespace-nowrap transition-all cursor-pointer shrink-0 active:scale-95"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Bottom Controls Bar */}
          <div className="p-4 bg-black/50 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            {/* Fallback Text Input */}
            <form onSubmit={handleManualSubmit} className="flex-1 w-full flex items-center gap-2">
              <input
                id="voice-manual-text-input"
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Alternativ Frage per Text eingeben..."
                className="flex-1 px-4 py-2.5 bg-neutral-900/90 border border-white/10 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500/50"
              />
              <button
                id="voice-manual-submit-btn"
                type="submit"
                disabled={!manualText.trim()}
                className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white transition-colors cursor-pointer"
                title="Absenden"
              >
                <Send size={14} />
              </button>
            </form>

            {/* Big Mic Button - Never Abruptly Closes */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="voice-main-mic-btn"
                type="button"
                onClick={handleMicButtonClick}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl font-semibold text-xs shadow-xl transition-all cursor-pointer active:scale-95 ${
                  voiceState === 'listening'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/30 ring-2 ring-emerald-400/40'
                    : voiceState === 'speaking'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-orange-500/30'
                    : voiceState === 'thinking'
                    ? 'bg-neutral-700 text-neutral-300'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-orange-500/30 hover:from-orange-600 hover:to-amber-600'
                }`}
              >
                {voiceState === 'listening' ? (
                  <>
                    <Square size={14} className="fill-white" />
                    <span>Fertig & Senden</span>
                  </>
                ) : voiceState === 'speaking' ? (
                  <>
                    <Square size={14} className="fill-white" />
                    <span>Antwort stoppen</span>
                  </>
                ) : voiceState === 'thinking' ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Generiert...</span>
                  </>
                ) : (
                  <>
                    <Mic size={15} />
                    <span>Sprechen starten</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
