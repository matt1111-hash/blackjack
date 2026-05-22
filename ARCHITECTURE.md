# Architecture — Harold's Blackjack Casino

**Stack:** Vite + React 19 + TypeScript + Zustand + Vitest + Playwright

---

## Module map

```
src/
├── logic/              # Domain: pure blackjack rules (no I/O, no React)
│   ├── deck.ts         # Shoe creation, shuffle, card dealing
│   ├── hand.ts         # Hand value calc, blackjack/bust detection
│   └── rules.ts        # Dealer play, round results, payouts
├── store/              # Application: state management + validation
│   ├── gameStore.ts    # Zustand store — game actions (bet, deal, hit, stand…)
│   ├── gameHelpers.ts  # Shoe init, deal initial hands, dealer resolution
│   └── validators.ts   # Input validation for every action + phase guard
├── components/         # Presentation: React UI components
│   ├── Card/           # Card rendering, flip/animation
│   ├── Chip/           # Chip rendering, stacking animation
│   ├── Avatar/         # Dealer/player avatars (inline SVG)
│   ├── Table/          # Main table layout, dealer/player areas
│   └── UI/             # ActionButtons, ChipSelector, Balance, GameResult,
│   │                   # SoundSettings, InsuranceDialog, ErrorBoundary
├── hooks/              # React hooks
│   ├── useSound.ts     # Sound manager with retry/timeout/circuit-breaker
│   ├── soundHelpers.ts # useVolume, useGameSounds utility hooks
│   └── useGameAnimations.ts
├── types/              # Shared TypeScript types (Card, Hand, GamePhase…)
├── constants/          # Animation timing constants
└── assets/             # Sound file documentation
```

## Dependency direction

```
components → hooks → store → logic → types
                                       (no upward imports)
```

- `logic/` is framework-agnostic — no React, no I/O, no side effects
- `store/` depends only on `logic/` and `types/`
- `hooks/` wrap the store and external APIs (Howler)
- `components/` consume hooks and store

## External dependencies

| Package | Purpose |
|---------|---------|
| React 19 | UI framework |
| Zustand | State management |
| framer-motion | Card/chip animations |
| Howler | Sound playback |
| Vitest | Unit testing |
| Playwright | E2E testing (Chromium + WebKit, desktop + mobile) |

## Asset pipeline

- Sound files: `/public/sounds/*.ogg` — loaded by Howler via `useSound`
- Graceful degradation: missing sounds fail silently, circuit breaker after 5 consecutive failures
- Cards: CSS-rendered with Unicode suit symbols (no external SVGs)
- Avatars: inline SVG components

## CI/CD

- **GitHub Actions** (`ci.yml`): lint → typecheck → test+coverage → build → E2E (4 browser projects)
- **Dependabot**: weekly npm updates, monthly GitHub Actions updates
- **Quality gate** (`quality_gate.sh`): local mode ≥85% line coverage, 300 LOC/file max
