import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus,
  Search,
  MessageSquare,
  Pin,
  Trash2,
  Sparkles,
  Zap,
  Sliders,
  FolderGit2,
  HeartPulse,
  MoreVertical,
  Layers,
  ChevronRight,
  ShieldCheck,
  Blocks,
  X,
  Check,
  CheckCircle2,
  Cpu,
  Globe,
  Palette,
  Music,
  Terminal,
  RefreshCw,
  ExternalLink,
  Edit3,
  HardDrive,
  FolderArchive,
  Rocket,
  PlusCircle,
  Play,
  Wrench,
  FileCode2
} from 'lucide-react';
import { ChatThread, PersonaType, CustomPlugin } from '../types';
import { playPapayaSendSound, playPapayaReceiveSound } from '../utils/papayaSound';

interface SidebarProps {
  threads: ChatThread[];
  activeThreadId: string;
  onSelectThread: (id: string) => void;
  onNewThread: (persona?: PersonaType) => void;
  onDeleteThread: (id: string) => void;
  onTogglePin: (id: string) => void;
  onRenameThread: (id: string, newTitle: string) => void;
  activePersona: PersonaType;
  onSelectPersona: (persona: PersonaType) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  customPlugins: CustomPlugin[];
  onSavePlugin: (plugin: CustomPlugin) => void;
  onDeletePlugin: (id: string) => void;
  onTogglePlugin: (id: string) => void;
  onRunPlugin?: (plugin: CustomPlugin) => void;
  onOpenExportModal?: () => void;
  onOpenBetaPage?: () => void;
}

const EMOJI_OPTIONS = ['⚡', '🧠', '🎨', '🛠️', '🚀', '🛡️', '🔍', '📝', '💡', '🌐', '🤖', '📊'];

