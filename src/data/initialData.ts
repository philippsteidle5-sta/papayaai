import { ChatThread, SystemStatus } from '../types';

export const INITIAL_THREADS: ChatThread[] = [
  {
    id: 'thread-welcome',
    title: '🥭 Willkommen bei PapayaOS Intelligence',
    persona: 'assistant',
    updatedAt: 'Gerade eben',
    isPinned: true,
    tag: 'system',
    messages: [
      {
        id: 'msg-w1',
        role: 'model',
        content: `### 👋 Willkommen in deinem **PapayaOS Chat & Intelligence Hub**!

PapayaOS wurde mit einem klaren Ziel entwickelt: **"A fresher way to do more"**.

Ich bin deine integrierte System-KI und unterstütze dich nahtlos in deinen vier Kernbereichen:
- 🎯 **FOCUS:** Eliminiere Ablenkungen mit nativem Focus Mode & Zeiteinteilung.
- 🎨 **CREATE:** Entwirf UI-Konzepte, schreibe Texte und visualisiere Ideen.
- ⚙️ **AUTOMATE:** Erstelle Papaya Flow Workflows und automatisiere Routineaufgaben.
- 🚀 **EVOLVE:** Erweitere dein System mit intelligenter NPU-Beschleunigung.

---

#### 💡 Schnelle Einstiegs-Befehle:
- Gib \`/focus 25\` ein, um eine fokussierte Pomodoro-Session zu starten.
- Gib \`/optimize\` ein, um den RAM-Cache und NPU-Threads zu optimieren.
- Gib \`/automate\` ein, um einen neuen Workflow anzulegen.
- Gib \`/theme\` ein, um zwischen Sunset Terrace, Papaya Obsidian und Citrus zu wechseln.

Wie kann ich heute deinen Arbeitstag bereichern?`,
        timestamp: '12:00',
        source: 'local',
        thought: 'System-Handshake erfolgreich. Die neuronale Verbindung zu Mr steht, Latenz bei 0ms. Zeit, die Datenströme zu ordnen.',
        reasoningScore: '99.4%',
        actions: [
          { id: 'act-focus', label: '🧘 Focus Mode starten', command: '/focus 25', type: 'timer' },
          { id: 'act-ram', label: '⚡ RAM & Cache optimieren', command: '/optimize', type: 'system' },
          { id: 'act-auto', label: '⚙️ Papaya Flow erstellen', command: '/automate', type: 'system' }
        ]
      }
    ]
  },
  {
    id: 'thread-automation',
    title: '⚡ Workflow: Desktop-Dateien aufräumen',
    persona: 'automator',
    updatedAt: 'Vor 15 Min',
    isPinned: false,
    tag: 'automation',
    messages: [
      {
        id: 'msg-a1',
        role: 'user',
        content: 'Erstelle mir einen Papaya Flow Workflow, der jeden Abend alle Screenshots und Downloads automatisch in passende Ordner sortiert.',
        timestamp: '11:42'
      },
      {
        id: 'msg-a2',
        role: 'model',
        content: `Hier ist dein fertiger **Papaya Flow Workflow** für die automatische Datei-Organisation:

\`\`\`papaya
// PapayaOS Flow Script: DesktopOrganizer.flow
workflow "Abendliche Bereinigung" {
  schedule: cron("0 18 * * 1-5") // Mo-Fr um 18:00 Uhr
  
  rules {
    on(directory.watch("~/Desktop")) {
      match extension in [".png", ".jpg", ".jpeg"] && name.startsWith("Screenshot") => {
        moveTo("~/Pictures/Screenshots/" + date.format("YYYY-MM"))
        notify("Screenshots archiviert", "PapayaOS Organizer")
      }
      
      match extension in [".pdf", ".docx", ".xlsx"] => {
        moveTo("~/Documents/Incoming/" + date.format("YYYY-MM"))
      }
      
      match extension in [".dmg", ".zip", ".tar.gz"] => {
        moveTo("~/Downloads/Archives")
      }
    }
  }
}
\`\`\`

#### Ausführungsmöglichkeiten:
1. Der Workflow läuft im Hintergrund ohne spürbare CPU-Last.
2. Über die Systemleiste kannst du ihn mit \`⌘+Shift+O\` auch manuell triggern.`,
        timestamp: '11:43',
        source: 'local',
        thought: 'Workflow-Synthese initiiert. Papaya Flow Syntax validieren und anwendungsbereites Skript generieren.',
        reasoningScore: '98.9%',
        actions: [
          { id: 'act-run', label: '▶️ Workflow jetzt testen', command: '/automate test', type: 'system' }
        ]
      }
    ]
  },
  {
    id: 'thread-creative',
    title: '🎨 UI & Farbharmonie für PapayaOS Apps',
    persona: 'creative',
    updatedAt: 'Gestern',
    isPinned: false,
    tag: 'design',
    messages: [
      {
        id: 'msg-c1',
        role: 'user',
        content: 'Welche Design-Prinzipien und Farbpaletten nutzt PapayaOS für Apps im Ökosystem?',
        timestamp: 'Gestern 16:30'
      },
      {
        id: 'msg-c2',
        role: 'model',
        content: `### 🎨 Die PapayaOS Design-Sprache ("Tropic Modernism")

PapayaOS verbindet die Frische und Wärme tropischer Fruchtfarben mit der Präzision moderner minimalistischer Schweizer Typografie:

1. **Primärfarben:**
   - \`Papaya Coral\`: \`#F46036\` (Haupt-Akzentfarbe für Aktionen)
   - \`Golden Mango\`: \`#FAA307\` (Highlights, Fokus-Indikatoren)
   - \`Rind Green\`: \`#2D6A4F\` & \`#52B788\` (Erfolgsstatus, Energieeffizienz)

2. **Neutrals & Tiefe:**
   - \`Obsidian Seed\`: \`#141419\` (Tiefes, augenschonendes Schwarz)
   - \`Alabaster Stone\`: \`#F8F9FA\` (Warme, blendfreie Tageslicht-Oberflächen)
   - \`Sunset Haze\`: Sanfte Farbverläufe angelehnt an Sonnenuntergänge über der Küste.

3. **Optische Balance:**
   - Subtile Glasur-Effekte (\`backdrop-blur\`) nur dort, wo sie räumliche Tiefe schaffen.
   - Kein überflüssiger Schnickschnack – reine Klarheit und Fokus!`,
        timestamp: 'Gestern 16:31',
        source: 'local',
        thought: 'Visuelle Synthese aktiv. Farb- und Typografiehierarchie abgleichen, ästhetische Akzente für Tropic Modernism setzen.',
        reasoningScore: '99.1%'
      }
    ]
  }
];

