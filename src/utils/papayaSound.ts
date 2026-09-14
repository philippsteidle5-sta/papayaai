// PapayaOS Audio Engine - Web Audio API (Native, lightweight, no assets needed)

let audioCtx: AudioContext | null = null;
let ambientOscillator: OscillatorNode | null = null;
let ambientGain: GainNode | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Gentle papaya waterdrop / UI pop sound on message send
 */
export function playPapayaSendSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  } catch (e) {
    // Ignore audio restrictions
  }
}

/**
 * Papaya receive / intelligence notification chime
 */
export function playPapayaReceiveSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Harmonic double chime (warm major third)
    [659.25, 830.61].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.08, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.4);
    });
  } catch (e) {
    // Ignore audio restrictions
  }
}

/**
 * Particle Papaya Blossom / Opening Chime
 * Ethereal tropical chord (F# Maj9) radiating upward as the particle ball blooms into a papaya
 */
export function playVoiceOpenChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    // Tropical arpeggio chord: F#4, A#4, C#5, F5
    const notes = [369.99, 466.16, 554.37, 698.46, 880.0];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 0.9, now + i * 0.08);
      osc.frequency.exponentialRampToValueAtTime(freq, now + i * 0.08 + 0.15);

      const vol = 0.07 / (i * 0.3 + 1);
      gain.gain.setValueAtTime(vol, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.7);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.75);
    });
  } catch (e) {
    // Ignore audio restrictions
  }
}

/**
 * Particle Papaya Closing Chime
 */
export function playVoiceCloseChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.25);

    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {}
}

/**
 * Soft Tibetan / sunset singing bowl chime for Focus Mode trigger
 */
export function playFocusChime() {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const freqs = [432, 864, 1296];

    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      const initialVolume = 0.15 / (i + 1);
      gain.gain.setValueAtTime(initialVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 1.8);
    });
  } catch (e) {
    // Ignore audio restrictions
  }
}

/**
 * Ambient binaural / sunset warm drone for focus
 */
export function toggleAmbientFocusSound(enable: boolean): boolean {
  const ctx = getAudioContext();
  if (!ctx) return false;

  if (!enable) {
    if (ambientOscillator && ambientGain) {
      try {
        ambientGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        setTimeout(() => {
          ambientOscillator?.stop();
          ambientOscillator?.disconnect();
          ambientOscillator = null;
          ambientGain = null;
        }, 500);
      } catch (e) {}
    }
    return false;
  }

  try {
    const now = ctx.currentTime;
    ambientOscillator = ctx.createOscillator();
    ambientGain = ctx.createGain();

    // Warm deep 136.1 Hz (Om/Sunset frequency)
    ambientOscillator.type = 'triangle';
    ambientOscillator.frequency.setValueAtTime(136.1, now);

    ambientGain.gain.setValueAtTime(0.0001, now);
    ambientGain.gain.linearRampToValueAtTime(0.04, now + 1.5);

    ambientOscillator.connect(ambientGain);
    ambientGain.connect(ctx.destination);

    ambientOscillator.start(now);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Speech Synthesis Helper (Native TTS in German)
 */
export function speakPapayaSpeech(
  text: string,
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): SpeechSynthesisUtterance | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  window.speechSynthesis.cancel(); // cancel any ongoing speech

  // Strip markdown formatting symbols for natural voice output
  const cleanText = text
    .replace(/\*\*|__/g, '')
    .replace(/#{1,6}\s+/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, 'Code block')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_~>]/g, '')
    .trim();

  if (!cleanText) return null;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'de-DE';
  utterance.rate = 1.05;
  utterance.pitch = 1.02;

  // Try to pick a natural sounding German voice
  const voices = window.speechSynthesis.getVoices();
  const germanVoice = voices.find(
    (v) => v.lang.startsWith('de') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Anna'))
  ) || voices.find((v) => v.lang.startsWith('de'));

  if (germanVoice) {
    utterance.voice = germanVoice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;

  window.speechSynthesis.speak(utterance);
  return utterance;
}

export function stopPapayaSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