export const Sidebar: React.FC<SidebarProps> = ({
  threads,
  activeThreadId,
  onSelectThread,
  onNewThread,
  onDeleteThread,
  onTogglePin,
  onRenameThread,
  activePersona,
  isOpen,
  customPlugins,
  onSavePlugin,
  onDeletePlugin,
  onTogglePlugin,
  onRunPlugin,
  onOpenExportModal,
  onOpenBetaPage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPluginsModalOpen, setIsPluginsModalOpen] = useState(false);
  const [pluginCategoryFilter, setPluginCategoryFilter] = useState<string>('Alle');
  const [pluginSearch, setPluginSearch] = useState('');

  // Plugin creation/editing state
  const [isEditingPlugin, setIsEditingPlugin] = useState(false);
  const [editingPluginId, setEditingPluginId] = useState<string | null>(null);
  const [pluginName, setPluginName] = useState('');
  const [pluginTrigger, setPluginTrigger] = useState('/');
  const [pluginCategory, setPluginCategory] = useState<'System' | 'AI' | 'Creative' | 'Productivity' | 'Custom'>('Custom');
  const [pluginIcon, setPluginIcon] = useState('⚡');
  const [pluginDesc, setPluginDesc] = useState('');
  const [pluginInstruction, setPluginInstruction] = useState('');

  const filteredThreads = threads.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const pinnedThreads = filteredThreads.filter((t) => t.isPinned);
  const regularThreads = filteredThreads.filter((t) => !t.isPinned);

  const activePluginsCount = customPlugins.filter((p) => p.active).length;

  const handleOpenNewPluginForm = () => {
    setEditingPluginId(null);
    setPluginName('');
    setPluginTrigger('/');
    setPluginCategory('Custom');
    setPluginIcon('⚡');
    setPluginDesc('');
    setPluginInstruction('');
    setIsEditingPlugin(true);
  };

  const handleOpenEditPluginForm = (plugin: CustomPlugin) => {
    setEditingPluginId(plugin.id);
    setPluginName(plugin.name);
    setPluginTrigger(plugin.commandTrigger);
    setPluginCategory(plugin.category);
    setPluginIcon(plugin.icon);
    setPluginDesc(plugin.description);
    setPluginInstruction(plugin.systemInstruction || '');
    setIsEditingPlugin(true);
  };

  const handleSavePluginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pluginName.trim()) return;

    let trigger = pluginTrigger.trim();
    if (!trigger.startsWith('/')) {
      trigger = '/' + trigger;
    }

    const pluginToSave: CustomPlugin = {
      id: editingPluginId || 'plugin-' + Date.now(),
      name: pluginName.trim(),
      commandTrigger: trigger,
      category: pluginCategory,
      icon: pluginIcon || '⚡',
      description: pluginDesc.trim() || 'Custom PapayaOS Erweiterung',
      systemInstruction: pluginInstruction.trim(),
      active: true,
      createdAt: new Date().toISOString(),
    };

    onSavePlugin(pluginToSave);
    playPapayaReceiveSound();
    setIsEditingPlugin(false);
  };

  const filteredPlugins = customPlugins.filter((p) => {
    const matchesCat = pluginCategoryFilter === 'Alle' || p.category === pluginCategoryFilter;
    const matchesQuery =
      p.name.toLowerCase().includes(pluginSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(pluginSearch.toLowerCase()) ||
      p.commandTrigger.toLowerCase().includes(pluginSearch.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <>
      <aside
        id="papaya-chat-sidebar"
        className={`
          fixed md:static inset-y-0 left-0 z-30
          w-72 md:w-80 flex flex-col shrink-0
          bg-neutral-900/95 md:bg-neutral-900/80
          backdrop-blur-2xl border-r border-white/10
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Sidebar Header & New Thread */}
        <div className="p-3 border-b border-white/10 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Unterhaltungen
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-neutral-400 font-mono">
              {threads.length} Gespeichert
            </span>
          </div>

          <button
            id="papaya-btn-new-chat"
            onClick={() => {
              playPapayaSendSound();
              onNewThread(activePersona);
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold text-xs transition-all shadow-md shadow-orange-500/20 active:scale-[0.98] cursor-pointer"
          >
            <Plus size={15} />
            <span>Neuer Papaya Chat</span>
          </button>

          {/* Search Threads */}
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              type="text"
              placeholder="Chats durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-black/30 border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          {/* Quick Action Badges / Launchers */}
          <div className="space-y-1.5 pt-1">
            {/* Custom Plugins Button */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                playPapayaSendSound();
                setIsPluginsModalOpen(true);
              }}
              className="group relative w-full overflow-hidden rounded-xl p-[1px] cursor-pointer"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-orange-500/50 via-amber-500/40 to-orange-600/50 group-hover:from-orange-400 group-hover:via-amber-400 group-hover:to-orange-500 transition-all duration-500 rounded-xl opacity-75 group-hover:opacity-100" />
              <div className="relative flex items-center justify-between gap-2.5 px-3 py-2 rounded-[11px] bg-neutral-900/95 backdrop-blur-md group-hover:bg-neutral-900/80 transition-colors z-10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-500/40 text-orange-400 shrink-0">
                    <Blocks size={14} />
                  </div>
                  <div className="text-left min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-orange-300">
                        Custom Plugins
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-semibold">
                        {activePluginsCount} aktiv
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={13} className="text-neutral-400 group-hover:text-orange-300 group-hover:translate-x-0.5 transition-all" />
              </div>
            </motion.button>

            {/* Export & Backup Button */}
            {onOpenExportModal && (
              <button
                onClick={() => {
                  playPapayaSendSound();
                  onOpenExportModal();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-all text-xs cursor-pointer"
                title="Chat als Markdown, PDF oder JSON sichern"
              >
                <div className="flex items-center gap-2">
                  <FolderArchive size={14} className="text-amber-400" />
                  <span className="font-medium text-xs">Export & Backup</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400">MD / PDF / JSON</span>
              </button>
            )}

            {/* Closed Beta Page Button */}
            {onOpenBetaPage && (
              <button
                onClick={() => {
                  playPapayaSendSound();
                  onOpenBetaPage();
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent hover:from-orange-500/25 border border-orange-500/30 text-orange-200 hover:text-white transition-all text-xs cursor-pointer shadow-sm"
                title="Closed Beta Sell Page öffnen"
              >
                <div className="flex items-center gap-2">
                  <Rocket size={14} className="text-[#FF6B53]" />
                  <span className="font-medium text-xs">Closed Beta Seite</span>
                </div>
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-mono">
                  Launchpad
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Threads List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3 custom-scrollbar">
          {/* Pinned Section */}
          {pinnedThreads.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 px-2 mb-1 text-[10px] font-bold text-orange-400/90 uppercase tracking-wider">
                <Pin size={10} className="rotate-45" />
                <span>Angepinnt</span>
              </div>
              <div className="space-y-1">
                {pinnedThreads.map((thread) => (
                  <ThreadItem
                    key={thread.id}
                    thread={thread}
                    isActive={thread.id === activeThreadId}
                    onSelect={() => onSelectThread(thread.id)}
                    onDelete={() => onDeleteThread(thread.id)}
                    onTogglePin={() => onTogglePin(thread.id)}
                    onRename={(newTitle) => onRenameThread(thread.id, newTitle)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Threads */}
          <div>
            {pinnedThreads.length > 0 && (
              <div className="flex items-center gap-1.5 px-2 mb-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                <span>Verlauf</span>
              </div>
            )}
            <div className="space-y-1">
              {regularThreads.map((thread) => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isActive={thread.id === activeThreadId}
                  onSelect={() => onSelectThread(thread.id)}
                  onDelete={() => onDeleteThread(thread.id)}
                  onTogglePin={() => onTogglePin(thread.id)}
                  onRename={(newTitle) => onRenameThread(thread.id, newTitle)}
                />
              ))}

              {filteredThreads.length === 0 && (
                <div className="text-center py-8 px-4 text-neutral-400">
                  <p className="text-xs">Keine Unterhaltungen gefunden</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-white/10 bg-black/20 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-neutral-300">Papaya Intelligence</span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono">
            <HardDrive size={11} className="text-emerald-400" />
            <span>Gespeichert</span>
          </div>
        </div>
      </aside>

      {/* Custom Plugins & Extensions Modal */}
      <AnimatePresence>
        {isPluginsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-neutral-900 border border-orange-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-4 bg-gradient-to-r from-orange-500/15 via-amber-500/10 to-transparent border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
                    <Blocks size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      Custom Plugins & Extensions Hub
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono">
                        {customPlugins.length} Plugins ({activePluginsCount} aktiv)
                      </span>
                    </h2>
                    <p className="text-xs text-neutral-400">
                      Erstelle deine eigenen KI-Tools, Slash-Befehle und System-Prompts
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isEditingPlugin && (
                    <button
                      onClick={handleOpenNewPluginForm}
                      className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                    >
                      <Plus size={14} />
                      <span>Neues Plugin</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setIsPluginsModalOpen(false);
                      setIsEditingPlugin(false);
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Plugin Editor Form */}
              {isEditingPlugin ? (
                <form onSubmit={handleSavePluginSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h3 className="text-xs font-bold text-orange-300 uppercase tracking-wider flex items-center gap-2">
                      <Wrench size={14} />
                      {editingPluginId ? 'Custom Plugin bearbeiten' : 'Neues Custom Plugin erstellen'}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsEditingPlugin(false)}
                      className="text-xs text-neutral-400 hover:text-white"
                    >
                      Abbrechen
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                        Plugin Name *
                      </label>
                      <input
                        type="text"
                        placeholder="z.B. Code Auditor"
                        value={pluginName}
                        onChange={(e) => setPluginName(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                        Slash-Befehl / Trigger *
                      </label>
                      <input
                        type="text"
                        placeholder="/audit"
                        value={pluginTrigger}
                        onChange={(e) => setPluginTrigger(e.target.value)}
                        required
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs font-mono text-orange-300 placeholder-neutral-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                        Kategorie
                      </label>
                      <select
                        value={pluginCategory}
                        onChange={(e) => setPluginCategory(e.target.value as any)}
                        className="w-full px-3 py-2 bg-neutral-800 border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="System">System</option>
                        <option value="AI">AI & Reasoning</option>
                        <option value="Creative">Creative & Design</option>
                        <option value="Productivity">Productivity</option>
                        <option value="Custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                        Icon / Emoji auswählen
                      </label>
                      <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-black/30 rounded-lg border border-white/5">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button
                            type="button"
                            key={emoji}
                            onClick={() => setPluginIcon(emoji)}
                            className={`w-7 h-7 flex items-center justify-center rounded text-sm cursor-pointer transition-transform ${
                              pluginIcon === emoji ? 'bg-orange-500 scale-110' : 'hover:bg-white/10'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Kurzbeschreibung
                    </label>
                    <input
                      type="text"
                      placeholder="z.B. Analysiert Codezeilen auf Performance, Security und Bugs."
                      value={pluginDesc}
                      onChange={(e) => setPluginDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      System-Instruktion für Gemini (Prompt Erweiterung)
                    </label>
                    <textarea
                      rows={4}
                      placeholder="z.B. Du bist ein führender Senior Security Engineer. Prüfe jede Codezeile auf Schwachstellen und gib eine strukturierte Tabelle mit Fix-Empfehlungen aus."
                      value={pluginInstruction}
                      onChange={(e) => setPluginInstruction(e.target.value)}
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 custom-scrollbar leading-relaxed"
                    />
                    <span className="text-[10px] text-neutral-500 mt-1 block">
                      Wird automatisch als Anweisung an Gemini übergeben, wenn dieser Slash-Befehl genutzt wird.
                    </span>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingPlugin(false)}
                      className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 text-xs font-semibold cursor-pointer"
                    >
                      Abbrechen
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Check size={14} />
                      <span>Plugin speichern</span>
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {/* Filter & Search Bar */}
                  <div className="p-3 border-b border-white/10 flex flex-col sm:flex-row gap-2 items-center justify-between bg-black/20">
                    <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
                      {['Alle', 'System', 'AI', 'Creative', 'Productivity', 'Custom'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setPluginCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                            pluginCategoryFilter === cat
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-white/5 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    <div className="relative w-full sm:w-44">
                      <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input
                        type="text"
                        placeholder="Plugin suchen..."
                        value={pluginSearch}
                        onChange={(e) => setPluginSearch(e.target.value)}
                        className="w-full pl-7 pr-2 py-1 bg-black/40 border border-white/10 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-orange-500/40"
                      />
                    </div>
                  </div>

                  {/* Plugin List or Clean Empty State */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                    {customPlugins.length === 0 ? (
                      <div className="py-12 px-6 text-center flex flex-col items-center justify-center">
                        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-2xl text-orange-400 mb-3">
                          🧩
                        </div>
                        <h3 className="text-sm font-bold text-white mb-1">
                          Keine Plugins vorhanden
                        </h3>
                        <p className="text-xs text-neutral-400 max-w-sm mb-4 leading-relaxed">
                          Alle Standard-Plugins wurden entfernt. Du kannst nun deine komplett eigenen Custom Plugins für PapayaOS mit individuellen Befehlen und Prompts anlegen!
                        </p>
                        <button
                          onClick={handleOpenNewPluginForm}
                          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md transition-all hover:scale-105"
                        >
                          <Plus size={15} />
                          <span>Erstes Custom Plugin erstellen</span>
                        </button>
                      </div>
                    ) : filteredPlugins.length === 0 ? (
                      <div className="py-8 text-center text-neutral-400 text-xs">
                        Kein Plugin entspricht deinen Suchkriterien.
                      </div>
                    ) : (
                      filteredPlugins.map((plugin) => (
                        <div
                          key={plugin.id}
                          className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                            plugin.active
                              ? 'bg-neutral-800/80 border-orange-500/30 shadow-sm'
                              : 'bg-neutral-900/60 border-white/5 opacity-70'
                          }`}
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="text-2xl p-2 rounded-xl bg-black/40 border border-white/10 shrink-0">
                              {plugin.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-xs font-bold text-white tracking-tight">
                                  {plugin.name}
                                </h3>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 font-semibold border border-orange-500/30">
                                  {plugin.commandTrigger}
                                </span>
                                <span className="text-[10px] text-neutral-400 font-mono">
                                  {plugin.category}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-300 mt-1 leading-snug">
                                {plugin.description}
                              </p>
                              {plugin.systemInstruction && (
                                <p className="text-[10px] text-neutral-500 font-mono mt-1 truncate max-w-md italic">
                                  Instruktion: "{plugin.systemInstruction}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Run Trigger in Chat */}
                            {onRunPlugin && (
                              <button
                                onClick={() => {
                                  onRunPlugin(plugin);
                                  setIsPluginsModalOpen(false);
                                }}
                                className="p-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 text-xs cursor-pointer transition-colors"
                                title="Befehl im Chat ausführen"
                              >
                                <Play size={12} />
                              </button>
                            )}

                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEditPluginForm(plugin)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs cursor-pointer transition-colors"
                              title="Bearbeiten"
                            >
                              <Edit3 size={12} />
                            </button>

                            {/* Toggle Active Button */}
                            <button
                              onClick={() => onTogglePlugin(plugin.id)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all cursor-pointer ${
                                plugin.active
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                  : 'bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {plugin.active ? (
                                <>
                                  <Check size={11} />
                                  <span>Aktiv</span>
                                </>
                              ) : (
                                <span>Aus</span>
                              )}
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => onDeletePlugin(plugin.id)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 text-xs cursor-pointer transition-colors"
                              title="Löschen"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="p-3 bg-black/40 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      Custom Plugins werden im PapayaOS Kernel persistent gespeichert
                    </span>
                    <button
                      onClick={() => {
                        playPapayaSendSound();
                        setIsPluginsModalOpen(false);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium cursor-pointer transition-colors"
                    >
                      Fertig
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

interface ThreadItemProps {
  thread: ChatThread;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onRename: (newTitle: string) => void;
}

const ThreadItem: React.FC<ThreadItemProps> = ({
  thread,
  isActive,
  onSelect,
  onDelete,
  onTogglePin,
  onRename,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title);

  const handleSaveRename = () => {
    if (editTitle.trim()) {
      onRename(editTitle.trim());
    } else {
      setEditTitle(thread.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveRename();
    } else if (e.key === 'Escape') {
      setEditTitle(thread.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      onClick={isEditing ? undefined : onSelect}
      className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all ${
        isActive
          ? 'bg-orange-500/15 text-orange-200 border border-orange-500/30 font-medium shadow-sm'
          : 'text-neutral-300 hover:text-white hover:bg-white/5 border border-transparent'
      }`}
    >
      <MessageSquare
        size={13}
        className={isActive ? 'text-orange-400 shrink-0' : 'text-neutral-400 shrink-0'}
      />

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-1.5 py-0.5 bg-black/70 border border-orange-500/60 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <button
              onClick={handleSaveRename}
              className="p-1 rounded bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
              title="Speichern"
            >
              <Check size={11} />
            </button>
            <button
              onClick={() => {
                setEditTitle(thread.title);
                setIsEditing(false);
              }}
              className="p-1 rounded bg-white/10 hover:bg-white/20 text-neutral-300 cursor-pointer"
              title="Abbrechen"
            >
              <X size={11} />
            </button>
          </div>
        ) : (
          <div onDoubleClick={(e) => { e.stopPropagation(); setIsEditing(true); }}>
            <p className="truncate text-xs leading-snug" title={thread.title}>{thread.title}</p>
            <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-0.5">
              <span>{thread.updatedAt}</span>
              <span className="text-neutral-500">•</span>
              <span className="font-mono text-[9px] text-neutral-400">
                {thread.messages.length} {thread.messages.length === 1 ? 'Msg' : 'Msgs'}
              </span>
              {thread.tag && (
                <span className="px-1.5 py-0.2 rounded bg-white/5 font-mono text-[9px]">
                  #{thread.tag}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Thread Action icons */}
      {!isEditing && (
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditTitle(thread.title);
              setIsEditing(true);
            }}
            className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white"
            title="Titel umbenennen"
          >
            <Edit3 size={11} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className={`p-1 rounded hover:bg-white/10 ${
              thread.isPinned ? 'text-orange-400' : 'text-neutral-400 hover:text-white'
            }`}
            title={thread.isPinned ? 'Lösen' : 'Anpinnen'}
          >
            <Pin size={11} className={thread.isPinned ? 'rotate-45' : ''} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded hover:bg-red-500/20 text-neutral-400 hover:text-red-400"
            title="Chat löschen"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
};
