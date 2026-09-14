import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, ArrowRight, MessageSquare, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { playPapayaSendSound, playPapayaReceiveSound } from '../utils/papayaSound';

interface ClosedBetaPageProps {
  onSwitchToChat: () => void;
}

interface WaitlistEntry {
  email: string;
  ticket: string;
  registered_at: string;
  status?: string;
  system_node?: string;
}

const TOTAL_SPOTS = 500;
const ADMIN_EMAIL = 'philippsteidle5@gmail.com';

export const ClosedBetaPage: React.FC<ClosedBetaPageProps> = ({ onSwitchToChat }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Waitlist form states
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [ticketCode, setTicketCode] = useState<string | null>(null);
  const [spotsLeft, setSpotsLeft] = useState(TOTAL_SPOTS);

  // Admin states
  const [showAdminWrap, setShowAdminWrap] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminGateError, setAdminGateError] = useState<string | null>(null);
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);

  // 1. Three.js Particle Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const particleCount = 700;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xff6b53,
      size: 0.03,
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.5;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.5;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      particles.rotation.y += 0.0006;
      particles.rotation.x += 0.0002;
      camera.position.x += (mouseX - camera.position.x) * 0.02;
      camera.position.y += (-mouseY - camera.position.y) * 0.02;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  // 2. Fetch Waitlist spots & entries
  const fetchWaitlist = async () => {
    try {
      const res = await fetch('/api/waitlist');
      const data = await res.json();
      if (data && Array.isArray(data.waitlist)) {
        setWaitlistEntries(data.waitlist);
        setSpotsLeft(Math.max(TOTAL_SPOTS - data.waitlist.length, 0));
      }
    } catch (err) {
      console.warn('Could not fetch waitlist:', err);
    }
  };

  useEffect(() => {
    fetchWaitlist();
  }, []);

  // 3. Generate ticket hash
  const generateTicket = async (mail: string) => {
    try {
      const enc = new TextEncoder().encode(mail + Date.now());
      const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return 'PAPAYA-BETA-' + hex.slice(0, 8).toUpperCase();
    } catch {
      return 'PAPAYA-BETA-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    }
  };

  // 4. Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setFormError('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }

    setIsSubmitting(true);
    playPapayaSendSound();

    try {
      const ticket = await generateTicket(trimmed);
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, ticket }),
      });
      const data = await res.json();

      if (data && data.record) {
        setTicketCode(data.record.ticket);
        playPapayaReceiveSound();
        fetchWaitlist();
      } else {
        throw new Error(data.error || 'Fehler bei der Registrierung');
      }
    } catch (err: any) {
      setFormError(err?.message || 'Da ist etwas schiefgelaufen. Bitte versuch es noch einmal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Admin Gate Submission
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminGateError(null);
    if (adminEmail.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      setIsAdmin(true);
      fetchWaitlist();
    } else {
      setAdminGateError('Diese E-Mail-Adresse hat keinen Admin-Zugriff.');
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-[#FF6B53] selection:text-black overflow-x-hidden flex flex-col">
      {/* Three.js Particle Canvas Background */}
      <canvas
        ref={canvasRef}
        id="particle-canvas"
        className="fixed inset-0 z-0 pointer-events-none"
      />

      {/* Foreground Content Container */}
      <div className="relative z-10 min-h-screen flex flex-col w-full">
        {/* Header */}
        <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF6B53] to-[#FFC107] flex items-center justify-center font-black text-black text-xl shadow-lg shadow-orange-500/20">
              p
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Papaya<span className="text-[#FF6B53]">OS</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400 bg-white/5 px-3.5 py-1.5 rounded-full border border-white/10 hidden sm:inline-block">
              v0.1 — Pre-Launch
            </span>

            <button
              onClick={onSwitchToChat}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 border border-white/15 transition-all cursor-pointer backdrop-blur-md shadow-sm"
            >
              <MessageSquare size={14} className="text-[#FF6B53]" />
              <span>Zum OS Chat</span>
              <ArrowRight size={13} className="text-neutral-400" />
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-5 duration-700">
            <span className="text-[#FF6B53] uppercase tracking-[0.2em] text-xs font-bold block mb-2">
              Beta Zugang
            </span>

            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[1.05] my-4">
              Dein neues digitales <br />
              <span className="bg-gradient-to-r from-[#FF6B53] to-[#FFC107] bg-clip-text text-transparent">
                Zuhause
              </span>
            </h1>

            <p className="text-neutral-400 text-base sm:text-lg mb-8 leading-relaxed max-w-lg mx-auto">
              PapayaOS ist fast bereit. Sei einer der Ersten, die den frischen Flow erleben. Nur noch{' '}
              <span className="text-[#FFC107] font-bold">{spotsLeft}</span> Plätze für die erste Welle.
            </p>

            {/* Waitlist Form Wrap */}
            {!ticketCode ? (
              <div className="flex flex-col items-center">
                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-md"
                >
                  <input
                    type="email"
                    placeholder="Deine E-Mail-Adresse"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 bg-white/5 border border-white/10 px-5 py-3.5 rounded-full text-white text-sm outline-none focus:border-[#FF6B53] transition-colors placeholder:text-neutral-500"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-[#FF6B53] text-black font-bold px-7 py-3.5 rounded-full text-sm cursor-pointer hover:scale-105 active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed shrink-0 shadow-lg shadow-orange-500/20"
                  >
                    {isSubmitting ? 'Wird registriert...' : 'Anmelden'}
                  </button>
                </form>

                {formError && (
                  <p className="text-[#FF6B53] text-xs mt-3 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg">
                    {formError}
                  </p>
                )}
              </div>
            ) : (
              /* Confirmation Box */
              <div className="text-left bg-white/[0.03] border border-[#FFC107]/20 rounded-2xl p-6 max-w-md mx-auto shadow-2xl backdrop-blur-md animate-in zoom-in-95 duration-300">
                <p className="text-xs uppercase tracking-wider text-[#FFC107] font-bold mb-1">
                  Willkommen in der Zukunft, Pionier 🍍
                </p>
                <p className="text-neutral-300 text-xs mb-4">
                  Wir haben deinen Platz in der Warteschlange gesichert.
                </p>

                <div className="bg-black/50 border border-white/10 rounded-xl p-3.5 mb-4">
                  <p className="text-[11px] text-neutral-400 mb-1">Dein Beta-Ticket</p>
                  <p className="text-base font-mono font-bold text-white tracking-wider">
                    {ticketCode}
                  </p>
                </div>

                <p className="text-neutral-400 text-xs leading-relaxed">
                  Fruchtige Grüße,<br />
                  <span className="text-white font-medium">Das PapayaOS Core-Team</span>
                </p>

                <button
                  onClick={onSwitchToChat}
                  className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B53] to-[#FFC107] text-black font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md hover:opacity-95 transition-opacity"
                >
                  <span>Direkt PapayaOS Chat starten</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 pb-20">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:border-[#FFC107]/30 transition-colors">
              <div className="text-2xl text-[#FFC107] mb-3">⚡</div>
              <h3 className="text-base font-bold text-white mb-2">Cortex-Speed</h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Ultra-schnelle, lokale NPU-Berechnungen. Zero Latency, 100% offline-fähig.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:border-[#FF6B53]/30 transition-colors">
              <div className="text-2xl text-[#FF6B53] mb-3">🌐</div>
              <h3 className="text-base font-bold text-white mb-2">Unified Google Flow</h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Gmail, Maps und Kalender verschmelzen zu einem intelligenten Strom.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:border-[#028090]/50 transition-colors">
              <div className="text-2xl text-[#028090] mb-3">🌴</div>
              <h3 className="text-base font-bold text-white mb-2">Tropic Modernism</h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Ein Interface, das atmet. Lebendig, augenschonend und unfassbar elegant.
              </p>
            </div>
          </div>
        </section>

        {/* Admin Dashboard Section */}
        <div className="max-w-md mx-auto px-6 mb-20 text-left w-full">
          <button
            onClick={() => setShowAdminWrap(!showAdminWrap)}
            className="text-xs text-neutral-400 hover:text-neutral-200 underline underline-offset-2 cursor-pointer transition-colors"
          >
            {showAdminWrap ? 'Admin-Panel schließen' : 'Admin-Panel anzeigen'}
          </button>

          {showAdminWrap && (
            <div className="mt-3">
              {!isAdmin ? (
                /* Admin Gate */
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 backdrop-blur-md">
                  <p className="text-xs uppercase tracking-wider text-neutral-400 mb-3 font-semibold">
                    Admin-Zugang
                  </p>
                  <form onSubmit={handleAdminLogin} className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Admin-E-Mail-Adresse"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      required
                      className="flex-1 bg-white/5 border border-white/10 px-3 py-2 rounded-lg text-white text-xs outline-none focus:border-[#FF6B53]"
                    />
                    <button
                      type="submit"
                      className="bg-[#FF6B53] text-black font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Anmelden
                    </button>
                  </form>

                  {adminGateError && (
                    <p className="text-[#FF6B53] text-xs mt-2">{adminGateError}</p>
                  )}
                  <p className="text-neutral-400 text-[11px] mt-2 leading-relaxed">
                    Nur für autorisierte Administratoren ({ADMIN_EMAIL}).
                  </p>
                </div>
              ) : (
                /* Admin Table */
                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                      Warteliste
                    </p>
                    <span className="text-xs font-mono text-emerald-400">
                      Cortex Node 1
                    </span>
                  </div>

                  <div className="text-2xl font-black text-white mb-3">
                    {waitlistEntries.length}{' '}
                    <span className="text-xs font-normal text-neutral-400">Anmeldungen</span>
                  </div>

                  {waitlistEntries.length === 0 ? (
                    <p className="text-neutral-400 text-xs">Noch keine Anmeldungen.</p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/10 text-[10px] text-neutral-400 uppercase tracking-wider">
                            <th className="pb-2">E-Mail</th>
                            <th className="pb-2">Datum</th>
                            <th className="pb-2">Ticket</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-neutral-300 font-mono text-[11px]">
                          {waitlistEntries.map((entry, idx) => (
                            <tr key={idx} className="hover:bg-white/5">
                              <td className="py-2 pr-2 truncate max-w-[140px] font-sans text-white">
                                {entry.email}
                              </td>
                              <td className="py-2 pr-2 text-neutral-400 whitespace-nowrap">
                                {formatDate(entry.registered_at)}
                              </td>
                              <td className="py-2 text-[#FFC107] whitespace-nowrap">
                                {entry.ticket}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <button
                    onClick={() => setIsAdmin(false)}
                    className="mt-3 text-[11px] text-neutral-400 hover:text-white underline cursor-pointer"
                  >
                    Abmelden
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto w-full px-6 py-8 border-t border-white/5 text-center sm:flex sm:justify-between sm:items-center text-xs text-neutral-400">
          <p>© 2024 PapayaOS. Entwickelt von Visionären für Macher.</p>
          <p className="mt-2 sm:mt-0">Inspired by speed & passion.</p>
        </footer>
      </div>
    </div>
  );
};