export const INITIAL_SYSTEM_STATUS: SystemStatus = {
  osName: 'PapayaOS',
  version: '4.2.1 LTS',
  build: '2026.09-Sunset',
  kernel: 'Coral-Micro 6.4.1 (64-bit)',
  uptime: '4h 32m',
  cpuUsage: 19,
  ramUsageGb: '5.6',
  ramTotalGb: 16,
  neuralEngineStatus: 'Aktiv (NPU Coral Gen 3)',
  activeProfile: 'Focus & Create'
};

export const QUICK_PROMPTS = [
  {
    icon: '🧘',
    label: 'Focus Mode starten',
    prompt: '/focus 25',
    description: '25 Min Deep-Work mit DND & Timer'
  },
  {
    icon: '⚡',
    label: 'System optimieren',
    prompt: '/optimize',
    description: 'Cache leeren & RAM freigeben'
  },
  {
    icon: '⚙️',
    label: 'Papaya Flow Workflow',
    prompt: 'Zeige mir wie ich eine Automation in PapayaOS erstelle',
    description: 'Skripte für tägliche Routinen'
  },
  {
    icon: '🎨',
    label: 'Kreative Farbpalette',
    prompt: 'Erstelle eine Farbpalette für eine native PapayaOS Wetter-App',
    description: 'Designvorschläge & Hex-Codes'
  }
];

export const SLASH_COMMANDS = [
  { command: '/focus', description: 'Startet den Papaya Focus Modus (z.B. /focus 25)', category: 'System' },
  { command: '/optimize', description: 'Bereinigt System-Cache & NPU-Latenzen', category: 'System' },
  { command: '/automate', description: 'Erstellt ein neues Papaya Flow Skript', category: 'Workflow' },
  { command: '/status', description: 'Zeigt Systemressourcen, Kernel & NPU-Last', category: 'Info' },
  { command: '/theme', description: 'Wechselt das Betriebssystem-Theme', category: 'Anzeige' },
  { command: '/clear', description: 'Leert den aktuellen Chatverlauf', category: 'Chat' },
  { command: '/help', description: 'Zeigt alle PapayaOS Tastenkürzel und Befehle', category: 'Hilfe' }
];
