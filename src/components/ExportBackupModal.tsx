import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  Upload,
  FileText,
  Printer,
  Database,
  CheckCircle2,
  AlertCircle,
  FolderArchive,
  ArrowDownToLine,
  Share2
} from 'lucide-react';
import { ChatThread, CustomPlugin } from '../types';
import { playPapayaSendSound, playPapayaReceiveSound } from '../utils/papayaSound';

interface ExportBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeThread: ChatThread | null;
  allThreads: ChatThread[];
  customPlugins?: CustomPlugin[];
  onRestoreBackup: (threads: ChatThread[], plugins?: CustomPlugin[]) => void;
  showToast: (msg: string) => void;
}

export const ExportBackupModal: React.FC<ExportBackupModalProps> = ({
  isOpen,
  onClose,
  activeThread,
  allThreads,
  customPlugins = [],
  onRestoreBackup,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'backup' | 'restore'>('export');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [pendingRestore, setPendingRestore] = useState<{
    threads: ChatThread[];
    plugins?: CustomPlugin[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Markdown Export for Current Chat
  const handleExportMarkdownCurrent = () => {
    if (!activeThread) return;
    playPapayaSendSound();

    const header = [
      `# 🥭 PapayaOS Chat Export: ${activeThread.title}`,
      `**Erstellt am:** ${new Date().toLocaleString('de-DE')}`,
      `**Modus:** ${activeThread.persona.toUpperCase()}`,
      `**Nachrichten:** ${activeThread.messages.length}`,
      `\n---\n`
    ].join('\n');

    const content = activeThread.messages
      .map((m) => {
        const sender = m.role === 'user' ? '👤 Du' : '🥭 Papaya Intelligence (Gemini)';
        const source = m.source ? ` • ${m.source}` : '';
        return `### ${sender} (${m.timestamp}${source})\n\n${m.content}\n\n---\n`;
      })
      .join('\n');

    const blob = new Blob([header + '\n' + content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = activeThread.title.replace(/[^a-zA-Z0-9äöüÄÖÜ_-]/g, '_').slice(0, 30);
    link.download = `PapayaOS_${safeTitle}_${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`💾 Markdown für "${activeThread.title}" heruntergeladen`);
  };

  // 2. Markdown Export for All Chats
  const handleExportMarkdownAll = () => {
    playPapayaSendSound();
    let fullDoc = `# 🥭 PapayaOS - Gesamtes Chat-Archiv\n*Exportiert am: ${new Date().toLocaleString('de-DE')}*\n*Gespeicherte Unterhaltungen: ${allThreads.length}*\n\n---\n\n`;

    allThreads.forEach((thread, idx) => {
      fullDoc += `## ${idx + 1}. ${thread.title} (${thread.persona.toUpperCase()})\n`;
      fullDoc += `*Letzte Änderung: ${thread.updatedAt} • ${thread.messages.length} Nachrichten*\n\n`;

      thread.messages.forEach((m) => {
        const sender = m.role === 'user' ? '👤 Du' : '🥭 Papaya Intelligence (Gemini)';
        fullDoc += `> **${sender}** [${m.timestamp}]:\n\n${m.content}\n\n`;
      });

      fullDoc += `\n---\n\n`;
    });

    const blob = new Blob([fullDoc], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PapayaOS_Alle_Chats_${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`💾 Gesamtarchiv (${allThreads.length} Chats) als Markdown exportiert`);
  };

  // 3. Print / PDF Export
  const handlePrintPDF = () => {
    if (!activeThread) return;
    playPapayaSendSound();

    // Create a printable iframe with styling
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const messagesHtml = activeThread.messages
      .map((m) => {
        const isUser = m.role === 'user';
        return `
          <div style="margin-bottom: 24px; padding: 14px 18px; border-radius: 12px; background: ${isUser ? '#f4f4f5' : '#fff7ed'}; border: 1px solid ${isUser ? '#e4e4e7' : '#fed7aa'};">
            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: bold; color: ${isUser ? '#52525b' : '#c2410c'}; margin-bottom: 6px;">
              <span>${isUser ? '👤 Du' : '🥭 Papaya Intelligence (Gemini)'}</span>
              <span>${m.timestamp}</span>
            </div>
            <div style="font-size: 13px; line-height: 1.6; color: #18181b; white-space: pre-wrap;">${m.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </div>
        `;
      })
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>PapayaOS Chat - ${activeThread.title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
              color: #18181b;
            }
            .header {
              border-bottom: 2px solid #ea580c;
              padding-bottom: 16px;
              margin-bottom: 28px;
            }
            .logo {
              font-size: 20px;
              font-weight: 800;
              color: #ea580c;
            }
            .meta {
              font-size: 12px;
              color: #71717a;
              margin-top: 4px;
            }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">🥭 PapayaOS Transkript</div>
            <h1 style="font-size: 22px; margin: 8px 0 4px 0;">${activeThread.title}</h1>
            <div class="meta">Modus: ${activeThread.persona.toUpperCase()} • Exportiert am: ${new Date().toLocaleString('de-DE')} • ${activeThread.messages.length} Nachrichten</div>
          </div>
          <div>
            ${messagesHtml}
          </div>
          <div style="margin-top: 40px; padding-top: 12px; border-top: 1px solid #e4e4e7; font-size: 10px; color: #a1a1aa; text-align: center;">
            PapayaOS 4.2 • Powered by Gemini NPU Intelligence • Vertrauliches Chat-Protokoll
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
    showToast('🖨️ Druck- & PDF-Ansicht geöffnet');
  };

  // 4. JSON Full Backup Export
  const handleExportJSON = () => {
    playPapayaSendSound();
    const backupData = {
      app: 'PapayaOS',
      version: '4.2',
      exportDate: new Date().toISOString(),
      chatThreadsCount: allThreads.length,
      customPluginsCount: customPlugins.length,
      threads: allThreads,
      customPlugins: customPlugins,
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PapayaOS_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`📦 Komplettes JSON-Backup (${allThreads.length} Chats, ${customPlugins.length} Plugins) heruntergeladen`);
  };

  // 5. JSON File Import Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.threads && Array.isArray(parsed.threads)) {
          setPendingRestore({
            threads: parsed.threads,
            plugins: Array.isArray(parsed.customPlugins) ? parsed.customPlugins : [],
          });
          setImportStatus(`Gültiges Backup erkannt: ${parsed.threads.length} Unterhaltungen, ${parsed.customPlugins?.length || 0} Custom Plugins.`);
        } else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].messages) {
          // Direct threads array
          setPendingRestore({
            threads: parsed,
            plugins: [],
          });
          setImportStatus(`Gültige Chat-Liste erkannt: ${parsed.length} Unterhaltungen.`);
        } else {
          setImportStatus('Ungültiges Dateiformat. Keine passenden PapayaOS-Daten gefunden.');
        }
      } catch (err) {
        setImportStatus('Fehler beim Parsen der JSON-Datei. Bitte prüfe das Format.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!pendingRestore) return;
    playPapayaReceiveSound();
    onRestoreBackup(pendingRestore.threads, pendingRestore.plugins);
    showToast(`🎉 ${pendingRestore.threads.length} Chats & ${pendingRestore.plugins?.length || 0} Plugins erfolgreich wiederhergestellt!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-xl bg-neutral-900 border border-orange-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-transparent border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <FolderArchive size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Export & System-Backup
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono">
                  {allThreads.length} Chats
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Sichere, exportiere und importiere deine PapayaOS Konversationen & Plugins
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pt-3 border-b border-white/10 flex gap-2 bg-black/20">
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-orange-500 text-orange-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <FileText size={14} />
            Dokument-Export (.md / PDF)
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'backup'
                ? 'border-orange-500 text-orange-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Database size={14} />
            Vollständiges Backup (.json)
          </button>
          <button
            onClick={() => setActiveTab('restore')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'restore'
                ? 'border-orange-500 text-orange-300'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Upload size={14} />
            Wiederherstellen
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {activeTab === 'export' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-neutral-800/60 border border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Aktuellen Chat als Markdown (.md)
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Exportiert "{activeThread?.title || 'Aktiver Chat'}" mit allen Zeitstempeln & Codeblöcken.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExportMarkdownCurrent}
                  className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors shadow-sm"
                >
                  <Download size={13} />
                  Herunterladen
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-800/60 border border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Printer size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Druckansicht & PDF-Export
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Öffnet ein sauberes, formatiertes Drucklayout zum direkten Speichern als PDF.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handlePrintPDF}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white font-medium text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors border border-white/10"
                >
                  <Printer size={13} />
                  PDF drucken
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-800/60 border border-white/5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <ArrowDownToLine size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Alle Chats exportieren ({allThreads.length})
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      Fasst alle Seitenleisten-Unterhaltungen in einer einzigen Markdown-Datei zusammen.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleExportMarkdownAll}
                  className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white font-medium text-xs flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors border border-white/10"
                >
                  <Download size={13} />
                  Alle (.md)
                </button>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-800/80 to-neutral-900 border border-orange-500/20 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Komplettes PapayaOS JSON-Backup</h3>
                    <p className="text-xs text-neutral-400">
                      Beinhaltet alle {allThreads.length} Chats, alle Nachrichten, Rollen, sowie deine {customPlugins.length} Custom Plugins.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-[11px] text-neutral-300 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Chats gesamt:</span>
                    <span className="text-orange-300">{allThreads.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Custom Plugins:</span>
                    <span className="text-amber-300">{customPlugins.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Format:</span>
                    <span className="text-emerald-400">PapayaOS Schema v4.2 JSON</span>
                  </div>
                </div>

                <button
                  onClick={handleExportJSON}
                  className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  <Download size={14} />
                  Backup-Datei herunterladen (.json)
                </button>
              </div>
            </div>
          )}

          {activeTab === 'restore' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-white/20 hover:border-orange-500/60 rounded-xl bg-black/20 hover:bg-black/30 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 group-hover:bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-2 transition-colors">
                  <Upload size={22} />
                </div>
                <h4 className="text-xs font-bold text-white">
                  JSON-Backup-Datei auswählen oder hierher ziehen
                </h4>
                <p className="text-[11px] text-neutral-400 mt-1 max-w-sm">
                  Unterstützt zuvor exportierte PapayaOS Backup-Dateien (*.json)
                </p>
              </div>

              {importStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                    pendingRestore
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  {pendingRestore ? (
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{importStatus}</p>
                    {pendingRestore && (
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Klicke unten auf "Backup einspielen", um deine Daten zu übernehmen.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {pendingRestore && (
                <button
                  onClick={handleConfirmRestore}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
                >
                  <CheckCircle2 size={15} />
                  Backup jetzt einspielen ({pendingRestore.threads.length} Chats)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-black/40 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <CheckCircle2 size={12} className="text-emerald-400" />
            PapayaOS Data Shield aktiv
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 font-medium cursor-pointer transition-colors"
          >
            Schließen
          </button>
        </div>
      </motion.div>
    </div>
  );
};
