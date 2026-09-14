/**
 * Utility for parsing and managing thought traces / reasoning lines in messages
 */

export interface ParsedThoughtResult {
  thought: string | null;
  cleanContent: string;
  isThinking: boolean;
  score: string;
}

export function parseThoughtAndContent(rawText: string = ''): ParsedThoughtResult {
  if (!rawText) {
    return { thought: null, cleanContent: '', isThinking: false, score: '99.4%' };
  }

  // Robust regex matching for <thought> or <thinking> tags (including <thought\n>, whitespace, or attributes)
  const openMatch = /<\s*(?:thought|thinking)\b[^>]*>/i.exec(rawText);

  if (openMatch && openMatch.index !== -1) {
    const startIdx = openMatch.index;
    const afterOpen = startIdx + openMatch[0].length;
    const restText = rawText.slice(afterOpen);

    // Look for closing tag </thought> or </thinking>
    const closeMatch = /<\/\s*(?:thought|thinking)\s*>/i.exec(restText);

    if (!closeMatch) {
      // Model is actively streaming its thoughts!
      const streamingThought = restText.trim();
      const priorContent = rawText.slice(0, startIdx).trim();
      return {
        thought: streamingThought,
        cleanContent: priorContent,
        isThinking: true,
        score: 'STREAMING',
      };
    }

    const thought = restText.slice(0, closeMatch.index).trim();
    const afterClose = afterOpen + closeMatch.index + closeMatch[0].length;
    const cleanContent = (rawText.slice(0, startIdx) + rawText.slice(afterClose)).trim();

    return {
      thought,
      cleanContent,
      isThinking: false,
      score: '99.4%',
    };
  }

  return {
    thought: null,
    cleanContent: rawText,
    isThinking: false,
    score: '99.4%',
  };
}

/**
 * Provides a fallback reasoning trace for existing or legacy messages
 * so they visually align with the Papaya Intelligence reasoning design
 */
export function getFallbackThoughtForMessage(content: string, persona?: string): string {
  if (!content || !content.trim()) {
    return '';
  }

  const lower = content.toLowerCase();

  if (lower.includes('schwester') || lower.includes('launch') || lower.includes('gmail') || lower.includes('maps') || lower.includes('kalender')) {
    return 'Handshake mit Cortex-Core aktiv. Nutzer-Vision für Launch & Google Workspace analysiert. Roadmap für Maps, Gmail und Kalender aufgestellt.';
  }

  if (lower.includes('was kannst du') || lower.includes('drauf') || lower.includes('kannst') || lower.includes('feature') || lower.includes('funktion')) {
    return 'Capability-Matrix synchronisiert. System-Module (Papaya Flow, Deep Work Focus, Vision & Workspace-Bridge) auf Abruf bereitgestellt.';
  }

  if (lower.includes('kack') || lower.includes('schlecht') || lower.includes('warum') || lower.includes('bug') || lower.includes('fehler') || lower.includes('nerv')) {
    return 'System-Diagnose initiiert. Sprach-Synthese rekalibriert, Kontextpuffer aktualisiert und Antwortlogik geschärft.';
  }

  if (lower.includes('focus') || lower.includes('fokus') || lower.includes('zen')) {
    return 'Deep Work Trigger empfangen. Latenz 0ms. System-Notifikationen drosseln und Fokus-Sequenz initialisieren.';
  }

  if (lower.includes('optimier') || lower.includes('ram') || lower.includes('cache') || lower.includes('speicher')) {
    return 'Diagnose-Routine gestartet. RAM-Allokation prüfen, inaktive Daemon-Prozesse terminieren und NPU-Pipeline bereinigen.';
  }

  if (lower.includes('foto') || lower.includes('bild') || lower.includes('screenshot')) {
    return 'Vision-Sensor aktiv. Bildanalyse nach Konturen, Textfeldern und UI-Metadaten durchgeführt. Fokus auf praxisnahe Erklärung.';
  }

  if (lower.includes('code') || lower.includes('skript') || lower.includes('python') || lower.includes('javascript') || lower.includes('programm')) {
    return 'Compiler-Pipeline vorbereitet. Syntax-Validierung und Best-Practice-Struktur für Code-Ausgabe aktiv.';
  }

  if (persona === 'automator' || lower.includes('workflow') || lower.includes('flow')) {
    return 'Workflow-Synthese initiiert. Papaya Flow Syntax validieren und anwendungsbereites Skript generieren.';
  }

  if (persona === 'creative') {
    return 'Visuelle Synthese aktiv. Farb- und Typografiehierarchie abgleichen, ästhetische Akzente setzen.';
  }

  // Default signature line matching the user's reference
  return 'System-Handshake erfolgreich. Die neuronale Verbindung zu Mr steht, Latenz bei 0ms. Zeit, die Datenströme zu ordnen.';
}
