/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Sliders,
  Menu,
  Terminal,
  Clock,
  Layers,
  Zap,
  ArrowRight,
  Maximize2,
  Minimize2,
  Share2,
  Trash2,
  Cpu,
  ChevronDown,
  Mic,
  FolderArchive,
  Rocket,
  Settings
} from 'lucide-react';
import {
  ChatThread,
  ChatMessage,
  PersonaType,
  OSTheme,
  ActionItem,
  SystemStatus,
  DailyTokenStats,
  CustomPlugin,
  ChatAttachment
} from './types';
import { INITIAL_THREADS, INITIAL_SYSTEM_STATUS, QUICK_PROMPTS } from './data/initialData';
import { PapayaLogo } from './components/PapayaLogo';
import { TopMenuBar } from './components/TopMenuBar';
import { Sidebar } from './components/Sidebar';
import { ChatMessageItem } from './components/ChatMessageItem';
import { ChatInput } from './components/ChatInput';
import { InspectorDrawer } from './components/InspectorDrawer';
import { FocusWidget } from './components/FocusWidget';
import { PapayaVoiceModal } from './components/PapayaVoiceModal';
import { ExportBackupModal } from './components/ExportBackupModal';
import { ClosedBetaPage } from './components/ClosedBetaPage';
import { ModelStrengthControl } from './components/ModelStrengthControl';
import {
  playPapayaSendSound,
  playPapayaReceiveSound,
  playFocusChime,
  toggleAmbientFocusSound
} from './utils/papayaSound';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<OSTheme>('sunset');

  // Selected Gemini model (default: gemini-3.5-flash-lite for ultra-fast ~0.5s responses)
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash-lite');
  const [geminiConnected, setGeminiConnected] = useState(true);

  // Chats & Persona state
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    const saved = localStorage.getItem('papaya_threads');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_THREADS;
  });

  const [activeThreadId, setActiveThreadId] = useState<string>(() => {
    const savedId = localStorage.getItem('papaya_active_thread_id');
    if (savedId) return savedId;
    return threads[0]?.id || 'thread-welcome';
  });
  const [activePersona, setActivePersona] = useState<PersonaType>('assistant');

  // Loading / Streaming state
  const [isLoading, setIsLoading] = useState(false);

  // UI Panels
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // System Telemetry
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(INITIAL_SYSTEM_STATUS);

  // Focus Mode State
  const [isFocusActive, setIsFocusActive] = useState(false);
  const [focusRemainingSecs, setFocusRemainingSecs] = useState(25 * 60);
  const [isFocusPaused, setIsFocusPaused] = useState(false);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Papaya Voice Chat Modal State (3D Particle Papaya)
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);

  // Closed Beta & Export Modals (Default view is Closed Beta / Salespage)
  const [currentView, setCurrentView] = useState<'chat' | 'beta'>(() =>
    window.location.hash === '#chat' ? 'chat' : 'beta'
  );
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Custom Plugins State (Persistent locally & on server)
  const [customPlugins, setCustomPlugins] = useState<CustomPlugin[]>(() => {
    const saved = localStorage.getItem('papaya_custom_plugins');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {}
    }
    return [];
  });

  // Gemini API Token Stats (Daily reset at 00:00 midnight)
  const [tokenStats, setTokenStats] = useState<DailyTokenStats | null>(null);

  const fetchTokenStats = () => {
    fetch('/api/tokens')
      .then((r) => r.json())
      .then((data: DailyTokenStats) => {
        if (data && typeof data.usedTokensToday === 'number') {
          setTokenStats(data);
        }
      })
      .catch((err) => console.warn('Could not fetch token stats:', err));
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check Gemini connection health and token stats on startup
  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.hasGeminiKey) {
          setGeminiConnected(true);
        }
      })
      .catch(() => {});

    fetchTokenStats();
    // Poll every 30 seconds for live token sync
    const tokenInterval = setInterval(fetchTokenStats, 30000);

    // Initial server threads sync
    fetch('/api/threads')
      .then((r) => r.json())
      .then((data) => {
        if (data?.threads && Array.isArray(data.threads) && data.threads.length > 0) {
          setThreads((local) => {
            const hasLocalSaved = !!localStorage.getItem('papaya_threads');
            // If local storage is empty or only default, use server data
            if (!hasLocalSaved || local.length <= 1) {
              return data.threads;
            }
            return local;
          });
        }
      })
      .catch((err) => console.warn('Could not sync threads from server:', err));

    // Initial server plugins sync
    fetch('/api/plugins')
      .then((r) => r.json())
      .then((data) => {
        if (data?.plugins && Array.isArray(data.plugins)) {
          setCustomPlugins((local) => {
            const hasLocalSaved = !!localStorage.getItem('papaya_custom_plugins');
            if (!hasLocalSaved || local.length === 0) {
              return data.plugins;
            }
            return local;
          });
        }
      })
      .catch((err) => console.warn('Could not sync plugins from server:', err));

    // Listen to hash changes (defaulting to closed beta page unless #chat is explicitly present)
    const handleHash = () => {
      if (window.location.hash === '#chat') {
        setCurrentView('chat');
      } else {
        setCurrentView('beta');
      }
    };
    window.addEventListener('hashchange', handleHash);

    return () => {
      clearInterval(tokenInterval);
      window.removeEventListener('hashchange', handleHash);
    };
  }, []);

  // Sync active thread ID to localStorage
  useEffect(() => {
    if (activeThreadId) {
      localStorage.setItem('papaya_active_thread_id', activeThreadId);
    }
  }, [activeThreadId]);

  // Sync threads to localStorage and debounced server persistence
  useEffect(() => {
    localStorage.setItem('papaya_threads', JSON.stringify(threads));

    // Debounced sync to server
    const timer = setTimeout(() => {
      fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threads }),
      }).catch((e) => console.warn('Error saving threads to server:', e));
    }, 500);

    return () => clearTimeout(timer);
  }, [threads]);

  // Sync custom plugins to localStorage and debounced server persistence
  useEffect(() => {
    localStorage.setItem('papaya_custom_plugins', JSON.stringify(customPlugins));

    const timer = setTimeout(() => {
      fetch('/api/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plugins: customPlugins }),
      }).catch((e) => console.warn('Error saving plugins to server:', e));
    }, 500);

    return () => clearTimeout(timer);
  }, [customPlugins]);

  // Focus Timer Tick
  useEffect(() => {
    let interval: any;
    if (isFocusActive && !isFocusPaused && focusRemainingSecs > 0) {
      interval = setInterval(() => {
        setFocusRemainingSecs((prev) => {
          if (prev <= 1) {
            playFocusChime();
            showToast('🎉 Focus Session erfolgreich beendet! Zeit für eine Pause.');
            setIsFocusActive(false);
            toggleAmbientFocusSound(false);
            setIsAmbientPlaying(false);
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isFocusActive, isFocusPaused, focusRemainingSecs]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threads, activeThreadId, isLoading]);

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  const handleToggleFocus = (minutes = 25) => {
    if (isFocusActive) {
      setIsFocusActive(false);
      toggleAmbientFocusSound(false);
      setIsAmbientPlaying(false);
      showToast('Focus Mode beendet');
    } else {
      setIsFocusActive(true);
      setIsFocusPaused(false);
      setFocusRemainingSecs(minutes * 60);
      playFocusChime();
      showToast(`🧘 Focus Mode aktiviert (${minutes} Minuten Deep Work)`);
    }
  };

  const handleToggleAmbient = () => {
    const nextState = !isAmbientPlaying;
    toggleAmbientFocusSound(nextState);
    setIsAmbientPlaying(nextState);
    showToast(nextState ? '🎵 Sunset Drone Sound aktiv' : '🔇 Audio stummgeschaltet');
  };

  const handleOptimizeRAM = () => {
    setSystemStatus((prev) => ({
      ...prev,
      cpuUsage: 11,
      ramUsageGb: '3.8',
    }));
    playPapayaSendSound();
    showToast('⚡ 1.8 GB RAM freigegeben & NPU-Cache optimiert');
  };

  const handleNewThread = (persona: PersonaType = 'assistant') => {
    const newId = `thread-${Date.now()}`;
    const personaTitles: Record<PersonaType, string> = {
      assistant: '🥭 Neue Unterhaltung',
      focus: '🧘 Focus & Productivity Plan',
      creative: '🎨 Kreativer Entwurf',
      automator: '⚙️ Neuer Papaya Workflow',
      wellness: '🌿 Mind & Balance Session',
    };

    const newThread: ChatThread = {
      id: newId,
      title: personaTitles[persona],
      persona: persona,
      updatedAt: 'Gerade eben',
      isPinned: false,
      messages: [],
    };

    setThreads((prev) => [newThread, ...prev]);
    setActiveThreadId(newId);
    setActivePersona(persona);
    setIsSidebarOpen(false);
    showToast('Neuer Chat erstellt und im Seitenmenü gesichert');
  };

  const handleRenameThread = (id: string, newTitle: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle, updatedAt: 'Gerade eben' } : t))
    );
    showToast(`Chat umbenannt: "${newTitle}"`);
  };

  const handleDeleteThread = (id: string) => {
    setThreads((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (filtered.length === 0) {
        return INITIAL_THREADS;
      }
      return filtered;
    });
    if (activeThreadId === id) {
      const remaining = threads.filter((t) => t.id !== id);
      if (remaining.length > 0) {
        setActiveThreadId(remaining[0].id);
      }
    }
    showToast('Chat aus Seitenmenü gelöscht');
  };

  const handleTogglePin = (id: string) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isPinned: !t.isPinned } : t))
    );
  };

  // Custom Plugin Handlers
  const handleSavePlugin = (plugin: CustomPlugin) => {
    setCustomPlugins((prev) => {
      const idx = prev.findIndex((p) => p.id === plugin.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = plugin;
        return updated;
      }
      return [plugin, ...prev];
    });
    showToast(`🧩 Plugin "${plugin.name}" gespeichert`);
  };

  const handleDeletePlugin = (id: string) => {
    setCustomPlugins((prev) => prev.filter((p) => p.id !== id));
    showToast('Plugin gelöscht');
  };

  const handleTogglePlugin = (id: string) => {
    playPapayaSendSound();
    setCustomPlugins((prev) =>
      prev.map((p) => (p.id === id ? { ...p, active: !p.active } : p))
    );
  };

  const handleRunPlugin = (plugin: CustomPlugin) => {
    handleSendMessage(`${plugin.commandTrigger} Ausführen`);
  };

  // Restore backup from ExportBackupModal
  const handleRestoreBackup = (restoredThreads: ChatThread[], restoredPlugins?: CustomPlugin[]) => {
    if (restoredThreads && restoredThreads.length > 0) {
      setThreads(restoredThreads);
      setActiveThreadId(restoredThreads[0].id);
    }
    if (restoredPlugins && restoredPlugins.length > 0) {
      setCustomPlugins(restoredPlugins);
    }
    showToast('✅ Daten erfolgreich wiederhergestellt');
  };

  // Main chat sending logic with real-time SSE streaming from Gemini
  const handleSendMessage = async (text: string, attachments: ChatAttachment[] = []) => {
    if (!text.trim() && attachments.length === 0) return;

    playPapayaSendSound();

    // Check system slash commands locally for instant responsiveness
    const trimmed = text.trim();
    if (trimmed.startsWith('/focus')) {
      const parts = trimmed.split(' ');
      const mins = parts[1] ? parseInt(parts[1], 10) || 25 : 25;
      handleToggleFocus(mins);
    } else if (trimmed.startsWith('/optimize')) {
      handleOptimizeRAM();
    } else if (trimmed === '/clear') {
      setThreads((prev) =>
        prev.map((t) => (t.id === activeThreadId ? { ...t, messages: [] } : t))
      );
      showToast('Chatverlauf geleert');
      return;
    } else if (trimmed === '/theme') {
      const themes: OSTheme[] = ['sunset', 'obsidian', 'citrus'];
      const nextIdx = (themes.indexOf(theme) + 1) % themes.length;
      setTheme(themes[nextIdx]);
      showToast(`Theme gewechselt: ${themes[nextIdx]}`);
      return;
    }

    // Check if user message triggers an active custom plugin
    const matchingPlugin = customPlugins.find(
      (p) => p.active && text.toLowerCase().startsWith(p.commandTrigger.toLowerCase())
    );

    const photoAttachments = attachments.filter(
      (a) => a.type === 'image' || (a.url && a.url.startsWith('data:image/'))
    );
    let displayContent = text.trim();
    if (!displayContent && photoAttachments.length > 0) {
      displayContent =
        photoAttachments.length === 1
          ? '📸 [Foto an Papaya gesendet]'
          : `📸 [${photoAttachments.length} Fotos an Papaya gesendet]`;
    } else if (attachments.length > 0 && photoAttachments.length === 0) {
      displayContent = `${displayContent}\n\n*[Angehängt: ${attachments.map((a) => a.name).join(', ')}]*`;
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: displayContent,
      attachments: attachments.length > 0 ? attachments : undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update active thread title if it's the first user message
    const currentMessages = activeThread?.messages || [];
    const isFirstUserMsg = currentMessages.filter((m) => m.role === 'user').length === 0;
    const rawTitle = text.trim() || (photoAttachments.length > 0 ? '📸 Foto-Analyse' : 'Unterhaltung');
    const updatedTitle = isFirstUserMsg
      ? rawTitle.slice(0, 32) + (rawTitle.length > 32 ? '...' : '')
      : activeThread?.title || 'Unterhaltung';

    const updatedThreadMessages = [...currentMessages, userMsg];

    // Create an initial placeholder message for streaming
    const modelMsgId = `msg-${Date.now() + 1}`;
    const initialModelMsg: ChatMessage = {
      id: modelMsgId,
      role: 'model',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'gemini',
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              title: updatedTitle,
              updatedAt: 'Gerade eben',
              messages: [...updatedThreadMessages, initialModelMsg],
            }
          : t
      )
    );

    setIsLoading(true);

    try {
      // Stream directly from Gemini via SSE
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedThreadMessages.map((m) => ({
            role: m.role,
            content: m.content,
            attachments: m.attachments,
          })),
          persona: activeThread?.persona || activePersona,
          model: selectedModel,
          systemContext: {
            theme,
            isFocusActive,
            cpuUsage: systemStatus.cpuUsage,
            ramUsageGb: systemStatus.ramUsageGb,
          },
          customPluginInstruction: matchingPlugin?.systemInstruction,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Streaming failed: HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let replySource: 'gemini' | 'local' = 'gemini';
      let messageTokens = 0;
      let messageMultiplier = 4.0;
      let messageRawTokens = 0;
      let usedModel = selectedModel;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        const lines = textChunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.model) {
                usedModel = data.model;
              }
              if (data.chunk) {
                accumulatedText += data.chunk;
                replySource = data.source || replySource;

                // Update the model message in state live!
                setThreads((prev) =>
                  prev.map((t) =>
                    t.id === activeThreadId
                      ? {
                          ...t,
                          messages: t.messages.map((m) =>
                            m.id === modelMsgId
                              ? { ...m, content: accumulatedText, source: replySource }
                              : m
                          ),
                        }
                      : t
                  )
                );
              }

              // Finished streaming event with token statistics
              if (data.done) {
                if (data.model) usedModel = data.model;
                if (data.tokens) {
                  messageTokens = data.tokens.totalTokens || (data.tokens.promptTokens + data.tokens.candidatesTokens);
                  if (data.tokens.multiplier) messageMultiplier = data.tokens.multiplier;
                  if (data.tokens.rawTokens) messageRawTokens = data.tokens.rawTokens;
                  if (data.tokens.stats) {
                    setTokenStats(data.tokens.stats);
                  }
                }
              }
            } catch (e) {
              // Ignore partial JSON
            }
          }
        }
      }

      // Completed streaming
      playPapayaReceiveSound();

      // Refresh latest token stats from backend
      fetchTokenStats();

      // Extract quick action chips
      const actions: ActionItem[] = [];
      const lower = accumulatedText.toLowerCase();
      if (lower.includes('focus') || lower.includes('fokus')) {
        actions.push({ id: 'a-f', label: '🧘 25m Fokus starten', command: '/focus 25', type: 'timer' });
      }
      if (lower.includes('workflow') || lower.includes('automate') || lower.includes('.flow')) {
        actions.push({ id: 'a-flow', label: '⚙️ Als .flow Skript anlegen', command: '/automate', type: 'system' });
      }
      if (lower.includes('ram') || lower.includes('cache') || lower.includes('speicher')) {
        actions.push({ id: 'a-opt', label: '🧹 System bereinigen', command: '/optimize', type: 'system' });
      }

      // Attach actions and token metadata to finished message
      setThreads((prev) =>
        prev.map((t) =>
          t.id === activeThreadId
            ? {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === modelMsgId
                    ? {
                        ...m,
                        actions: actions.length > 0 ? actions : m.actions,
                        metadata: {
                          ...m.metadata,
                          tokens: messageTokens > 0 ? messageTokens : m.metadata?.tokens,
                          rawTokens: messageRawTokens > 0 ? messageRawTokens : undefined,
                          tokenMultiplier: messageMultiplier,
                          model: usedModel,
                        },
                      }
                    : m
                ),
              }
            : t
        )
      );
    } catch (err) {
      console.error('Streaming error, trying non-streaming fallback:', err);
      // Non-streaming fallback
      try {
        const fallbackRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: updatedThreadMessages.map((m) => ({
              role: m.role,
              content: m.content,
              attachments: m.attachments,
            })),
            persona: activeThread?.persona || activePersona,
            model: selectedModel,
          }),
        });
        const fallbackData = await fallbackRes.json();
        const fallbackReply = fallbackData.reply || 'Antwort erhalten.';
        const fallbackTokens = fallbackData.tokens?.totalTokens || 0;
        const fallbackMultiplier = fallbackData.tokens?.multiplier || 4.0;
        const fallbackRawTokens = fallbackData.tokens?.rawTokens || fallbackTokens;
        if (fallbackData.tokens?.stats) {
          setTokenStats(fallbackData.tokens.stats);
        }

        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeThreadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === modelMsgId
                      ? {
                          ...m,
                          content: fallbackReply,
                          source: fallbackData.source || 'gemini',
                          metadata: {
                            ...m.metadata,
                            tokens: fallbackTokens > 0 ? fallbackTokens : undefined,
                            rawTokens: fallbackRawTokens > 0 ? fallbackRawTokens : undefined,
                            tokenMultiplier: fallbackMultiplier,
                          },
                        }
                      : m
                  ),
                }
              : t
          )
        );
        fetchTokenStats();
      } catch (innerErr) {
        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeThreadId
              ? {
                  ...t,
                  messages: t.messages.map((m) =>
                    m.id === modelMsgId
                      ? {
                          ...m,
                          content: 'Fehler beim Abrufen der Antwort von Gemini. Bitte versuche es noch einmal.',
                          source: 'local',
                        }
                      : m
                  ),
                }
              : t
          )
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVoiceExchange = (userText: string, assistantReply: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `msg-voice-user-${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: timeStr,
    };

    const modelMsg: ChatMessage = {
      id: `msg-voice-model-${Date.now() + 1}`,
      role: 'model',
      content: assistantReply,
      timestamp: timeStr,
      source: 'gemini',
    };

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              title:
                t.messages.length === 0
                  ? userText.slice(0, 32) + (userText.length > 32 ? '...' : '')
                  : t.title,
              updatedAt: 'Gerade eben',
              messages: [...t.messages, userMsg, modelMsg],
            }
          : t
      )
    );
  };

  const handleExecuteAction = (action: ActionItem) => {
    if (action.command) {
      handleSendMessage(action.command);
    } else {
      showToast(`Aktion ausgeführt: ${action.label}`);
    }
  };

  const handleExportMarkdown = () => {
    if (!activeThread) return;
    const content = activeThread.messages
      .map(
        (m) =>
          `### ${m.role === 'user' ? '👤 Benutzer' : '🥭 Papaya Intelligence (Gemini)'} (${m.timestamp})\n\n${m.content}\n\n---\n`
      )
      .join('\n');

    const header = `# PapayaOS Chat Export: ${activeThread.title}\n*Exportiert am: ${new Date().toLocaleString()}*\n\n---\n\n`;
    const blob = new Blob([header + content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PapayaOS_${activeThread.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('💾 Markdown-Export heruntergeladen');
  };

  // Background style based on theme
  const getBackgroundStyle = () => {
    if (theme === 'sunset') {
      return 'bg-gradient-to-br from-[#1C0D02] via-[#2A1408] to-[#120703] text-neutral-100';
    }
    if (theme === 'obsidian') {
      return 'bg-gradient-to-br from-[#0D0E12] via-[#14151B] to-[#0A0A0E] text-neutral-100';
    }
    return 'bg-gradient-to-br from-[#FFF9F2] via-[#FFF3E3] to-[#FCEFE3] text-neutral-900';
  };

  // If in Closed Beta Sell Page view, render the dedicated Three.js particle landing page
  if (currentView === 'beta') {
    return (
      <ClosedBetaPage
        onSwitchToChat={() => {
          window.location.hash = '#chat';
          setCurrentView('chat');
        }}
      />
    );
  }

  return (
    <div
      className={`min-h-screen w-full flex flex-col font-sans transition-colors duration-500 overflow-hidden relative ${getBackgroundStyle()}`}
    >
      {/* Decorative Sunset Glow Ambient Lights */}
      {theme === 'sunset' && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-600/15 rounded-full blur-[140px]" />
          <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[160px]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-red-600/10 rounded-full blur-[180px]" />
        </div>
      )}

      {/* Top OS System Menu Bar */}
      <TopMenuBar
        theme={theme}
        onThemeChange={setTheme}
        isFocusActive={isFocusActive}
        focusRemainingSecs={focusRemainingSecs}
        onToggleFocus={() => handleToggleFocus(25)}
        isInspectorOpen={isInspectorOpen}
        onToggleInspector={() => setIsInspectorOpen(!isInspectorOpen)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onQuickCommand={(cmd) => handleSendMessage(cmd)}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenBetaPage={() => {
          window.location.hash = '#beta';
          setCurrentView('beta');
        }}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        tokenStats={tokenStats}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Sidebar */}
        <Sidebar
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={setActiveThreadId}
          onNewThread={handleNewThread}
          onDeleteThread={handleDeleteThread}
          onTogglePin={handleTogglePin}
          onRenameThread={handleRenameThread}
          activePersona={activePersona}
          onSelectPersona={(persona) => {
            setActivePersona(persona);
            handleNewThread(persona);
          }}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          customPlugins={customPlugins}
          onSavePlugin={handleSavePlugin}
          onDeletePlugin={handleDeletePlugin}
          onTogglePlugin={handleTogglePlugin}
          onRunPlugin={handleRunPlugin}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenBetaPage={() => {
            window.location.hash = '#beta';
            setCurrentView('beta');
          }}
        />

        {/* Backdrop for mobile sidebar */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 md:hidden"
          />
        )}

        {/* Central Chat Canvas */}
        <main
          id="papaya-chat-main"
          className="flex-1 flex flex-col min-w-0 h-full relative"
        >
          {/* Chat Window Top Header */}
          <div className="relative z-30 h-14 px-3 sm:px-4 md:px-6 bg-black/20 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* Mobile Sidebar Toggle Button */}
              <button
                id="mobile-sidebar-toggle-btn"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 rounded-lg md:hidden text-neutral-300 hover:text-white hover:bg-white/10 shrink-0"
                title="Sidebar öffnen / schließen"
              >
                <Menu size={18} />
              </button>

              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="text-lg sm:text-xl shrink-0">
                  {activeThread?.persona === 'focus'
                    ? '🧘'
                    : activeThread?.persona === 'creative'
                    ? '🎨'
                    : activeThread?.persona === 'automator'
                    ? '⚙️'
                    : activeThread?.persona === 'wellness'
                    ? '🌿'
                    : '🥭'}
                </span>
                <div className="truncate">
                  <h1 className="text-xs sm:text-sm md:text-base font-bold text-white tracking-tight truncate max-w-[100px] xs:max-w-[140px] sm:max-w-xs md:max-w-md">
                    {activeThread?.title || 'PapayaOS Chat'}
                  </h1>
                  <span className="text-[9px] sm:text-[10px] text-neutral-400 font-mono hidden sm:inline">
                    {activeThread?.persona.toUpperCase()} MODE • REALTIME CHAT
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions in Window Titlebar - Stärke & Zahnrad are ALWAYS available together */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Model Strength Slider Bar Control */}
              <ModelStrengthControl
                selectedModel={selectedModel}
                onSelectModel={(modelId, levelName) => {
                  setSelectedModel(modelId);
                  showToast(`⚡ KI-Stärke: "${levelName}" aktiv (${modelId})`);
                }}
              />

              {/* Zahnrad (System Inspector & Einstellungen) - IMMER sichtbar & bedienbar auf Mobile & Desktop */}
              <button
                id="header-settings-inspector-btn"
                onClick={() => setIsInspectorOpen(!isInspectorOpen)}
                className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isInspectorOpen
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10'
                }`}
                title="System Inspector & Einstellungen (Zahnrad)"
                aria-label="Einstellungen und System Inspector öffnen"
              >
                <Settings
                  size={16}
                  className={`transition-transform duration-300 ${
                    isInspectorOpen ? 'rotate-90 text-orange-400' : 'text-neutral-300'
                  }`}
                />
                <span className="hidden xl:inline text-xs font-medium">Inspector</span>
              </button>

              {/* Secondary Tablet & Desktop Action Buttons */}
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="hidden sm:flex p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors text-xs items-center gap-1.5 cursor-pointer border border-white/5"
                title="Chat als Markdown, PDF oder JSON exportieren / Backup verwalten"
              >
                <FolderArchive size={14} className="text-amber-400" />
                <span className="hidden md:inline">Export</span>
              </button>

              <button
                onClick={() => {
                  window.location.hash = '#beta';
                  setCurrentView('beta');
                }}
                className="hidden lg:flex p-2 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 transition-colors text-xs items-center gap-1.5 cursor-pointer shadow-sm"
                title="Zur Closed Beta Verkaufsseite"
              >
                <Rocket size={14} className="text-[#FF6B53]" />
                <span>Closed Beta</span>
              </button>

              <button
                onClick={() => handleSendMessage('/optimize')}
                className="hidden lg:flex p-2 rounded-xl bg-white/5 hover:bg-white/10 text-orange-400 hover:text-orange-300 transition-colors text-xs items-center gap-1.5 cursor-pointer border border-white/5"
                title="RAM bereinigen"
              >
                <Sparkles size={14} />
                <span>Optimieren</span>
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 custom-scrollbar space-y-4">
            {activeThread && activeThread.messages.length === 0 ? (
              /* Empty Thread Greeting State */
              <div className="max-w-2xl mx-auto my-auto py-8 text-center flex flex-col items-center justify-center animate-in fade-in duration-300">
                <div className="relative mb-4">
                  <div className="absolute inset-0 bg-orange-500/30 rounded-full blur-2xl animate-pulse" />
                  <PapayaLogo size={72} className="relative z-10 drop-shadow-2xl" />
                </div>

                <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white mb-1">
                  Papaya<span className="text-orange-500">OS</span> Intelligence
                </h2>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs uppercase tracking-widest text-orange-400 font-bold">
                    A Fresher Way To Do More
                  </span>
                  <span className="text-neutral-500">•</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Live Gemini 3.5 Lite • Ultra-Fast
                  </span>
                </div>

                <p className="text-sm text-neutral-300 max-w-md mb-6 leading-relaxed">
                  Wie kann ich dich heute unterstützen? Stelle mir freie Fragen zu Code, Design, Automatisierung oder probiere einen der Schnellstarter:
                </p>

                {/* Papaya Voice Assistant Hero Card */}
                <div className="w-full mb-6">
                  <button
                    id="hero-voice-chat-btn"
                    onClick={() => setIsVoiceModalOpen(true)}
                    className="w-full p-4 rounded-2xl bg-gradient-to-r from-orange-500/20 via-amber-500/15 to-emerald-500/10 hover:from-orange-500/30 hover:via-amber-500/25 border border-orange-500/40 hover:border-orange-500/60 shadow-xl transition-all cursor-pointer text-left flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform shrink-0">
                        <Mic size={22} className="animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors">
                            Papaya Voice Chat
                          </h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                            3D Partikel-Ball
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 mt-0.5">
                          Interaktiver 3D Partikel-Ball, der sich als aufgeschnittene Papaya entfaltet, mit Spracherkennung & Sprachausgabe.
                        </p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 text-xs font-medium text-orange-300 border border-orange-500/30 group-hover:bg-orange-500 group-hover:text-white transition-all shrink-0">
                      <span>Starten</span>
                      <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                </div>

                {/* Quick Prompts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                  {QUICK_PROMPTS.map((qp, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(qp.prompt)}
                      className="p-3.5 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800/90 border border-white/10 hover:border-orange-500/40 text-neutral-200 transition-all cursor-pointer group shadow-lg"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{qp.icon}</span>
                        <span className="font-semibold text-xs text-white group-hover:text-orange-400 transition-colors">
                          {qp.label}
                        </span>
                        <ArrowRight
                          size={12}
                          className="ml-auto text-neutral-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all"
                        />
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-snug">
                        {qp.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message List */
              <div className="max-w-4xl mx-auto w-full">
                {activeThread?.messages.map((message) => (
                  <ChatMessageItem
                    key={message.id}
                    message={message}
                    onExecuteAction={handleExecuteAction}
                    onRetry={() => {
                      const lastUser = [...(activeThread?.messages || [])]
                        .reverse()
                        .find((m) => m.role === 'user');
                      if (lastUser) {
                        handleSendMessage(lastUser.content);
                      }
                    }}
                  />
                ))}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Omnibar Input Box */}
          <div className="shrink-0">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              personaName={
                activeThread?.persona === 'focus'
                  ? 'Focus Coach'
                  : activeThread?.persona === 'creative'
                  ? 'Creative Studio'
                  : activeThread?.persona === 'automator'
                  ? 'Automator'
                  : 'Papaya Assistant'
              }
            />
          </div>
        </main>

        {/* Inspector Drawer */}
        <InspectorDrawer
          isOpen={isInspectorOpen}
          onClose={() => setIsInspectorOpen(false)}
          systemStatus={systemStatus}
          activeThread={activeThread}
          onOptimizeRAM={handleOptimizeRAM}
          isFocusActive={isFocusActive}
          onToggleFocus={() => handleToggleFocus(25)}
          isAmbientPlaying={isAmbientPlaying}
          onToggleAmbient={handleToggleAmbient}
          onExportMarkdown={handleExportMarkdown}
          tokenStats={tokenStats}
          onRefreshTokens={fetchTokenStats}
        />
      </div>

      {/* Floating Focus Mode Widget */}
      <FocusWidget
        isActive={isFocusActive}
        remainingSecs={focusRemainingSecs}
        isPaused={isFocusPaused}
        onTogglePause={() => setIsFocusPaused(!isFocusPaused)}
        onStop={() => {
          setIsFocusActive(false);
          toggleAmbientFocusSound(false);
          setIsAmbientPlaying(false);
          showToast('Focus Mode beendet');
        }}
        isSoundOn={isAmbientPlaying}
        onToggleSound={handleToggleAmbient}
      />

      {/* Papaya Voice Assistant Modal (3D Particle Ball that opens as a Papaya) */}
      <PapayaVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        activePersona={activePersona}
        onSendMessage={(text) => handleSendMessage(text)}
        onAddVoiceExchange={handleAddVoiceExchange}
        selectedModel={selectedModel}
      />

      {/* Export & System Backup Modal */}
      <ExportBackupModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        activeThread={activeThread}
        allThreads={threads}
        customPlugins={customPlugins}
        onRestoreBackup={handleRestoreBackup}
        showToast={showToast}
      />

      {/* Floating System Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/95 border border-orange-500/40 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl text-xs text-neutral-100 flex items-center gap-2.5 font-medium"
          >
            <PapayaLogo size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
