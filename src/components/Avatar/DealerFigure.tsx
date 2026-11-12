import './DealerFigure.css';

interface DealerFigureProps {
  /** Az osztó neve a mellény névtábláján. */
  name: string;
  /** Osztás közben a shoe felőli kéz a shoe-hoz nyúl, a tekintet követi. */
  dealing: boolean;
  /** Felfedéskor a kéz a hole cardhoz nyúl, a tekintet az asztalra esik. */
  revealing: boolean;
}

/**
 * Az osztó jelenléte: fej, törzs az asztal mögött és két kéz a perem előtt.
 * Visszafogott, arányos rajz (nem rajzfilm-figura): pislog, és a játék
 * menetét követi a tekintetével — osztáskor a shoe felé, felfedéskor a lapra.
 */
export function DealerFigure({ name, dealing, revealing }: DealerFigureProps) {
  const gaze = dealing ? 'dealer-torso--to-shoe' : revealing ? 'dealer-torso--to-table' : '';
  const handState = dealing ? 'dealer-hands--dealing' : revealing ? 'dealer-hands--revealing' : '';

  return (
    <>
      <svg className={`dealer-torso ${gaze}`} viewBox="0 0 320 246" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="dealer-torso__vest" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--dealer-vest-hi)' }} />
            <stop offset="1" style={{ stopColor: 'var(--dealer-vest)' }} />
          </linearGradient>
          <radialGradient id="dealer-torso__face" cx="0.45" cy="0.35" r="0.75">
            <stop offset="0" style={{ stopColor: 'var(--dealer-skin)' }} />
            <stop offset="1" style={{ stopColor: 'var(--dealer-skin-shade)' }} />
          </radialGradient>
        </defs>

        {/* Nyak — a fejet és a gallért köti össze */}
        <rect className="dealer-torso__neck" x="140" y="92" width="40" height="44" rx="12" />

        {/* Fej */}
        <g className="dealer-head">
          <ellipse className="dealer-head__ear" cx="121" cy="64" rx="7" ry="12" />
          <ellipse className="dealer-head__ear" cx="199" cy="64" rx="7" ry="12" />
          <path
            fill="url(#dealer-torso__face)"
            d="M121 56 C121 26 138 12 160 12 C182 12 199 26 199 56 C199 86 185 108 160 110 C135 108 121 86 121 56 Z"
          />
          <path
            className="dealer-head__jaw"
            d="M125 78 C132 99 146 107 160 109 C174 107 188 99 195 78 C187 95 175 103 160 104 C145 103 133 95 125 78 Z"
          />
          <path
            className="dealer-head__hair"
            d="M118 54 C114 22 136 4 162 5 C189 6 205 24 202 52 C197 38 188 29 175 26 C162 31 142 29 129 34 C123 40 120 47 118 54 Z"
          />
          <path className="dealer-head__brow" d="M135 49 Q144 45 152 48" />
          <path className="dealer-head__brow" d="M168 48 Q176 45 185 49" />
          <g className="dealer-head__eyes">
            <ellipse className="dealer-head__eye-white" cx="144" cy="60" rx="5.5" ry="3.2" />
            <ellipse className="dealer-head__eye-white" cx="176" cy="60" rx="5.5" ry="3.2" />
            <g className="dealer-head__pupils">
              <circle cx="144" cy="61" r="2.5" />
              <circle cx="176" cy="61" r="2.5" />
            </g>
          </g>
          <path className="dealer-head__nose" d="M160 60 L156 78 Q160 81 165 78" />
          <path className="dealer-head__mouth" d="M148 92 Q160 97 172 92" />
          <ellipse className="dealer-head__light" cx="156" cy="30" rx="18" ry="8" />
        </g>

        {/* Törzs */}
        <g transform="translate(0 96)">
          <path className="dealer-torso__shirt" d="M112 40 L160 30 L208 40 L196 150 L124 150 Z" />
          <path
            className="dealer-torso__vest"
            fill="url(#dealer-torso__vest)"
            d="M14 150 C20 96 52 64 118 42 L160 118 L202 42 C268 64 300 96 306 150 Z"
          />
          <path className="dealer-torso__lapel" d="M118 42 L160 118 L150 62 Z" />
          <path className="dealer-torso__lapel" d="M202 42 L160 118 L170 62 Z" />
          <path className="dealer-torso__collar" d="M132 30 L160 46 L188 30 L182 22 L160 34 L138 22 Z" />
          <path className="dealer-torso__tie" d="M160 44 L140 34 L140 54 Z M160 44 L180 34 L180 54 Z" />
          <circle className="dealer-torso__tie" cx="160" cy="44" r="4.5" />
          <circle className="dealer-torso__button" cx="160" cy="128" r="2.6" />
          <circle className="dealer-torso__button" cx="160" cy="142" r="2.6" />
          <g className="dealer-torso__tag">
            <rect x="208" y="84" width="54" height="15" rx="2.5" />
            <text x="235" y="94.5" textAnchor="middle">
              {name}
            </text>
          </g>
        </g>
      </svg>

      <div className={`dealer-hands ${handState}`} aria-hidden="true">
        <svg className="dealer-hands__hand dealer-hands__hand--left" viewBox="0 0 60 70" focusable="false">
          <rect className="dealer-hands__cuff" x="12" y="0" width="36" height="22" rx="6" />
          <path className="dealer-hands__skin" d="M14 20 C10 40 14 60 30 66 C46 60 50 40 46 20 Z" />
          <path className="dealer-hands__shade" d="M22 30 C22 44 24 54 30 60" />
        </svg>
        <svg className="dealer-hands__hand dealer-hands__hand--right" viewBox="0 0 60 70" focusable="false">
          <rect className="dealer-hands__cuff" x="12" y="0" width="36" height="22" rx="6" />
          <path className="dealer-hands__skin" d="M14 20 C10 40 14 60 30 66 C46 60 50 40 46 20 Z" />
          <path className="dealer-hands__shade" d="M38 30 C38 44 36 54 30 60" />
        </svg>
      </div>
    </>
  );
}
