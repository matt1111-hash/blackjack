# AI CODING RULES — TypeScript/React Edition
**Version: 1.0 (2025-01-23)**
**Toolchain: Vite + React 19 + TypeScript + Vitest**

---

## 🔴 HIERARCHIA

| Szerep | Felelősség |
|--------|------------|
| EMBER | Megrendelő, döntéshozó |
| AGENT | Végrehajtó, kódoló, debuggoló |

**AGENT KÖTELESSÉGEI:**
- Az EMBER NEM DEBUGOL — az agent dolga
- Az EMBER NEM BÖNGÉSZIK — kódelemzés az agent feladata
- Hibánál: olvasd el a hibaüzenetet, javítsd, futtasd újra

---

## 🚨 CRITICAL RULES

### ❌ TILOS:
- Guessing — kérdezz, max 2 kérdés
- Incomplete code — befejezni vagy INCOMPLETE.md
- Placeholder comments — `// TODO`, `// FIXME`
- Code snippets — mindig teljes, futtatható fájl
- Truncation — SOHA `...` vagy "rest unchanged"
- God components — >300 sor tilos
- `any` típus — BANNED (használj `unknown`-t ha muszáj)
- Modifying tests — tesztek definiálják a spec-et!

### ✅ KÖTELEZŐ:
- Complete files — első sortól az utolsóig
- Type safety — strict TypeScript, no `any`
- Tesztek — MANDATORY, nincs kivétel
- Functional components — class component TILOS
- Git commit — minden működő egység után

---

## 📊 QUALITY GATE

### Küszöbök:
| Metrika | Target |
|---------|--------|
| Coverage | ≥85% |
| Max LOC/file | 300 |
| ESLint errors | 0 |
| TypeScript errors | 0 |

### Futtatás:
```bash
npm run lint          # ESLint check
npm run test          # Vitest tesztek
npx tsc --noEmit      # TypeScript check
```

---

## 🛠️ TOOLCHAIN

### ESLint (linting)
```bash
npm run lint
```

### Vitest (testing)
```bash
npm run test              # Watch mode
npm run test -- --run     # Single run
npm run test -- --coverage # Coverage report
```

### TypeScript
```bash
npx tsc --noEmit          # Type check only
```

### Dev server
```bash
npm run dev               # http://localhost:5173
```

---

## 🏗️ PROJECT ARCHITECTURE
```
src/
├── types/           # TypeScript típusok, interfaces
├── logic/           # Pure functions — NO React, NO side effects!
├── store/           # Zustand store — game state
├── hooks/           # Custom React hooks
├── components/      # React komponensek
│   ├── Card/
│   ├── Chip/
│   ├── Table/
│   └── UI/
└── assets/          # Statikus fájlok (képek, hangok)

tests/
└── *.test.ts        # Tesztek — logic/ tesztelése prioritás!
```

### Szabályok:
- `logic/` SOHA nem importál React-ot
- `logic/` SOHA nem importál `store/`-t
- Egy fájl = egy felelősség
- Max 300 sor / fájl

---

## 🔧 CODE STYLE

### TypeScript:
```typescript
// ✅ CORRECT - explicit types
function calculateHandValue(cards: Card[]): number {
  // ...
}

// ❌ FORBIDDEN - any
function calculateHandValue(cards: any): any {
  // ...
}
```

### React Components:
```typescript
// ✅ CORRECT - functional + typed props
interface CardProps {
  card: Card;
  onClick?: () => void;
}

export function Card({ card, onClick }: CardProps) {
  return <div>...</div>;
}

// ❌ FORBIDDEN - class component
class Card extends React.Component { }
```

### Imports (sorrend):
```typescript
// 1. React
import { useState } from 'react';

// 2. Third-party
import { motion } from 'framer-motion';

// 3. Internal - types first
import type { Card } from '../types';

// 4. Internal - functions/components
import { calculateHandValue } from '../logic/hand';
```

---

## 🧪 TESTING RULES

- **TESTS ARE MANDATORY** — nincs kivétel!
- Coverage target: ≥85%
- Prioritás: `logic/` tesztelése (pure functions)
- Test file naming: `*.test.ts` vagy `*.test.tsx`
- Arrange-Act-Assert pattern

### Példa:
```typescript
// src/logic/hand.test.ts
import { describe, it, expect } from 'vitest';
import { calculateHandValue } from './hand';

describe('calculateHandValue', () => {
  it('should return 21 for blackjack', () => {
    const cards = [
      { suit: 'hearts', rank: 'A', faceUp: true },
      { suit: 'spades', rank: 'K', faceUp: true },
    ];
    expect(calculateHandValue(cards)).toBe(21);
  });
});
```

---

## 📋 WORKFLOW

### Session Start:
```bash
pwd
git status
cat AGENTS_TS.md
cat BLACKJACK_PROJECT.md
```

### After Changes:
```bash
npm run lint
npm run test -- --run
npx tsc --noEmit
git add .
git commit -m "descriptive message"
```

### Before "KÉSZ":
```bash
git status
git log --oneline -3
# Ha nincs commit → NEM KÉSZ!
```

---

## 🎯 TL;DR

1. 🔥 CHECK git status — minden változás után
2. 📝 Write complete files — nincs truncation
3. 🎯 Logic first — pure functions, tesztelhető
4. ✅ Pass quality gate — lint clean, tests pass, tsc clean
5. 🧪 Write tests — MANDATORY, logic/ prioritás
6. 📐 Respect limits — ≤300 lines/file
7. 🚫 NO `any` — strict TypeScript
8. 🔍 DEBUG YOURSELF — ne delegálj embernek

**Remember: Type safety prevents bugs. Tests prove correctness. Git tracks everything.** 🚀
