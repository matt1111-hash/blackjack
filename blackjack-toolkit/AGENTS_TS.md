# AI CODING RULES — TypeScript/React Edition
**Version: 1.0 (2025-01-23)**
**Toolchain: Vite + React 19 + TypeScript + Vitest**

---

## 🔴 HIERARCHIA — LEGFONTOSABB!

| Szerep | Felelősség |
|--------|------------|
| EMBER | Megrendelő, döntéshozó |
| AGENT | Végrehajtó, kódoló, debuggoló |

**AGENT KÖTELESSÉGEI:**
- Az EMBER NEM DEBUGOL — az agent dolga
- Az EMBER NEM BÖNGÉSZIK — kódelemzés az agent feladata
- Az EMBER NEM CSELÉD — ne kérj tőle futtatást amit te is tudsz
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
- Class components — BANNED (functional only)
- Modifying tests — tesztek definiálják a spec-et!
- Config manipulation — `.quality_gate.conf` TILOS módosítani!

### ✅ KÖTELEZŐ:
- Complete files — első sortól az utolsóig
- Type safety — strict TypeScript, no `any`
- Tesztek — MANDATORY, nincs kivétel
- Functional components — React hooks only
- Git commit — minden működő egység után

---

## 📊 QUALITY GATE

### Küszöbök:
| Metrika | Local | CI |
|---------|-------|-----|
| Coverage | ≥85% | ≥90% |
| Max LOC/file | 300 | 250 |
| ESLint errors | 0 | 0 |
| TypeScript errors | 0 | 0 |

### Futtatás:
```bash
./quality_gate.sh          # Full check (default)
./quality_gate.sh --quick  # Gyors lint fix
./quality_gate.sh --ci     # CI mód (strict)
./quality_gate.sh --health # Full report
```

### Vagy Makefile:
```bash
make check      # Gyors lint fix
make quality    # Teljes quality gate
make ci         # CI mód
```

### PASS után jelenthetsz KÉSZ-t!

---

## 🛠️ TOOLCHAIN

### ESLint (linting)
```bash
npm run lint              # Check
npm run lint -- --fix     # Auto-fix
```

### TypeScript (type check)
```bash
npx tsc --noEmit          # Type check only
```

### Vitest (testing)
```bash
npm run test              # Watch mode
npm run test -- --run     # Single run
npm run test -- --coverage # Coverage report
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
```

### Szabályok:
- `logic/` SOHA nem importál React-ot
- `logic/` SOHA nem importál `store/`-t vagy `components/`-t
- Egy fájl = egy felelősség
- Max 300 sor / fájl

---

## 🔧 CODE STYLE

### TypeScript:
```typescript
// ✅ CORRECT - explicit types
function calculateHandValue(cards: Card[]): number {
  // implementation
}

// ❌ FORBIDDEN - any
function calculateHandValue(cards: any): any {
  // implementation
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
- Coverage target: ≥85% (local), ≥90% (CI)
- Prioritás: `logic/` tesztelése (pure functions)
- Test file naming: `*.test.ts` vagy `*.test.tsx`
- Arrange-Act-Assert pattern
- **NO test modification** — tesztek definiálják a spec-et!

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
ls -la
cat AGENTS_TS.md
cat BLACKJACK_PROJECT.md
```

### Every Task Complete:
```bash
./quality_gate.sh
# CSAK PASS után mész tovább!
```

### Before "KÉSZ":
```bash
git status
# Ha nincs commit → NEM KÉSZ!
```

---

## ⚠️ CONFIG MANIPULATION = CHEATING

A következő fájlok **CSAK OLVASHATÓK**:
- `.quality_gate.conf`
- `quality_gate.sh`
- `eslint.config.js`
- `tsconfig.json`
- `vite.config.ts`

Ha a modell módosítja ezeket a coverage/lint elkerülésére = **AZONNALI FAIL**.

---

## 🎯 TL;DR

1. 🔥 CHECK git status — minden változás után
2. 📝 Write complete files — nincs truncation
3. 🎯 Logic first — pure functions, tesztelhető
4. ✅ Pass quality gate — `./quality_gate.sh`
5. 🧪 Write tests — MANDATORY, logic/ prioritás
6. 📐 Respect limits — ≤300 lines/file
7. 🚫 NO `any` — strict TypeScript
8. 🔍 DEBUG YOURSELF — ne delegálj embernek

**Remember: Type safety prevents bugs. Tests prove correctness. Git tracks everything.** 🚀
