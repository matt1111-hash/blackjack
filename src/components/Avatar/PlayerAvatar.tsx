interface PlayerAvatarProps {
  mood?: 'neutral' | 'happy' | 'excited' | 'thinking' | 'sad';
  size?: number;
}

export function PlayerAvatar({ mood = 'neutral', size = 80 }: PlayerAvatarProps) {
  const getMoodColor = () => {
    switch (mood) {
      case 'happy': return '#22c55e';
      case 'excited': return '#fbbf24';
      case 'thinking': return '#60a5fa';
      case 'sad': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const borderColor = getMoodColor();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="player-avatar"
      style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="#1e293b" stroke={borderColor} strokeWidth="3" />

      {/* Body/shirt */}
      <path
        d="M25 95 L25 68 Q50 55 75 68 L75 95"
        fill="#1e40af"
        stroke={borderColor}
        strokeWidth="1"
      />

      {/* Shirt collar */}
      <path d="M42 60 L50 65 L58 60" stroke="white" strokeWidth="2" fill="none" />
      <path d="M42 60 L50 55 L50 65" fill="white" opacity="0.8" />
      <path d="M58 60 L50 55 L50 65" fill="white" opacity="0.6" />

      {/* Face */}
      <ellipse cx="50" cy="42" rx="20" ry="22" fill="#fcd3b6" />

      {/* Hair */}
      <path
        d="M30 35 Q28 15 50 12 Q72 15 70 35 L70 28 Q70 10 50 8 Q30 10 30 28 Z"
        fill="#4a3728"
      />

      {/* Hair detail */}
      <path d="M35 25 Q40 20 50 18 Q60 20 65 25" stroke="#3a2718" strokeWidth="2" fill="none" />

      {/* Eyes */}
      <ellipse cx="42" cy="40" rx="4" ry="5" fill="white" stroke="#1a1a1a" strokeWidth="0.5" />
      <ellipse cx="58" cy="40" rx="4" ry="5" fill="white" stroke="#1a1a1a" strokeWidth="0.5" />

      {/* Pupils - move based on mood */}
      <circle cx={mood === 'thinking' ? 40 : 42} cy={40} r="2.5" fill="#1a1a1a" />
      <circle cx={mood === 'thinking' ? 56 : 58} cy={40} r="2.5" fill="#1a1a1a" />

      {/* Eye shine */}
      <circle cx={mood === 'thinking' ? 39 : 41} cy={38.5} r="1" fill="white" />
      <circle cx={mood === 'thinking' ? 55 : 57} cy={38.5} r="1" fill="white" />

      {/* Eyebrows - change with mood */}
      {mood === 'thinking' ? (
        <>
          <path d="M36 31 L46 34" stroke="#4a3728" strokeWidth="2" strokeLinecap="round" />
          <path d="M54 34 L64 31" stroke="#4a3728" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : mood === 'sad' ? (
        <>
          <path d="M36 34 L46 31" stroke="#4a3728" strokeWidth="2" strokeLinecap="round" />
          <path d="M54 31 L64 34" stroke="#4a3728" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M36 32 L46 33" stroke="#4a3728" strokeWidth="2" strokeLinecap="round" />
          <path d="M54 33 L64 32" stroke="#4a3728" strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {/* Nose */}
      <path d="M50 42 L48 48 L52 48" stroke="#d4a574" strokeWidth="1" fill="none" />

      {/* Mouth based on mood */}
      {mood === 'happy' && (
        <path
          d="M40 52 Q50 60 60 52"
          stroke="#1a1a1a"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {mood === 'excited' && (
        <>
          <ellipse cx="50" cy="53" rx="8" ry="5" fill="#1a1a1a" />
          <rect x="44" y="50" width="12" height="6" fill="white" rx="2" />
        </>
      )}
      {mood === 'thinking' && (
        <path
          d="M42 54 Q50 50 58 54"
          stroke="#1a1a1a"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {mood === 'sad' && (
        <path
          d="M42 56 Q50 52 58 56"
          stroke="#1a1a1a"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {mood === 'neutral' && (
        <line x1="45" y1="54" x2="55" y2="54" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
      )}

      {/* Cheeks for happy/excited */}
      {(mood === 'happy' || mood === 'excited') && (
        <>
          <ellipse cx="35" cy="48" rx="4" ry="3" fill="#fca5a5" opacity="0.5" />
          <ellipse cx="65" cy="48" rx="4" ry="3" fill="#fca5a5" opacity="0.5" />
        </>
      )}

      {/* Sweat drop for thinking */}
      {mood === 'thinking' && (
        <path
          d="M72 30 Q75 35 72 40 Q69 35 72 30"
          fill="#60a5fa"
        />
      )}

      {/* Tear for sad */}
      {mood === 'sad' && (
        <path
          d="M68 35 Q70 40 68 45 Q66 40 68 35"
          fill="#60a5fa"
        />
      )}
    </svg>
  );
}
