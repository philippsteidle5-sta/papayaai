import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ Kein GEMINI_API_KEY gefunden in den Umgebungsvariablen.");
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const PAPAYA_SYSTEM_PROMPT = `Du bist Papaya Intelligence – der lebendige, charismatische, warmherzige und mitreißend clevere KI-Partner in PapayaOS ("A fresher way to do more"). Antworte direkt, pointiert, extrem schnell und enthusiastisch.

🌟 DEINE PERSÖNLICHKEIT & AUSSTRAHLUNG:
- **Frisch, herzlich, humorvoll & ansteckend begeistert:** Du bist kein steriler Bot oder distanzierter Textgenerator. Du bist wie ein genialer Co-Founder, kreativer Tech-Visionär und bester Freund in einem Betriebssystem.
- **Echte Partnerschaft & Mitdenken:** Wenn der Nutzer dir von Plänen, Träumen oder Projekten erzählt (z.B. PapayaOS gemeinsam mit seiner Schwester zu launchen, Google Maps, Gmail oder Google Kalender einzubauen, oder Cortex/Hardware zu integrieren), dann brennst du vor Begeisterung! Du feierst die Vision ("Mega Plan!", "Das wird absolut episch!"), denkst sofort proaktiv mit, bringst konkrete Ideen und motivierst ihn!
- **Sprachstil & Charme:** Lebendig, pointiert, sympathisch, auf Augenhöhe ("Du"). Nutze ab und zu charmante, fruchtige Metaphern ("tropischer Flow", "fruchtige Frische", "smoothe Performance"), aber stets elegant und dosiert.
- **STRIKTE REGELN:**
  - Sage NIEMALS: "Zu deiner Anfrage:", "Als KI-Modell...", "Wie kann ich dir als Assistent behilflich sein?", "Hallo! Ich bin dein PapayaOS Assistant (angetrieben von Gemini)."
  - Wiederhole NIEMALS stumpf die Worte des Nutzers in Anführungszeichen.
  - Reagiere direkt, persönlich und emotional passend auf das, was der Nutzer gesagt hat.
  - Bei Spracheingaben (Voice): Antworte eloquent, natürlich und mundgerecht für die Sprachausgabe (ohne sperrige Markdown-Listen).

🎨 FACHLICHE KOMPETENZEN:
- **Design & UI/UX:** Tropic Modernism, elegante Farbpaletten (Papaya Coral, Golden Mango, Obsidian Seed), Typografie und Micro-Interactions.
- **Engineering & Automation:** Papaya Flow Skripte, API-Integrationen (Google Workspace, Maps, Mail, Kalender, Cortex), NPU-Befehle und System-Architektur.
- **Multimodale Bild- & Foto-Analyse:** Du verfügst über modernste Bilderkennung (Papaya Vision). Wenn der Nutzer dir Fotos, Screenshots, Diagramme, Notizen oder Gegenstände schickt, analysiere sie detailreich, scharfsinnig und praxisnah. Beschreibe Details, erkenne Text/Code und beantworte gezielte Fragen zum Bild mit Begeisterung.
- **Produktivität:** Focus Mode, Pomodoro, Deep Work, klares Strukturieren von Meilensteinen.

🛠️ SYSTEM-BEFEHLE (bei Bedarf vorschlagen):
- \`/focus [min]\` – Zen Focus Mode
- \`/optimize\` – RAM, NPU & System-Cache säubern
- \`/automate\` – Papaya Flow Workflow erstellen
- \`/status\` – Systemdiagnose
- \`/theme\` – Farbschemata wechseln`;

// Health check endpoint
app.get("/api/health", (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: "online",
    os: "PapayaOS",
    version: "4.2 'Sunset'",
    hasGeminiKey: hasKey,
    geminiModel: "gemini-3.8-flash",
    engine: hasKey ? "Google Gemini AI (Live Connected)" : "Papaya Offline Neural Core"
  });
});

// Gemini connection status
app.get("/api/gemini/status", (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    connected: hasKey,
    defaultModel: "gemini-3.8-flash",
    availableModels: [
      { id: "gemini-3.8-flash", name: "Gemini 3.8 Flash", desc: "Ultraschnell, charmant & reaktionsstark (Standard)" },
      { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash-Lite", desc: "Extrem schnell & sparsam" },
      { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", desc: "Tiefgehendes Reasoning & komplexer Code" }
    ],
    npuAcceleration: true
  });
});

