interface DealerAvatarProps {
  mood?: 'neutral' | 'happy' | 'serious';
  size?: number;
}

export function DealerAvatar({ mood = 'neutral', size = 80 }: DealerAvatarProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="dealer-avatar"
      style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="#1e293b" stroke="#f59e0b" strokeWidth="3" />

      {/* Dealer body/tuxedo */}
      <path
        d="M25 95 L25 70 Q50 60 75 70 L75 95"
        fill="#0f172a"
        stroke="#f59e0b"
        strokeWidth="1"
      />

      {/* Bow tie */}
      <path
        d="M42 58 L50 62 L58 58 M50 62 L50 68"
        stroke="#f59e0b"
        strokeWidth="2"
        fill="none"
      />

      {/* Face */}
      <ellipse cx="50" cy="45" rx="18" ry="20" fill="#fcd3b6" />

      {/* Hair */}
      <path
        d="M32 35 Q32 20 50 18 Q68 20 68 35 L68 30 Q68 15 50 12 Q32 15 32 30 Z"
        fill="#1a1a1a"
      />

      {/* Dealer vest */}
      <path
        d="M35 65 L40 58 L60 58 L65 65 L65 95 L35 95 Z"
        fill="#0f172a"
        stroke="#f59e0b"
        strokeWidth="1"
      />

      {/* Vest pattern */}
      <line x1="45" y1="58" x2="45" y2="95" stroke="#f59e0b" strokeWidth="0.5" opacity="0.5" />
      <line x1="50" y1="58" x2="50" y2="95" stroke="#f59e0b" strokeWidth="0.5" opacity="0.5" />
      <line x1="55" y1="58" x2="55" y2="95" stroke="#f59e0b" strokeWidth="0.5" opacity="0.5" />

      {/* Eyes */}
      <ellipse cx="43" cy="42" rx="3" ry="4" fill="#1a1a1a" />
      <ellipse cx="57" cy="42" rx="3" ry="4" fill="#1a1a1a" />
      <circle cx="44" cy="41" r="1" fill="white" />
      <circle cx="58" cy="41" r="1" fill="white" />

      {/* Eyebrows */}
      <path
        d="M38 35 L48 36"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M52 36 L62 35"
        stroke="#1a1a1a"
        strokeWidth="1.5"
        fill="none"
      />

      {/* Mouth based on mood */}
      {mood === 'happy' && (
        <path
          d="M43 52 Q50 58 57 52"
          stroke="#1a1a1a"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {mood === 'serious' && (
        <line x1="44" y1="53" x2="56" y2="53" stroke="#1a1a1a" strokeWidth="2" />
      )}
      {mood === 'neutral' && (
        <path
          d="M44 54 Q50 52 56 54"
          stroke="#1a1a1a"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      )}

      {/* Cufflinks on jacket */}
      <circle cx="38" cy="75" r="2" fill="#f59e0b" />
      <circle cx="62" cy="75" r="2" fill="#f59e0b" />
    </svg>
  );
}
