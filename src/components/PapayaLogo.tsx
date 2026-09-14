import React from 'react';

interface PapayaLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  tagline?: boolean;
  variant?: 'color' | 'monochrome';
}

export const PapayaLogo: React.FC<PapayaLogoProps> = ({
  className = '',
  size = 32,
  showText = false,
  tagline = false,
  variant = 'color',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm transition-transform duration-300 hover:scale-105"
      >
        <defs>
          {/* Outer skin gradient (warm papaya skin transitioning to green edge) */}
          <linearGradient id="papayaRind" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#40916C" />
            <stop offset="35%" stopColor="#52B788" />
            <stop offset="70%" stopColor="#F77F00" />
            <stop offset="100%" stopColor="#E85D04" />
          </linearGradient>

          {/* Luscious papaya flesh gradient */}
          <linearGradient id="papayaFlesh" x1="20%" y1="10%" x2="85%" y2="95%">
            <stop offset="0%" stopColor="#FFBA08" />
            <stop offset="30%" stopColor="#FAA307" />
            <stop offset="65%" stopColor="#F46036" />
            <stop offset="100%" stopColor="#D83121" />
          </linearGradient>

          {/* Inner seed cavity */}
          <linearGradient id="papayaCavity" x1="50%" y1="20%" x2="50%" y2="85%">
            <stop offset="0%" stopColor="#2D1108" />
            <stop offset="100%" stopColor="#190904" />
          </linearGradient>

          {/* Seed sheen */}
          <linearGradient id="seedHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A4E69" />
            <stop offset="100%" stopColor="#141419" />
          </linearGradient>

          {/* Soft inner glow */}
          <radialGradient id="fleshGlow" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFE066" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFE066" stopOpacity="0" />
          </radialGradient>
        </defs>

        {variant === 'color' ? (
          <>
            {/* Outer Rind rim */}
            <path
              d="M50 5 C68 18 88 42 86 70 C84 88 70 96 50 96 C30 96 16 88 14 70 C12 42 32 18 50 5 Z"
              fill="url(#papayaRind)"
            />

            {/* Inner Papaya Flesh */}
            <path
              d="M50 11 C65 22 81 44 79 68 C78 83 66 90 50 90 C34 90 22 83 21 68 C19 44 35 22 50 11 Z"
              fill="url(#papayaFlesh)"
            />

            {/* Flesh depth glow */}
            <path
              d="M50 11 C65 22 81 44 79 68 C78 83 66 90 50 90 C34 90 22 83 21 68 C19 44 35 22 50 11 Z"
              fill="url(#fleshGlow)"
            />

            {/* Center seed cavity */}
            <path
              d="M50 28 C57 36 62 48 61 63 C60 74 54 79 50 79 C46 79 40 74 39 63 C38 48 43 36 50 28 Z"
              fill="url(#papayaCavity)"
            />

            {/* Papaya seeds cluster (crisp, glossy black spheres) */}
            <circle cx="50" cy="40" r="3.2" fill="#1C1C24" stroke="#495057" strokeWidth="0.6" />
            <circle cx="46" cy="46" r="3.4" fill="#141419" stroke="#343A40" strokeWidth="0.6" />
            <circle cx="54" cy="47" r="3.1" fill="#141419" stroke="#343A40" strokeWidth="0.6" />
            <circle cx="49" cy="53" r="3.5" fill="#212529" stroke="#495057" strokeWidth="0.6" />
            <circle cx="44" cy="58" r="3.0" fill="#141419" stroke="#343A40" strokeWidth="0.6" />
            <circle cx="55" cy="57" r="3.3" fill="#1C1C24" stroke="#495057" strokeWidth="0.6" />
            <circle cx="50" cy="64" r="3.4" fill="#141419" stroke="#343A40" strokeWidth="0.6" />
            <circle cx="46" cy="70" r="2.8" fill="#212529" stroke="#495057" strokeWidth="0.6" />
            <circle cx="53" cy="71" r="2.7" fill="#1C1C24" stroke="#343A40" strokeWidth="0.6" />

            {/* Seed glints */}
            <circle cx="49" cy="39" r="0.9" fill="#F8F9FA" />
            <circle cx="45" cy="45" r="1.0" fill="#F8F9FA" />
            <circle cx="53" cy="46" r="0.9" fill="#F8F9FA" />
            <circle cx="48" cy="52" r="1.1" fill="#F8F9FA" />
            <circle cx="54" cy="56" r="1.0" fill="#F8F9FA" />
            <circle cx="49" cy="63" r="1.0" fill="#F8F9FA" />

            {/* Top stem accent */}
            <path
              d="M48 3 C49 0 51 0 52 3 C52 5 50 6 48 5 Z"
              fill="#2D6A4F"
            />
          </>
        ) : (
          <path
            d="M50 8 C66 20 84 43 82 70 C80 87 67 94 50 94 C33 94 20 87 18 70 C16 43 34 20 50 8 Z"
            fill="currentColor"
          />
        )}
      </svg>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1">
            <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 font-sans">
              Papaya<span className="text-orange-500 font-extrabold">OS</span>
            </span>
            <span className="text-[9px] font-semibold text-orange-500 uppercase tracking-wider ml-0.5">
              AI
            </span>
          </div>
          {tagline && (
            <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 tracking-widest uppercase">
              A Fresher Way To Do More
            </span>
          )}
        </div>
      )}
    </div>
  );
};