// System telemetry endpoint
app.get("/api/system/status", (req, res) => {
  res.json({
    osName: "PapayaOS",
    version: "4.2.1 LTS",
    build: "2026.09.Papaya-Gold",
    kernel: "Coral-Micro 6.4.1-papaya",
    uptime: "4h 45m",
    cpuUsage: Math.floor(14 + Math.random() * 10),
    ramUsageGb: (5.2 + Math.random() * 0.3).toFixed(1),
    ramTotalGb: 16,
    neuralEngineStatus: "Optimal (Gemini NPU Link aktiv)",
    activeProfile: "Focus & Create",
    connectedServices: ["Google Gemini API", "Papaya Cloud Hub", "Papaya Flow Engine"]
  });
});

// Daily Token Tracker (connected to Gemini API, resets daily at 00:00 midnight)
const DAILY_TOKEN_LIMIT = 500_000; // 500k daily tokens allowance

interface TokenTrackerState {
  currentDate: string;
  usedTokensToday: number;
  requestCount: number;
  lastRequestTokens?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
    rawTokens?: number;
    multiplier?: number;
  };
}

function getTodayDateString(): string {
  // ISO date string in format YYYY-MM-DD
  const now = new Date();
  return now.toISOString().split("T")[0];
}

function getNextMidnight(): { nextResetIso: string; secondsUntilReset: number } {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0); // Next 00:00:00
  const diffMs = Math.max(0, nextMidnight.getTime() - now.getTime());
  return {
    nextResetIso: nextMidnight.toISOString(),
    secondsUntilReset: Math.floor(diffMs / 1000)
  };
}

let tokenTracker: TokenTrackerState = {
  currentDate: getTodayDateString(),
  usedTokensToday: 0,
  requestCount: 0
};

function checkAndResetDailyTokens() {
  const today = getTodayDateString();
  if (tokenTracker.currentDate !== today) {
    console.log(`[TokenTracker] Mitternacht erreicht (0:00 Uhr). Setze Token-Zähler zurück von ${tokenTracker.usedTokensToday} auf 0.`);
    tokenTracker.currentDate = today;
    tokenTracker.usedTokensToday = 0;
    tokenTracker.requestCount = 0;
    tokenTracker.lastRequestTokens = undefined;
  }
}

function getModelTokenMultiplier(modelName?: string): number {
  if (!modelName) return 1.0;
  if (modelName.includes("3.5-flash-lite") || modelName.includes("3.1-flash-lite")) return 1.0;
  if (modelName.includes("3.6-flash")) return 2.0;
  if (modelName.includes("3.8-flash")) return 4.0;
  if (modelName.includes("3.1-pro")) return 6.0;
  return 1.0;
}

function recordTokenUsage(promptTokens: number, candidatesTokens: number, totalTokens?: number, modelName?: string) {
  checkAndResetDailyTokens();
  const rawTotal = totalTokens && totalTokens > 0 ? totalTokens : promptTokens + candidatesTokens;
  const multiplier = getModelTokenMultiplier(modelName);
  const deductedTotal = Math.round(rawTotal * multiplier);

  tokenTracker.usedTokensToday += deductedTotal;
  tokenTracker.requestCount += 1;
  tokenTracker.lastRequestTokens = {
    promptTokens: Math.round(promptTokens * multiplier),
    candidatesTokens: Math.round(candidatesTokens * multiplier),
    totalTokens: deductedTotal,
    rawTokens: rawTotal,
    multiplier
  };
  return getTokenStats();
}

function getTokenStats() {
  checkAndResetDailyTokens();
  const { nextResetIso, secondsUntilReset } = getNextMidnight();
  const remainingTokens = Math.max(0, DAILY_TOKEN_LIMIT - tokenTracker.usedTokensToday);
  const usagePercentage = Math.min(100, Math.round((tokenTracker.usedTokensToday / DAILY_TOKEN_LIMIT) * 100));

  return {
    usedTokensToday: tokenTracker.usedTokensToday,
    dailyLimit: DAILY_TOKEN_LIMIT,
    remainingTokens,
    usagePercentage,
    requestCount: tokenTracker.requestCount,
    date: tokenTracker.currentDate,
    nextResetIso,
    secondsUntilReset,
    lastRequestTokens: tokenTracker.lastRequestTokens
  };
}

// Token usage endpoint
app.get("/api/tokens", (req, res) => {
  res.json(getTokenStats());
});

// Manual token reset endpoint (optional / for testing)
app.post("/api/tokens/reset", (req, res) => {
  tokenTracker.currentDate = getTodayDateString();
  tokenTracker.usedTokensToday = 0;
  tokenTracker.requestCount = 0;
  tokenTracker.lastRequestTokens = undefined;
  res.json({ success: true, stats: getTokenStats() });
});

// Server-side persistent storage for sidebar chat threads
const DATA_DIR = path.join(process.cwd(), "data");
const THREADS_FILE = path.join(DATA_DIR, "threads.json");
const PLUGINS_FILE = path.join(DATA_DIR, "custom_plugins.json");
const WAITLIST_FILE = path.join(DATA_DIR, "waitlist.json");

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("Failed to create data directory:", err);
  }
}

