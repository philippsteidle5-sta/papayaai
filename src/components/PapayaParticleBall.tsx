/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { VoiceState } from '../types';

interface PapayaParticleBallProps {
  voiceState: VoiceState;
  isOpenAsPapaya: boolean;
  onToggleOpen?: () => void;
  audioEnergy?: number; // 0 to 1
  className?: string;
  size?: number;
}

interface Particle {
  id: number;
  type: 'rind' | 'flesh' | 'seed' | 'spark';
  // Target 1: Closed Sphere
  sx: number;
  sy: number;
  sz: number;
  // Target 2: Open Papaya Cross-Section
  px: number;
  py: number;
  pz: number;
  // Current position
  x: number;
  y: number;
  z: number;
  // Visual properties
  size: number;
  color: string;
  glowColor: string;
  alpha: number;
  phase: number;
  speed: number;
}

export const PapayaParticleBall: React.FC<PapayaParticleBallProps> = ({
  voiceState,
  isOpenAsPapaya,
  onToggleOpen,
  audioEnergy = 0,
  className = '',
  size = 400,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);

  // Refs for values updated frequently to prevent useEffect re-triggering and flickering
  const voiceStateRef = useRef<VoiceState>(voiceState);
  const isOpenRef = useRef<boolean>(isOpenAsPapaya);
  const audioEnergyRef = useRef<number>(audioEnergy);
  const morphProgressRef = useRef<number>(isOpenAsPapaya ? 1 : 0);

  // Sync refs when props change (NO re-mounting of animation loop!)
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  useEffect(() => {
    isOpenRef.current = isOpenAsPapaya;
  }, [isOpenAsPapaya]);

  useEffect(() => {
    // Smooth lerp audio energy
    audioEnergyRef.current = audioEnergy;
  }, [audioEnergy]);

  // Orbit rotation controls
  const rotationRef = useRef<{ x: number; y: number; vx: number; vy: number }>({
    x: 0.12,
    y: 0,
    vx: 0,
    vy: 0.006,
  });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  // Generate structured, clean particle geometry
  useEffect(() => {
    const COUNT = 680;
    const particles: Particle[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden ratio angle

    for (let i = 0; i < COUNT; i++) {
      // 1. SPHERE GEOMETRY (Uniform Fibonacci Sphere)
      const yNorm = 1 - (i / (COUNT - 1)) * 2; // -1 to +1
      const radiusAtY = Math.sqrt(Math.max(0, 1 - yNorm * yNorm));
      const theta = phi * i;
      const sphereR = 110;

      const sx = Math.cos(theta) * radiusAtY * sphereR;
      const sy = yNorm * sphereR;
      const sz = Math.sin(theta) * radiusAtY * sphereR;

      // 2. PARTICLE TYPE RATIOS:
      // ~22% seeds, ~24% emerald rind, ~48% sunset papaya flesh, ~6% ambient sparks
      let type: 'rind' | 'flesh' | 'seed' | 'spark';
      const r = i / COUNT;
      if (r < 0.22) {
        type = 'seed';
      } else if (r < 0.46) {
        type = 'rind';
      } else if (r < 0.94) {
        type = 'flesh';
      } else {
        type = 'spark';
      }

      // 3. OPEN PAPAYA SCULPTURE
      // Elongated tropical pear shape split open along sagittal plane (x=0)
      // py ranges from -110 (stem) to +85 (base)
      const pyNorm = (i / COUNT);
      const py = -105 + pyNorm * 190;
      // Papaya contour taper: narrower neck at top, full rounded belly at bottom
      const taper = 0.48 + 0.62 * Math.sin(Math.min(Math.PI, Math.max(0, (py + 105) / 190 * Math.PI * 0.95)));

      let px = 0;
      let pz = 0;
      let finalPy = py;

      // Half assignment (left / right half)
      const isRight = (i % 2 === 0);
      const side = isRight ? 1 : -1;
      const splitAngle = 0.38; // ~22 degrees opening tilt

      if (type === 'seed') {
        // Caviar seeds clustered in the central hollow trench: -45 < py < 45
        finalPy = -40 + Math.random() * 80;
        const seedR = Math.random() * 24;
        const sTheta = Math.random() * Math.PI * 2;
        px = Math.cos(sTheta) * seedR * 0.75;
        pz = Math.sin(sTheta) * seedR * 0.75;
      } else if (type === 'rind') {
        // Outer green skin contouring the outer perimeter of the fruit
        const rindAngle = 0.3 + (Math.random() * Math.PI * 0.9);
        const rindR = 92 * taper + (Math.random() * 8);

        const localX = Math.cos(rindAngle) * rindR;
        const localZ = Math.sin(rindAngle) * rindR;

        px = (localX * Math.cos(splitAngle) - localZ * Math.sin(splitAngle)) * side + (side * 30);
        pz = localX * Math.sin(splitAngle) + localZ * Math.cos(splitAngle);
      } else if (type === 'flesh') {
        // Thick, luscious gradient flesh between rind and seed cavity
        const fleshAngle = 0.25 + (Math.random() * Math.PI * 1.05);
        const fleshR = (28 + Math.random() * 54) * taper;

        const localX = Math.cos(fleshAngle) * fleshR;
        const localZ = Math.sin(fleshAngle) * fleshR;

        px = (localX * Math.cos(splitAngle) - localZ * Math.sin(splitAngle)) * side + (side * 28);
        pz = localX * Math.sin(splitAngle) + localZ * Math.cos(splitAngle);
      } else {
        // Ambient stardust embers
        const sparkR = 120 + Math.random() * 35;
        const sparkTheta = Math.random() * Math.PI * 2;
        px = Math.cos(sparkTheta) * sparkR;
        pz = Math.sin(sparkTheta) * sparkR;
        finalPy = -70 + Math.random() * 140;
      }

      // 4. PALETTE & SIZES (High-contrast, clean Apple/OLED grade)
      let color = '#FB8500';
      let glowColor = 'rgba(251, 133, 0, 0.4)';
      let pSize = 2.4;

      if (type === 'rind') {
        const greens = ['#104F36', '#1B7A4E', '#2D9A63', '#40C075'];
        color = greens[i % greens.length];
        glowColor = 'rgba(45, 154, 99, 0.4)';
        pSize = 2.4 + (i % 3) * 0.4;
      } else if (type === 'flesh') {
        const corals = ['#F77F00', '#FB8500', '#FC9816', '#E76F51', '#D62828'];
        color = corals[i % corals.length];
        glowColor = 'rgba(251, 133, 0, 0.55)';
        pSize = 2.6 + (i % 4) * 0.5;
      } else if (type === 'seed') {
        const darks = ['#0C0C12', '#14141E', '#1D1D2C'];
        color = darks[i % darks.length];
        glowColor = 'rgba(255, 183, 3, 0.35)';
        pSize = 3.2 + (i % 3) * 0.6;
      } else {
        color = '#FFE8D6';
        glowColor = 'rgba(255, 232, 214, 0.8)';
        pSize = 1.8 + Math.random() * 0.8;
      }

      particles.push({
        id: i,
        type,
        sx,
        sy,
        sz,
        px,
        py: finalPy,
        pz,
        x: sx,
        y: sy,
        z: sz,
        size: pSize,
        color,
        glowColor,
        alpha: 0.88,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + (i % 5) * 0.15,
      });
    }

    particlesRef.current = particles;
  }, []);

  // Continuous 60 FPS Canvas Rendering Engine (Flicker-Free, No Effect Restarts)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      timeRef.current += 0.016;
      const time = timeRef.current;
      const vState = voiceStateRef.current;
      const isOpen = isOpenRef.current;
      const energy = audioEnergyRef.current;

      // Smooth Morphing interpolation
      const targetMorph = isOpen ? 1 : 0;
      morphProgressRef.current += (targetMorph - morphProgressRef.current) * 0.06;
      const morph = morphProgressRef.current;

      // Smooth auto-rotation
      const rot = rotationRef.current;
      if (!isDraggingRef.current) {
        // Fast rotation when thinking, gentle tropical drift when idle/speaking
        const rotSpeed = vState === 'thinking' ? 0.028 : 0.005;
        rot.y += rotSpeed;
        rot.x = 0.12 + Math.sin(time * 0.5) * 0.05;
      }

      // Canvas dimensions with device pixel ratio
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth || size;
      const h = canvas.clientHeight || size;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      // Clean Ambient Radial Glow
      const bgGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, w * 0.46);
      if (vState === 'listening') {
        bgGrad.addColorStop(0, 'rgba(16, 185, 129, 0.18)');
        bgGrad.addColorStop(0.6, 'rgba(251, 133, 0, 0.06)');
        bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (vState === 'speaking') {
        bgGrad.addColorStop(0, 'rgba(251, 133, 0, 0.22)');
        bgGrad.addColorStop(0.6, 'rgba(247, 127, 0, 0.08)');
        bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else if (vState === 'thinking') {
        bgGrad.addColorStop(0, 'rgba(245, 158, 11, 0.20)');
        bgGrad.addColorStop(0.6, 'rgba(217, 119, 6, 0.07)');
        bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        bgGrad.addColorStop(0, 'rgba(251, 133, 0, 0.12)');
        bgGrad.addColorStop(0.5, 'rgba(16, 79, 54, 0.05)');
        bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Trigonometric cache for 3D rotation
      const cosY = Math.cos(rot.y);
      const sinY = Math.sin(rot.y);
      const cosX = Math.cos(rot.x);
      const sinX = Math.sin(rot.x);

      const focalLength = 340;
      const particles = particlesRef.current;
      const renderQueue: { p: Particle; rx: number; ry: number; rz: number; scale: number; alpha: number }[] = [];

      // Audio pulse wave
      const audioPulse = 1 + energy * 0.25;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Lerp between Sphere and Open Papaya
        const targetX = (p.sx * (1 - morph) + p.px * morph) * audioPulse;
        const targetY = (p.sy * (1 - morph) + p.py * morph) * audioPulse;
        const targetZ = (p.sz * (1 - morph) + p.pz * morph) * audioPulse;

        // 2. Harmonic organic float
        const wave = Math.sin(time * 1.6 * p.speed + p.phase);
        const floatOffset = (p.type === 'spark' ? 6 : 2) * wave;

        const curX = targetX;
        const curY = targetY + floatOffset;
        const curZ = targetZ;

        // 3. 3D Rotation (Euler Y then X)
        const x1 = curX * cosY - curZ * sinY;
        const z1 = curX * sinY + curZ * cosY;

        const y2 = curY * cosX - z1 * sinX;
        const z2 = curY * sinX + z1 * cosX;

        // 4. Perspective Projection
        const zDistance = focalLength + z2;
        if (zDistance <= 10) continue;

        const scale = focalLength / zDistance;
        const screenX = cx + x1 * scale;
        const screenY = cy + y2 * scale;

        // Alpha calculation based on depth and state
        let alpha = p.alpha * Math.min(1, Math.max(0.2, (z2 + 150) / 300));
        if (p.type === 'spark') {
          alpha *= 0.6 + 0.4 * Math.sin(time * 3 + p.phase);
        }

        renderQueue.push({
          p,
          rx: screenX,
          ry: screenY,
          rz: z2,
          scale,
          alpha,
        });
      }

      // Sort by depth (back to front painter's algorithm)
      renderQueue.sort((a, b) => a.rz - b.rz);

      // Render sorted particles cleanly
      for (let i = 0; i < renderQueue.length; i++) {
        const item = renderQueue[i];
        const p = item.p;
        const radius = Math.max(0.6, p.size * item.scale * (1 + (vState === 'speaking' ? energy * 0.2 : 0)));

        ctx.save();
        ctx.globalAlpha = item.alpha;
        ctx.beginPath();
        ctx.arc(item.rx, item.ry, radius, 0, Math.PI * 2);

        if (p.type === 'seed') {
          // Glossy Caviar Seeds with specular micro-highlight
          ctx.fillStyle = p.color;
          ctx.fill();

          // Specular seed highlight
          ctx.beginPath();
          ctx.arc(item.rx - radius * 0.35, item.ry - radius * 0.35, radius * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fill();
        } else if (p.type === 'spark') {
          // Luminous ember
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.glowColor;
          ctx.shadowBlur = 8 * item.scale;
          ctx.fill();
        } else {
          // Rind & Flesh
          ctx.fillStyle = p.color;
          if (p.type === 'flesh' && item.scale > 0.95) {
            ctx.shadowColor = p.glowColor;
            ctx.shadowBlur = 4 * item.scale;
          }
          ctx.fill();
        }

        ctx.restore();
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [size]); // ONLY size in dependency array! No re-running on audioEnergy or state!

  // Mouse / Touch Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    rotationRef.current.y += dx * 0.009;
    rotationRef.current.x = Math.max(-0.85, Math.min(0.85, rotationRef.current.x + dy * 0.009));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastMousePosRef.current.x;
    const dy = e.touches[0].clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    rotationRef.current.y += dx * 0.009;
    rotationRef.current.x = Math.max(-0.85, Math.min(0.85, rotationRef.current.x + dy * 0.009));
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      className={`relative flex items-center justify-center select-none cursor-grab active:cursor-grabbing ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block touch-none"
        style={{ width: size, height: size }}
      />
    </div>
  );
};
