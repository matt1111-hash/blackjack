import './TableMarkings.css';

/**
 * Asztal-nyomat (D6) a félhold-filcen: az osztó és a játékos között, a játékos
 * felé ívelő feliratokkal — a valódi asztalokon is a tétkörök fölött fut.
 * Szabály-helyes: a rules.ts osztója soft 17-en MEGÁLL (S17).
 */
export function TableMarkings() {
  return (
    <svg
      className="table-markings"
      viewBox="0 0 1000 640"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <path id="table-markings__arc-insurance" d="M 260 230 Q 500 320 740 230" fill="none" />
        <path id="table-markings__arc-main" d="M 190 280 Q 500 400 810 280" fill="none" />
      </defs>

      <text className="table-markings__text table-markings__text--insurance">
        <textPath href="#table-markings__arc-insurance" startOffset="50%" textAnchor="middle">
          INSURANCE PAYS 2 TO 1
        </textPath>
      </text>

      <text className="table-markings__text table-markings__text--main">
        <textPath href="#table-markings__arc-main" startOffset="50%" textAnchor="middle">
          BLACKJACK PAYS 3 TO 2
        </textPath>
      </text>

      <text className="table-markings__text table-markings__text--sub" x="500" y="372" textAnchor="middle">
        DEALER MUST STAND ON ALL 17s · DRAW TO 16
      </text>
    </svg>
  );
}