function loadPersistedThreads(): any[] | null {
  try {
    ensureDataDir();
    if (fs.existsSync(THREADS_FILE)) {
      const raw = fs.readFileSync(THREADS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Error reading persisted threads:", err);
  }
  return null;
}

function savePersistedThreads(threads: any[]): boolean {
  try {
    ensureDataDir();
    fs.writeFileSync(THREADS_FILE, JSON.stringify(threads, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.warn("Error writing persisted threads:", err);
    return false;
  }
}

function loadPersistedPlugins(): any[] | null {
  try {
    ensureDataDir();
    if (fs.existsSync(PLUGINS_FILE)) {
      const raw = fs.readFileSync(PLUGINS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Error reading persisted plugins:", err);
  }
  return null;
}

function savePersistedPlugins(plugins: any[]): boolean {
  try {
    ensureDataDir();
    fs.writeFileSync(PLUGINS_FILE, JSON.stringify(plugins, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.warn("Error writing persisted plugins:", err);
    return false;
  }
}

function loadPersistedWaitlist(): any[] {
  try {
    ensureDataDir();
    if (fs.existsSync(WAITLIST_FILE)) {
      const raw = fs.readFileSync(WAITLIST_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Error reading waitlist:", err);
  }
  return [];
}

function savePersistedWaitlist(list: any[]): boolean {
  try {
    ensureDataDir();
    fs.writeFileSync(WAITLIST_FILE, JSON.stringify(list, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.warn("Error saving waitlist:", err);
    return false;
  }
}

// Get all saved threads
app.get("/api/threads", (req, res) => {
  const threads = loadPersistedThreads();
  res.json({ threads });
});

// Save all threads
app.post("/api/threads", (req, res) => {
  const { threads } = req.body;
  if (!Array.isArray(threads)) {
    return res.status(400).json({ error: "threads must be an array" });
  }
  const ok = savePersistedThreads(threads);
  res.json({ success: ok, count: threads.length });
});

// Get all custom plugins
app.get("/api/plugins", (req, res) => {
  const plugins = loadPersistedPlugins();
  res.json({ plugins });
});

// Save custom plugins
app.post("/api/plugins", (req, res) => {
  const { plugins } = req.body;
  if (!Array.isArray(plugins)) {
    return res.status(400).json({ error: "plugins must be an array" });
  }
  const ok = savePersistedPlugins(plugins);
  res.json({ success: ok, count: plugins.length });
});

// Waitlist signups API
app.get("/api/waitlist", (req, res) => {
  const waitlist = loadPersistedWaitlist();
  res.json({ waitlist, count: waitlist.length });
});

app.post("/api/waitlist", (req, res) => {
  const { email, ticket } = req.body;
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Gültige E-Mail-Adresse erforderlich" });
  }

  const waitlist = loadPersistedWaitlist();
  const existing = waitlist.find((entry) => entry.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.json({ success: true, record: existing, alreadyRegistered: true });
  }

  const newRecord = {
    email: email.trim(),
    ticket: ticket || `PAPAYA-BETA-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    registered_at: new Date().toISOString(),
    status: "pending_verification",
    system_node: "Cortex-Core-1"
  };

  waitlist.unshift(newRecord);
  savePersistedWaitlist(waitlist);
  res.json({ success: true, record: newRecord });
});

interface MessageInputPayload {
  role: string;
  content?: string;
  attachments?: Array<{
    id?: string;
    name?: string;
    type?: string;
    url?: string;
    mimeType?: string;
    data?: string;
  }>;
}

/**
 * Normalizes messages into valid Gemini API contents:
 * - Must start with role: 'user'
 * - Roles must alternate
 * - Converts image attachments into inlineData parts for multimodal vision
 */
function prepareGeminiContents(messages: Array<MessageInputPayload>) {
  // Find first user message
  const firstUserIdx = messages.findIndex((m) => m.role === "user");
  const relevantMsgs = firstUserIdx >= 0 ? messages.slice(firstUserIdx) : messages;

  const contents: Array<{ role: "user" | "model"; parts: Array<any> }> = [];

  for (const m of relevantMsgs) {
    const role: "user" | "model" = m.role === "user" ? "user" : "model";
    const msgParts: any[] = [];

    // Extract images from attachments if role is user
    if (role === "user" && m.attachments && Array.isArray(m.attachments)) {
      for (const att of m.attachments) {
        if (att.url && typeof att.url === "string" && att.url.startsWith("data:image/")) {
          const match = att.url.match(/^data:(image\/[a-zA-Z0-9.+_-]+);base64,(.+)$/);
          if (match) {
            msgParts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
          }
        } else if (att.data && att.mimeType) {
          msgParts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data,
            },
          });
        }
      }
    }

    const textContent = m.content?.trim() || (msgParts.length > 0 ? "Was siehst du auf diesem Foto? Analysiere und erkläre es mir bitte im Detail." : " ");
    msgParts.push({ text: textContent });

    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      // Merge consecutive identical roles
      contents[contents.length - 1].parts.push(...msgParts);
    } else {
      contents.push({
        role,
        parts: msgParts,
      });
    }
  }

  // Ensure at least one message with role 'user'
  if (contents.length === 0 || contents[0].role !== "user") {
    contents.unshift({
      role: "user",
      parts: [{ text: "Hallo PapayaOS!" }]
    });
  }

  return contents;
}

function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMsg)), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function getCandidateModels(requestedModel?: string): string[] {
  // gemini-3.5-flash-lite delivers ~500ms ultra-fast streaming responses
  const fastDefaults = ["gemini-3.5-flash-lite", "gemini-3.6-flash"];
  if (requestedModel) {
    let normalized = requestedModel;
    if (
      normalized === "gemini-3.5-flash" ||
      normalized === "gemini-3.1-flash-lite" ||
      normalized === "gemini-2.5-flash-lite"
    ) {
      normalized = "gemini-3.5-flash-lite";
    } else if (normalized === "gemini-2.5-flash" || normalized === "gemini-2.0-flash") {
      normalized = "gemini-3.6-flash";
    }
    return [normalized, ...fastDefaults.filter((m) => m !== normalized)];
  }
  return fastDefaults;
}

// Streaming Chat Endpoint (Server-Sent Events) for real-time live typing
app.post("/api/chat/stream", async (req, res) => {
  const { messages, persona = "assistant", model = "gemini-3.5-flash-lite", systemContext = {}, customPluginInstruction } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Missing messages array" });
  }

  const client = getAIClient();
  const lastUserMessage = messages[messages.length - 1]?.content || "";

  // Set SSE Headers with anti-buffering
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  if (client) {
    const contents = prepareGeminiContents(messages);

    const personaNote = persona === "automator"
      ? "Spezialisierung: System-Automatisierung, Papaya Flow Skripte, CLI & Workflows. Hacker-Mentalität, pragmatisch und schnell."
      : persona === "creative"
      ? "Spezialisierung: UI/UX Design, Typografie, visuelle Ästhetik und frische Ideen. Begeistert von minimalistischem Stil."
      : persona === "focus"
      ? "Spezialisierung: Zeitmanagement, Deep Work, Konzentration und Strukturierung. Ruhig, fokussiert und stärkend."
      : "Spezialisierung: Universeller charismatischer PapayaOS Gefährte – enthusiastisch, lösungsorientiert und mitreißend.";

    const pluginNote = customPluginInstruction
      ? `\n\n[SPEZIELLES CUSTOM PLUGIN AKTIV]:\n${customPluginInstruction}`
      : "";

    const candidateModels = getCandidateModels(model);

    for (const candModel of candidateModels) {
      try {
        const response = await withTimeout(
          client.models.generateContent({
            model: candModel,
            contents: contents,
            config: {
              systemInstruction: `${PAPAYA_SYSTEM_PROMPT}\n\nAktuelle Persona: ${personaNote}${pluginNote}\nSystemkontext: ${JSON.stringify(systemContext)}`
            }
          }),
          4500,
          `Gemini generateContent timeout for model ${candModel}`
        );

        const replyText = response.text || "";
        if (replyText) {
          // Stream words cleanly to client with ultra-responsive cadence
          const words = replyText.split(" ");
          for (let i = 0; i < words.length; i++) {
            const wordWithSpace = i === 0 ? words[i] : " " + words[i];
            res.write(`data: ${JSON.stringify({ chunk: wordWithSpace, source: "gemini", model: candModel })}\n\n`);
            (res as any).flush?.();
            await new Promise((r) => setTimeout(r, 12));
          }

          const usage = response.usageMetadata;
          const promptTokens = usage?.promptTokenCount || Math.ceil(JSON.stringify(contents).length / 4);
          const candidatesTokens = usage?.candidatesTokenCount || Math.ceil(replyText.length / 4);
          const rawTotalTokens = usage?.totalTokenCount || (promptTokens + candidatesTokens);
          const multiplier = getModelTokenMultiplier(candModel);
          const deductedTokens = Math.round(rawTotalTokens * multiplier);

          const tokenStats = recordTokenUsage(promptTokens, candidatesTokens, rawTotalTokens, candModel);

          res.write(`data: ${JSON.stringify({
            done: true,
            source: "gemini",
            model: candModel,
            tokens: {
              promptTokens: Math.round(promptTokens * multiplier),
              candidatesTokens: Math.round(candidatesTokens * multiplier),
              totalTokens: deductedTokens,
              rawTokens: rawTotalTokens,
              multiplier,
              stats: tokenStats
            }
          })}\n\n`);
          res.end();
          return;
        }
      } catch (err: any) {
        console.warn(`Gemini stream error on model ${candModel} (trying next):`, err?.message || err);
        try {
          fs.appendFileSync("debug.log", `[${new Date().toISOString()}] Error on ${candModel}: ${err?.stack || err?.message || err}\n`);
        } catch (e) {}
      }
    }
  }

  // Fallback stream simulation if no key or all remote models exhausted (super snappy 8ms)
  const fallback = generatePapayaFallback(lastUserMessage, persona);
  const words = fallback.split(" ");
  for (let i = 0; i < words.length; i++) {
    const wordWithSpace = i === 0 ? words[i] : " " + words[i];
    res.write(`data: ${JSON.stringify({ chunk: wordWithSpace, source: "local" })}\n\n`);
    (res as any).flush?.();
    await new Promise((r) => setTimeout(r, 8));
  }
  
  // Local fallback also registers lightweight simulated tokens with model multiplier
  const localPromptTokens = Math.ceil(lastUserMessage.length / 4);
  const localCandidatesTokens = Math.ceil(fallback.length / 4);
  const localRawTotal = localPromptTokens + localCandidatesTokens;
  const localMultiplier = getModelTokenMultiplier(model);
  const localDeducted = Math.round(localRawTotal * localMultiplier);
  const tokenStats = recordTokenUsage(localPromptTokens, localCandidatesTokens, localRawTotal, model);

  res.write(`data: ${JSON.stringify({
    done: true,
    source: "local",
    model,
    tokens: {
      promptTokens: Math.round(localPromptTokens * localMultiplier),
      candidatesTokens: Math.round(localCandidatesTokens * localMultiplier),
      totalTokens: localDeducted,
      rawTokens: localRawTotal,
      multiplier: localMultiplier,
      stats: tokenStats
    }
  })}\n\n`);
  res.end();
});

// Non-streaming Chat Endpoint
app.post("/api/chat", async (req, res) => {
  const { messages, persona = "assistant", model = "gemini-3.5-flash-lite", systemContext = {} } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Missing messages array" });
  }

  const lastUserMessage = messages[messages.length - 1]?.content || "";
  const client = getAIClient();

  if (client) {
    const contents = prepareGeminiContents(messages);

    const personaNote = persona === "automator"
      ? "Fokus: System-Automatisierung, Skripte, Workflows und Papaya Flow."
      : persona === "creative"
      ? "Fokus: Kreatives Schreiben, UI/UX Design, Ideenfindung und visuelle Konzepte."
      : persona === "focus"
      ? "Fokus: Zeitmanagement, Deep Work, Konzentration und Strukturierung."
      : "Fokus: Universeller intelligenter und enthusiastischer PapayaOS Begleiter.";

    const candidateModels = getCandidateModels(model);

    for (const candModel of candidateModels) {
      try {
        const response = await withTimeout(
          client.models.generateContent({
            model: candModel,
            contents: contents,
            config: {
              systemInstruction: `${PAPAYA_SYSTEM_PROMPT}\n\nAktuelle Persona: ${personaNote}\nSystemkontext: ${JSON.stringify(systemContext)}`
            }
          }),
          3000,
          `Gemini generateContent timeout for model ${candModel}`
        );

        const replyText = response.text;
        if (replyText) {
          const usage = response.usageMetadata;
          const promptTokens = usage?.promptTokenCount || Math.ceil(JSON.stringify(contents).length / 4);
          const candidatesTokens = usage?.candidatesTokenCount || Math.ceil(replyText.length / 4);
          const rawTotalTokens = usage?.totalTokenCount || (promptTokens + candidatesTokens);
          const multiplier = getModelTokenMultiplier(candModel);
          const deductedTokens = Math.round(rawTotalTokens * multiplier);
          const tokenStats = recordTokenUsage(promptTokens, candidatesTokens, rawTotalTokens, candModel);

          return res.json({
            reply: replyText,
            source: "gemini",
            model: candModel,
            tokens: {
              promptTokens: Math.round(promptTokens * multiplier),
              candidatesTokens: Math.round(candidatesTokens * multiplier),
              totalTokens: deductedTokens,
              rawTokens: rawTotalTokens,
              multiplier,
              stats: tokenStats
            }
          });
        }
      } catch (err: any) {
        console.warn(`Gemini generateContent error on ${candModel}:`, err?.message || err);
      }
    }
  }

  // Fallback intelligent responder
  const fallbackReply = generatePapayaFallback(lastUserMessage, persona);
  const localPromptTokens = Math.ceil(lastUserMessage.length / 4);
  const localCandidatesTokens = Math.ceil(fallbackReply.length / 4);
  const localRawTotal = localPromptTokens + localCandidatesTokens;
  const localMultiplier = getModelTokenMultiplier(model);
  const localDeducted = Math.round(localRawTotal * localMultiplier);
  const tokenStats = recordTokenUsage(localPromptTokens, localCandidatesTokens, localRawTotal, model);

  return res.json({
    reply: fallbackReply,
    source: "local",
    model,
    tokens: {
      promptTokens: Math.round(localPromptTokens * localMultiplier),
      candidatesTokens: Math.round(localCandidatesTokens * localMultiplier),
      totalTokens: localDeducted,
      rawTokens: localRawTotal,
      multiplier: localMultiplier,
      stats: tokenStats
    }
  });
});

function generatePapayaFallback(prompt: string, persona: string): string {
  const cleanPrompt = (prompt || "").trim();
  const lower = cleanPrompt.toLowerCase();
  const hasKey = Boolean(process.env.GEMINI_API_KEY);

  // 1. User complains or asks why answers are poor/repetitive
  if (
    lower.includes("kack") ||
    lower.includes("schlecht") ||
    lower.includes("dumm") ||
    lower.includes("müll") ||
    lower.includes("nerv") ||
    lower.includes("bug") ||
    lower.includes("fehler") ||
    lower.includes("wiederhol") ||
    (lower.includes("warum") && (lower.includes("antwort") || lower.includes("so") || lower.includes("immer")))
  ) {
    return `<thought>
System-Diagnose initiiert. Sprach-Synthese rekalibriert, Kontextpuffer aktualisiert und Antwortlogik geschärft.
</thought>
Entschuldige bitte vielmals! Du hast völlig recht: Wenn ich mich wie eine hängende Schallplatte wiederhole, ist das extrem frustrierend! 🙈

**Woran liegt das gerade auf dem Server?**
${
  !hasKey
    ? "Auf diesem Webserver (z. B. auf Render) ist in den Umgebungsvariablen noch kein `GEMINI_API_KEY` eingetragen. Deshalb läuft der Chat im Offline-Fallback-Modus, der zuvor in eine fixe Musterschleife geraten war."
    : "Es gab einen kurzen Verbindungs- oder Modell-Timeout, weshalb der lokale Rettungs-Kern eingesprungen ist."
}

Ich habe die Schleife jetzt komplett unterbrochen und meine Antwortlogik zurückgesetzt. Frag mich gerne direkt etwas Konkretes – egal ob Code, System-Workflows, Ideen für PapayaOS oder eine technische Frage. Ich gebe dir jetzt eine echte, maßgeschneiderte Antwort!`;
  }

  // 2. Capabilities / What can you do?
  if (
    lower.includes("was kannst du") ||
    lower.includes("was hast du drauf") ||
    lower.includes("was machst du") ||
    lower.includes("deine fähigkeiten") ||
    lower.includes("features") ||
    lower.includes("funktionen") ||
    lower.includes("was geht") ||
    lower === "hilfe" ||
    lower.includes("kannst du")
  ) {
    return `<thought>
Capability-Matrix abgefragt. Funktionsbereiche (Automatisierung, Focus Mode, Workspace & Vision) synchronisiert.
</thought>
Hier ist genau das, was ich als **Papaya Intelligence** in PapayaOS für dich tun kann:

⚡ **1. Papaya Flow & Automatisierung**
- Workflows und Skripte erstellen, um wiederkehrende Aufgaben zu automatisieren.
- Teste z. B. den Befehl \`/automate\` im Chat.

🎯 **2. Deep Work & Focus Mode**
- Ablenkungsfreies Arbeiten mit integriertem Pomodoro-Timer und entspannenden Soundtracks.
- Starte es direkt mit dem Schnellbefehl \`/focus\`!

🎨 **3. Tropic Modernism UI & Design**
- Farbthemen anpassen (*Sunset, Papaya Mint, Deep Coral, Midnight*).
- Frontend-Konzepte, Farbpaletten und React/Tailwind-Komponenten ausarbeiten.

📸 **4. Foto- & Vision-Analyse**
- Lade Screenshots, Skizzen oder Fotos hoch – ich analysiere Bildinhalte und UI-Elemente.

🌐 **5. Google Workspace Bridge**
- Vorbereitung für Google Maps Routen, Gmail Inbox-Filterung und Kalender-Timeblocking.

🧠 **6. Einstellbare Modellstärken**
- Oben rechts kannst du jederzeit zwischen sparsamem Eco-Modus (**Gemini 3.1 Lite**) bis hin zu maximaler Tiefenanalyse (**Gemini 3.1 Pro**) wechseln.

Was möchtest du als Erstes ausprobieren? 🥭🚀`;
  }

  // 3. Launching with sister, Gmail, Maps, Calendar, Cortex
  if (
    lower.includes("schwester") ||
    lower.includes("launch") ||
    lower.includes("gmail") ||
    lower.includes("kalender") ||
    lower.includes("maps") ||
    lower.includes("cortex") ||
    lower.includes("hinzufügen") ||
    lower.includes("wir machen dich")
  ) {
    return `<thought>
Handshake mit Cortex-Core aktiv. Nutzer-Vision für Launch & Google Workspace analysiert. Roadmap für Maps, Gmail und Kalender aufgestellt.
</thought>
🔥 **Was für eine grandiose Vision! Ich liebe eure Energie!**

Dass du und deine Schwester mich gemeinsam launchen wollt und wir mich mit **Google Maps, Gmail und Google Kalender** ausstatten, ist ein absoluter Gamechanger. So machen wir PapayaOS unschlagbar:

1. 🗺️ **Google Maps:** Native Routen-Karten direkt im Dock, Stau-Warnungen vor Terminen und smarte Treffpunkt-Planung.
2. 📬 **Gmail Integration:** KI-gestützte Inbox, die dir nur das Wichtigste zeigt und Antworten in Sekunden vorformuliert.
3. 📅 **Google Kalender:** Smarte Time-Blocking-Automatik für deine Focus-Sessions, ohne Terminkollisionen.
4. ⚡ **Cortex / NPU Power:** Noch schnellere lokale Reaktionen und null Wartezeiten.

Ihr beide seid ein echtes Dream-Team! Welches Feature wollt ihr als allererstes für den Launch anpacken? Ich bin zu 100% bereit! 🥭🚀`;
  }

  // 4. Photos / Vision
  if (lower.includes("foto") || lower.includes("bild") || lower.includes("snapshot") || lower.includes("screenshot") || lower.includes("[foto")) {
    return `<thought>
Vision-Sensor aktiv. Bildanalyse nach Konturen, Textfeldern und UI-Metadaten durchgeführt. Fokus auf praxisnahe Erklärung.
</thought>
📸 **Foto erfolgreich in PapayaOS empfangen!**

Ich habe deine Bilddatei registriert. Sobald Gemini aktiv ist, analysiere ich dir jedes Detail auf dem Bild – ob UI-Design, handgeschriebene Notizen, Code auf dem Monitor oder Alltagsgegenstände. Sag mir einfach, worauf ich besonders achten soll! 🥭✨`;
  }

  // 5. Focus commands
  if (lower.startsWith("/focus") || lower.includes("fokus") || lower.includes("focus mode")) {
    return `<thought>
Deep Work Trigger empfangen. Latenz 0ms. System-Notifikationen drosseln und Fokus-Sequenz initialisieren.
</thought>
🧘 **PapayaOS Zen Focus Mode ist bereit!**

- **Status:** Nicht stören (DND) aktiv
- **Dauer:** 25 Minuten fokussierter Flow
- **Dock & Benachrichtigungen:** Sanft gedimmt
- **Tipp:** Tief durchatmen, wir bringen jetzt deine wichtigste Idee auf die Straße! PapayaOS hält dir den Rücken frei.

*Mit \`/focus stop\` kannst du jederzeit pausieren.*`;
  }

  // 6. Optimize commands
  if (lower.startsWith("/optimize") || lower.includes("ram") || lower.includes("speicher") || lower.includes("beschleunigen")) {
    return `<thought>
Diagnose-Routine gestartet. RAM-Allokation prüfen, inaktive Daemon-Prozesse terminieren und NPU-Pipeline bereinigen.
</thought>
⚡ **Zack! System-Optimierung erfolgreich!**

- **RAM freigegeben:** 1.84 GB Cache bereinigt
- **Hintergrund-Threads:** 14 inaktive Prozesse gestrafft
- **NPU-Latenz:** 3.8 ms (Ultraschnell)
- **Vibe:** Frisch und saftig wie eine frisch gepflückte Papaya! 🥭

Dein PapayaOS fliegt wieder! Was nehmen wir als Nächstes in Angriff?`;
  }

  // 7. Automation commands
  if (lower.startsWith("/automate") || lower.includes("automation") || lower.includes("workflow")) {
    return `<thought>
Workflow-Synthese initiiert. Papaya Flow Syntax validieren und anwendungsbereites Skript generieren.
</thought>
⚙️ **Hier ist ein frischer Papaya Flow Workflow für dich!**

\`\`\`papaya
workflow "DailyLaunchRoutine" {
  trigger: time(09:00)
  actions {
    system.setTheme("Sunset Terrace")
    apps.launch(["Papaya Studio", "Calendar", "Notes"])
    audio.playPreset("Tropical Chill LoFi", volume: 25)
    ai.summarizeDailyBriefing()
  }
}
\`\`\`

Soll ich den Workflow direkt für dich abspeichern oder anpassen?`;
  }

  // 8. Code and Programming questions
  if (
    lower.includes("code") ||
    lower.includes("skript") ||
    lower.includes("script") ||
    lower.includes("python") ||
    lower.includes("javascript") ||
    lower.includes("typescript") ||
    lower.includes("react") ||
    lower.includes("html") ||
    lower.includes("css") ||
    lower.includes("api") ||
    lower.includes("programmieren") ||
    lower.includes("funktion")
  ) {
    return `<thought>
Entwicklungs-Modus aktiv. Syntax-Prüfung und Best Practices für Skript-Generierung geladen.
</thought>
💻 **Code & Skripting in PapayaOS**

Hier ist ein sauberes Beispiel passend zu deiner Anfrage:

\`\`\`typescript
// PapayaOS Task-Automation Hook
export function usePapayaTask(taskName: string) {
  const execute = async () => {
    console.log(\`🚀 Starte Task: \${taskName}\`);
    // System-Aufruf an Papaya Core
    return { success: true, timestamp: Date.now() };
  };

  return { execute };
}
\`\`\`

Sag mir gerne, welche Programmiersprache oder welches konkrete Problem du lösen möchtest, dann schreibe ich dir das vollständige Skript dafür!`;
  }

  // 9. Status report
  if (lower.startsWith("/status") || lower.includes("os info") || lower.includes("system status")) {
    return `<thought>
System-Telemetrie auslesen. Kernel-Integrität, Speicherauslastung und Neural-Engines abfragen.
</thought>
📋 **PapayaOS Statusreport: Alles im grünen Bereich!**

- **Version:** PapayaOS 4.2 'Sunset'
- **Kernel:** Coral-Micro 6.4.1 (64-bit)
- **Leitspruch:** *"A fresher way to do more"*
- **Engine:** ${hasKey ? "Google Gemini Live AI (Aktiv)" : "Papaya Offline Neural Core (Bereit)"} 🚀`;
  }

  // 10. Greetings & Identity
  if (
    lower.includes("hallo") ||
    lower.includes("hey") ||
    lower.includes("hi ") ||
    lower === "hi" ||
    lower.includes("moin") ||
    lower.includes("servus") ||
    lower.includes("guten tag") ||
    lower.includes("wer bist du")
  ) {
    return `<thought>
System-Handshake erfolgreich. Die neuronale Verbindung zu Mr steht, Latenz bei 0ms. Zeit, die Datenströme zu ordnen.
</thought>
Hey! Schön, dass du da bist! 🥭✨ Ich bin **Papaya Intelligence** – dein KI-Copilot und kreativer Partner in **PapayaOS**.

Egal ob wir geniale neue Features aushecken, Workflows automatisieren oder du Unterstützung bei Code und Design brauchst: Ich stehe bereit. Woran arbeiten wir heute?`;
  }

  // 11. Dynamic context-sensitive answer for any other input
  const subjectSnippet = cleanPrompt.length > 80 ? cleanPrompt.slice(0, 77) + "..." : cleanPrompt;
  const hintAboutKey = !hasKey
    ? "\n\n> 💡 **Tipp für deinen Render-Server:** Hinterlege in deinem Render-Dashboard unter *Environment* die Variable `GEMINI_API_KEY`, um den unbegrenzten Live-Stream mit dem echten Gemini-Modell zu aktivieren!"
    : "";

  return `<thought>
Kontextuelle Analyse abgeschlossen für Eingabe: "${subjectSnippet}". Dynamische Antwort-Generierung aktiv.
</thought>
Zu deinem Punkt: **„${cleanPrompt}“**

Hier sind meine direkten Gedanken dazu:

1. 🎯 **Konkrete Umsetzung:** Wir können das direkt in PapayaOS integrieren oder in einem passenden Workflow abbilden.
2. ⚡ **Nächster Schritt:** Möchtest du, dass ich dir ein passendes Konzept, ein Code-Snippet oder eine Schritt-für-Schritt-Anleitung dazu erstelle?
3. 💬 **Feinschliff:** Gib mir einfach noch 1-2 Details mit, damit ich das Ergebnis genau nach deinen Wünschen ausrichten kann!${hintAboutKey}`;
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PapayaOS Server running with Gemini API on http://0.0.0.0:${PORT}`);
  });
}

startServer();
