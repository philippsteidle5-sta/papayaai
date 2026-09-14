export type MessageRole = 'user' | 'model' | 'system';

export type PersonaType = 'assistant' | 'focus' | 'creative' | 'automator' | 'wellness';

export interface ActionItem {
  id: string;
  label: string;
  command?: string;
  icon?: string;
  type: 'system' | 'clipboard' | 'timer' | 'theme';
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string;
  mimeType?: string;
  size?: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  attachments?: ChatAttachment[];
  source?: 'gemini' | 'local';
  actions?: ActionItem[];
  thought?: string;
  reasoningScore?: string;
  metadata?: {
    tokens?: number;
    rawTokens?: number;
    tokenMultiplier?: number;
    latencyMs?: number;
    commandExecuted?: string;
    model?: string;
    thought?: string;
    reasoningScore?: string;
  };
}

export interface ChatThread {
  id: string;
  title: string;
  persona: PersonaType;
  messages: ChatMessage[];
  updatedAt: string;
  isPinned?: boolean;
  tag?: string;
}

export interface SystemStatus {
  osName: string;
  version: string;
  build: string;
  kernel: string;
  uptime: string;
  cpuUsage: number;
  ramUsageGb: string;
  ramTotalGb: number;
  neuralEngineStatus: string;
  activeProfile: string;
}

export type OSTheme = 'sunset' | 'obsidian' | 'citrus';

export type StrengthLevel = 1 | 2 | 3 | 4;

export interface ModelStrengthConfig {
  level: StrengthLevel;
  modelId: string;
  strengthName: 'Schwach' | 'Mittel' | 'Stark' | 'Max';
  modelDisplay: string;
  tagline: string;
  description: string;
  color: string;
  barClass: string;
  pillBg: string;
  pillBorder: string;
  textColor: string;
  tokenMultiplier: number;
  tokenConsumptionLabel: string;
  tokenLossWarning: string;
}

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface TokenUsage {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

export interface DailyTokenStats {
  usedTokensToday: number;
  dailyLimit: number;
  remainingTokens: number;
  usagePercentage: number;
  requestCount: number;
  date: string;
  nextResetIso: string;
  secondsUntilReset: number;
  lastRequestTokens?: TokenUsage;
}

export interface CustomPlugin {
  id: string;
  name: string;
  commandTrigger: string; // e.g. "/audit", "/flow", "/translate"
  description: string;
  systemInstruction?: string;
  category: 'System' | 'AI' | 'Creative' | 'Productivity' | 'Custom';
  icon: string;
  active: boolean;
  createdAt: string;
}
