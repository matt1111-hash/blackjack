# blackjack — Struktúratérkép
Dátum: 2025-04-30 | Model: mistral-medium-3.5

---

## 1. Technológiai leltár

### Programnyelv és verzió
- **TypeScript**: ~5.9.3 (lazy version, `package.json:47`)
- **Node.js**: 20 (CI workflow alapértelmezett, `.github/workflows/ci.yml:11`)

### Runtime és build rendszer
- **Build tool**: Vite 7.2.4 (`package.json:17`)
- **Package manager**: npm (lock file: `package-lock.json`)
- **Module system**: ES Modules (`"type": "module"` in `package.json`)

### Frameworkök és könyvtárak (csoportosítva)

#### Web/API réteg
- React 19.2.1 (`package.json:20-21`) - UI framework
- React DOM 19.2.1 (`package.json:22`)
- Vite SWC React plugin 4.2.2 (`package.json:32`) - React optimalizáció

#### State management
- Zustand 5.0.10 (`package.json:23`) - Game state management (store)

#### Adatbázis / Storage
- Browser localStorage - Game state persistence (balance, test shoe)
- ⚠️ **localStorage override mechanism** for test shoe injection (`src/store/gameHelpers.ts:74-93`)

#### Aszinkron / Job / Queue
- None - Pure client-side, no background workers

#### Animációk
- Framer Motion 12.29.0 (`package.json:19`) - Card/Chip animations

#### Audio
- Howler 2.2.4 (`package.json:24`) - Sound effects playback

#### Tesztelési eszközök
- Vitest 4.0.18 (`package.json:41`) - Unit testing
- @vitest/coverage-v8 4.0.18 (`package.json:35`) - Coverage reporting
- @vitest/ui 4.0.18 (`package.json:36`) - Test UI
- @playwright/test 1.55.0 (`package.json:28`) - E2E testing
- jsdom 27.4.0 (`package.json:42`) - DOM simulation
- @testing-library/react 16.3.2 (`package.json:29`) - React component testing
- @testing-library/jest-dom 6.9.1 (`package.json:30`) - DOM assertions

#### Linting, formázás
- ESLint 9.39.1 (`package.json:37`) - Linting
- @eslint/js 9.39.1 (`package.json:25`) - ESLint parser
- typescript-eslint 8.46.4 (`package.json:43`) - TypeScript ESLint
- eslint-config-prettier 10.1.8 (`package.json:38`) - Prettier config
- eslint-plugin-react 7.37.5 (`package.json:39`) - React linting
- eslint-plugin-react-hooks 7.0.1 (`package.json:40`) - React hooks linting
- Prettier (`.prettierrc`) - Code formatting

#### Styling
- Tailwind CSS 4.1.18 (`package.json:44`) - CSS framework
- @tailwindcss/postcss 4.1.18 (`package.json:27`) - PostCSS plugin
- PostCSS 8.5.6 (`package.json:45`)

#### CI/CD
- GitHub Actions workflows (`.github/workflows/`)

### Konfiguráció és environment kezelés
- **Environment variables**: `import.meta.env` (Vite) - `VITE_E2E`, `MODE`
- **Config files**:
  - `tsconfig.json` - TypeScript compiler
  - `tsconfig.node.json` - TypeScript for node scripts
  - `tsconfig.app.json` - TypeScript for app
  - `vite.config.ts` - Vite build config
  - `vitest.config.ts` - Test config
  - `playwright.config.ts` - E2E config
  - `.quality_gate.conf` - Quality thresholds
  - `.prettierrc` - Code formatting
  - `.gitignore` - Git ignore patterns
- **Secrets**: None (client-side only, no API keys)

### Infrastruktúra jelek
- **Docker**: Not present
- **Cloud provider**: None
- **Reverse proxy**: None
- **Desktop integration**: `blackjack.desktop` file + `scripts/launch_desktop.sh` for local desktop launch
- ⚠️ **Desktop launcher**: Uses `xdg-open` and `nohup` for preview server (`scripts/launch_desktop.sh`)

---

## 2. Struktúratérkép (annotált könyvtárfa)

```
blackjack/
├── .github/                    # GitHub CI/CD workflowok
│   └── workflows/
│       ├── ci.yml             # Lint, typecheck, test, build pipeline
│       ├── e2e-tests.yml      # E2E test workflow (multi-browser)
│       ├── health-check.yml   # Code health monitoring (scheduled weekly)
│       └── pre-commit.yml      # Pre-commit hook runner
├── .gitignore                 # Git ignore rules
├── .prettierrc                # Prettier config
├── .quality_gate.conf         # Quality gate thresholds (80% lines/functions)
├── AGENTS.md                  # AI coding rules (Hungarian)
├── AGENTS_TS.md               # AI coding rules for TypeScript
├── BLACKJACK_PROJECT.md       # Project vision, architecture, scope
├── README.md                  # Project readme
├── SECURITY.md                # Security policy and threat model
├── SEC_AUDIT.md               # Security audit report (2026-04-15)
├── WORKFLOW.md                # Development workflow
├── PRODUCTION_MANDATE .md     # Production requirements
├── blackjack.desktop          # Linux desktop entry
├── coverage/                  # Coverage reports (generated)
│   └── coverage-summary.json  # Coverage summary (91.42% lines)
├── dist/                      # Build output (generated)
├── docs/                      # Documentation (currently empty)
├── e2e/                      # E2E test files
│   └── game-flow.spec.ts      # Game flow scenarios (Playwright)
├── node_modules/              # npm dependencies
├── package.json               # Project manifest (npm)
├── package-lock.json          # Dependency lock file
├── playwright.config.ts       # Playwright configuration
├── public/                    # Static assets (served as-is)
│   ├── vite.svg               # Vite logo
│   └── sounds/                # Sound effect files (10 .ogg files)
│       ├── button-click.ogg
│       ├── card-place.ogg
│       ├── card-slide.ogg
│       ├── chip-drop.ogg
│       ├── chip-stack.ogg
│       ├── chip-win.ogg
│       ├── deal-start.ogg
│       ├── win.ogg
│       ├── lose.ogg
│       └── blackjack.ogg
├── quality_gate.sh            # Quality gate script (Bash)
├── scripts/                   # Utility scripts
│   └── launch_desktop.sh      # Local desktop launcher
├── src/                       # Source code (~60 files, ~3959 lines TypeScript)
│   ├── App.tsx                # Root component (7 lines)
│   ├── index.css              # Global styles
│   ├── main.tsx               # Entry point (10 lines)
│   ├── test-setup.ts          # Test setup (1 line)
│   ├── components/            # React components
│   │   ├── Avatar/            # Player/Dealer avatars
│   │   │   ├── index.ts       # Barrel export
│   │   │   ├── DealerAvatar.tsx
│   │   │   ├── PlayerAvatar.tsx
│   │   │   └── Avatar.css
│   │   ├── Card/              # Card components
│   │   │   ├── Card.tsx       # Single card display
│   │   │   ├── CardFlip.tsx   # Flip animation wrapper
│   │   │   ├── CardAnimations.tsx
│   │   │   ├── Hand.tsx       # Hand of cards
│   │   │   ├── Card.css
│   │   │   ├── CardFlip.css
│   │   │   ├── CardAnimations.css
│   │   │   └── Hand.css
│   │   ├── Chip/              # Chip components
│   │   │   ├── Chip.tsx       # Single chip
│   │   │   ├── ChipStack.tsx  # Chip stack with animation
│   │   │   ├── ChipAnimations.tsx
│   │   │   ├── Chip.css
│   │   │   └── ChipAnimations.css
│   │   ├── Table/             # Game table components
│   │   │   ├── BlackjackTable.tsx     # Main game table
│   │   │   ├── BlackjackTable.test.tsx # Component test
│   │   │   ├── BlackjackTable.css
│   │   │   ├── BettingArea.tsx         # Bet placement area
│   │   │   ├── BettingArea.css
│   │   │   ├── DealerArea.tsx          # Dealer's card area
│   │   │   ├── DealerArea.css
│   │   │   ├── PlayerArea.tsx          # Player's hand(s) area
│   │   │   └── PlayerArea.css
│   │   └── UI/                 # UI components
│   │       ├── ActionButtons.tsx      # Hit/Stand/Double/Split buttons
│   │       ├── ActionButtons.css
│   │       ├── Balance.tsx            # Balance display
│   │       ├── Balance.css
│   │       ├── ChipSelector.tsx       # Chip value selector
│   │       ├── ChipSelector.css
│   │       ├── GameResult.tsx         # Win/Lose/Push display
│   │       ├── GameResult.css
│   │       ├── InsuranceDialog.tsx    # Insurance dialog
│   │       ├── InsuranceDialog.css
│   │       ├── SoundSettings.tsx      # Sound settings
│   │       └── SoundSettings.css
│   ├── assets/               # Static assets
│   │   └── sounds/            # [HIPOTÉZIS – ellenőrzendő] Duplicate of public/sounds?
│   │       └── README.md     # Only README, no actual sound files here
│   ├── hooks/                # React hooks
│   │   ├── index.ts           # Barrel export
│   │   ├── useSound.ts        # Sound management hook (254 lines)
│   │   └── useGameAnimations.ts # Animation state hook (64 lines)
│   ├── logic/                # Core game logic (clean architecture - framework independent)
│   │   ├── deck.ts            # Deck creation, shuffling, card dealing (44 lines)
│   │   ├── deck.test.ts       # Deck unit tests
│   │   ├── hand.ts            # Hand value calculation, bust/blackjack checks (68 lines)
│   │   ├── hand.test.ts       # Hand unit tests
│   │   ├── rules.ts           # Game rules: dealer AI, payouts, results (149 lines)
│   │   └── rules.test.ts      # Rules unit tests
│   ├── store/                # State management (Zustand)
│   │   ├── gameStore.ts       # Zustand store definition (284 lines)
│   │   ├── gameStore.test.ts  # Store tests
│   │   ├── gameHelpers.ts     # Store utilities, shoe management (141 lines)
│   │   └── gameHelpers.test.ts # Helper tests
│   └── types/                # TypeScript types
│       └── index.ts           # Type definitions (35 lines)
├── test-results/             # Test results (generated)
├── tsconfig.json             # TypeScript config (root)
├── tsconfig.app.json         # TypeScript config (app)
├── tsconfig.node.json        # TypeScript config (node)
├── vite.config.ts            # Vite config (7 lines)
└── vitest.config.ts          # Vitest config (33 lines)
```

### Mappák mérete és modul határok

| Mappa | Fájlok száma | Sorok (léc) | Modul határ | Megjegyzés |
|-------|--------------|-------------|-------------|-----------|
| `src/` | 60 | ~3,959 | `index.css`, `main.tsx`, `App.tsx` | Nincs explicit barrel export |
| `src/logic/` | 6 | ~287 | Nincs | Clean Architecture: framework-független |
| `src/store/` | 4 | ~461 | Nincs | Zustand store |
| `src/hooks/` | 3 | ~320 | `index.ts` | Barrel export van |
| `src/components/` | 21+ | ~2,100+ | Nincs | React komponensek |
| `src/types/` | 1 | 35 | `index.ts` | Barrel export |

### Projekt méret becslés
- **Összes TypeScript/TSX fájl**: ~60 (src/ + e2e/ + config)
- **Forráskód sorok (src/)**: ~3,959 lines
- **Test fájlok**: 6 (`.test.ts` / `.test.tsx`)
- **Test/forrás arány**: 6/54 ≈ 11% (fájl alapú), ~91.42% coverage (sor alapú)
- **Forrás fájlok (src/)**: 54 (nem számítva CSS)
- **CSS fájlok**: 21

### Nem oda való tartalmak ⚠️
- `src/assets/sounds/` - **Üres mappa (csak README.md)**, valószínűleg duplicate a `public/sounds/` mappával
- `code-health-toolkit-v4/` - **Külső eszközök másolata**, nem a projekt része (8 fájl)
- `code-health-toolkit-v4.0.zip` - **Archívum fájl** a root-ban

---

## 3. Belépési pont leltár

### Top-level entrypointok

#### 1. Web Application Entry
| Fájl | Szerep | Flow-k | Kanonikus |
|------|--------|--------|-----------|
| `index.html` | HTML entry point | Loads `main.tsx` via Vite | ✅ |
| `src/main.tsx:5-9` | React root render | `createRoot` → `App` component | ✅ |
| `src/App.tsx:4-6` | App component | Renders `BlackjackTable` | ✅ |

#### 2. Game Flow Entry Points
| Fájl | Szerep | Flow-k | Kanonikus |
|------|--------|--------|-----------|
| `src/components/Table/BlackjackTable.tsx:28-31` | Main game container | Initializes store, hooks, renders all game UI | ✅ |
| `src/store/gameStore.ts:24-284` | Zustand store | Contains all game actions | ✅ |

#### 3. Action Handlers (User Interaction Entry Points)
| Fájl | Szerep | Trigger | Kanonikus |
|------|--------|---------|-----------|
| `src/components/Table/BlackjackTable.tsx:56-108` | Event handlers | User clicks (bet, deal, hit, stand, double, split, insurance) | ✅ |
| `src/store/gameStore.ts:38-280` | Store actions | `placeBet`, `deal`, `hit`, `stand`, `double`, `split`, `buyInsurance`, `declineInsurance`, `newRound`, `resetBalance` | ✅ |

#### 4. Sound System Entry Points
| Fájl | Szerep | Trigger | Kanonikus |
|------|--------|---------|-----------|
| `src/hooks/useSound.ts:188-221` | `useGameSounds` hook | Called by `BlackjackTable.tsx:33` | ✅ |
| `src/hooks/useSound.ts:154-186` | Sound play functions | Called by event handlers | ✅ |
| `src/hooks/useSound.ts:74-152` | `useSound` hook | Initializes sound manager | ✅ |
| `src/hooks/useSound.ts:38-72` | **Singleton sound manager** ⚠️ | Global state via closure | Legacy pattern |

#### 5. Animation System Entry Points
| Fájl | Szerep | Trigger | Kanonikus |
|------|--------|---------|-----------|
| `src/hooks/useGameAnimations.ts:5-64` | Animation state management | Used by components | ✅ |

#### 6. CLI / Build Entry Points
| Fájl | Szerep | Parancs | Kanonikus |
|------|--------|---------|-----------|
| `package.json:5-16` | npm scripts | `dev`, `build`, `lint`, `typecheck`, `test`, `test:run`, `test:coverage`, `test:e2e`, `preview` | ✅ |
| `vite.config.ts` | Vite build config | Export default config | ✅ |
| `scripts/launch_desktop.sh` | Desktop launcher | Custom bash script for local desktop launch | Opcionális |

#### 7. Test Entry Points
| Fájl | Szerep | Trigger | Kanonikus |
|------|--------|---------|-----------|
| `vitest.config.ts` | Vitest config | `npm run test` | ✅ |
| `src/test-setup.ts` | Test setup | `@testing-library/jest-dom` import | ✅ |
| `e2e/game-flow.spec.ts` | E2E tests | Playwright | ✅ |
| `playwright.config.ts` | Playwright config | `npx playwright test` | ✅ |

#### 8. Quality Gate Entry Points
| Fájl | Szerep | Trigger | Kanonikus |
|------|--------|---------|-----------|
| `quality_gate.sh` | Quality gate script | Manual or CI | ✅ |
| `.quality_gate.conf` | Quality thresholds | Sourced by `quality_gate.sh` | ✅ |

#### 9. CI/CD Entry Points
| Fájl | Szerep | Trigger | Kanonikus |
|------|--------|---------|-----------|
| `.github/workflows/ci.yml` | Main CI pipeline | Push/PR to main/refactor | ✅ |
| `.github/workflows/e2e-tests.yml` | E2E test pipeline | Push/PR to main/develop | ✅ |
| `.github/workflows/health-check.yml` | Health check pipeline | Push/PR + scheduled weekly | ✅ |
| `.github/workflows/pre-commit.yml` | Pre-commit pipeline | Push/PR to main/develop | ✅ |

---

## 4. Belső függőségtérkép

### Fő hívási irányok

```
┌─────────────────┐     
│   index.html     │────▶ main.tsx 
│   (Entry)        │     
└─────────────────┘     
         │               
         ▼               
┌─────────────────┐     
│    App.tsx       │────▶ BlackjackTable.tsx 
│    (Root)        │     
└─────────────────┘     
         │               
         ▼               
┌─────────────────────────────────────────┐
│     BlackjackTable.tsx                  │
│  (Main Game Container)                   │◄────┐
└───────────────┬───────────────────────┬┘     │
                │                       │      │
                ▼                       ▼      │
        ┌───────────────┐         ┌────────────┐
        │ useGameStore() │         │ useGameSounds() 
        │ (Zustand)      │         │ (Sound Hook)  
        └───────┬───────┘         └───────┬────┘
                │                       │
                ▼                       ▼
        ┌───────────────┐         ┌────────────┐
        │  gameStore.ts  │         │  useSound.ts 
        │  (Actions)     │         │  (Hook)      
        └───────┬───────┘         └───────┬────┘
                │                       │
          ┌─────┴─────┐           ┌──────┴──────┐
          ▼           ▼           ▼            ▼
┌─────────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ gameHelpers │ │  logic/  │ │ Howler  │ │ Framer  │
│   .ts        │ │  *.ts    │ │  (lib)  │ │ Motion  │
└─────────────┘ └─────────┘ └─────────┘ └─────────┘
          │
          ▼
┌─────────────────┐
│   types/index.ts │
│   (Type Defs)   │
└─────────────────┘
```

### Hívási láncok (lefőbb akikciók)

1. **Deal Flow**:
   `BlackjackTable.tsx:handleDeal` → `useGameStore().deal` → `gameHelpers.dealInitialHands` → `logic/deck.dealCard` → `logic/hand.isBlackjack` → `logic/rules.calculateResults`

2. **Hit Flow**:
   `BlackjackTable.tsx:handleHit` → `useGameStore().hit` → `gameHelpers.dealCard` → `logic/hand.isBusted` → `gameHelpers.handleAllHandsDone` → `logic/rules.dealerPlay`

3. **Sound Flow**:
   `BlackjackTable.tsx:handleDeal` → `playDealStart` → `useGameSounds().playDealStart` → `useSound().play('dealStart')` → `soundManager.play()` → `Howl.play()`

### Gyanús cirkuláris függőségek ⚠️
- **Nincsenek** - A projekt Clean Architecture-t követ:
  - `logic/` nem importál semmit `store/` vagy `components/`ből
  - `store/` importál `logic/`-öt, de `logic/` nem importál `store/`-t
  - `components/` importál `store/`-t és `hooks/`-ot, de fordítva nem
  - `hooks/` importál `store/`-t, de `store/` nem importál `hooks/`-ot

### Implicit globális állapotok, singleton-ok, registry-k ⚠️

| Fájl | Mechanizmus | Kockázat | Indoklás |
|------|-------------|----------|-----------|
| `src/hooks/useSound.ts:38-72` | **Singleton sound manager** | ⚠️ Medium | `soundManager` személy a closure-ben, első híváskor inicializálódik, globálisan elérhető |
| `src/hooks/useSound.ts:74-78` | `getSoundManager()` | ⚠️ Medium | Singleton accessor function |
| `src/store/gameStore.ts:24-25` | Zustand store | ✅ Low | Zustand által kezelve, React context-en keresztül |
| `src/store/gameHelpers.ts:74-93` | `localStorage` shoe override | ⚠️ **High** | Environment check nélkül bárki használhatja production-ben |

### Shared util-on át rejtett coupling
- **Nincs direkt coupling** - A `logic/` mappa tisztán tartva
- **gameHelpers.ts** társítja a `logic/` függvényeket a store-hoz, de ez explicit és jól definiált
- **types/index.ts** központosíthatna jobban, de jelenleg mindenki importálja direkt

---

## 5. Külső függőségek

### Direkt production függőségek

| Csomag | Verzió | Szerep | Kockázat |
|--------|--------|-------|----------|
| react | ^19.2.1 | UI framework | ⚠️ **Low** - CVE-2025-55182 patch elég (SEC_AUDIT.md) |
| react-dom | ^19.2.1 | React DOM | ⚠️ Low - Ugyanaz mint react |
| zustand | ^5.0.10 | State management | ✅ Low |
| framer-motion | ^12.29.0 | Animációk | ✅ Low |
| howler | ^2.2.4 | Hang lejátszás | ✅ Low |

### Dev-only / build-time függőségek

| Csomag | Verzió | Szerep | Dev |
|--------|--------|-------|-----|
| vite | ^7.2.4 | Build tool | ✅ |
| @vitejs/plugin-react-swc | ^4.2.2 | React SWC plugin | ✅ |
| typescript | ~5.9.3 | Type checking | ✅ |
| vitest | ^4.0.18 | Testing | ✅ |
| @vitest/coverage-v8 | ^4.0.18 | Coverage | ✅ |
| @vitest/ui | ^4.0.18 | Test UI | ✅ |
| @playwright/test | ^1.55.0 | E2E testing | ✅ |
| eslint | ^9.39.1 | Linting | ✅ |
| @eslint/js | ^9.39.1 | ESLint parser | ✅ |
| typescript-eslint | ^8.46.4 | TS ESLint | ✅ |
| eslint-config-prettier | ^10.1.8 | Prettier config | ✅ |
| eslint-plugin-react | ^7.37.5 | React linting | ✅ |
| eslint-plugin-react-hooks | ^7.0.1 | React hooks linting | ✅ |
| eslint-plugin-react-refresh | ^0.4.24 | React refresh | ✅ |
| globals | ^16.5.0 | Globals | ✅ |
| jsdom | ^27.4.0 | DOM simulation | ✅ |
| @testing-library/react | ^16.3.2 | React component testing | ✅ |
| @testing-library/jest-dom | ^6.9.1 | DOM assertions | ✅ |
| @types/react | ^19.2.5 | React types | ✅ |
| @types/react-dom | ^19.2.3 | React DOM types | ✅ |
| @types/howler | ^2.2.12 | Howler types | ✅ |
| @types/node | ^24.10.1 | Node types | ✅ |
| tailwindcss | ^4.1.18 | CSS framework | ✅ |
| @tailwindcss/postcss | ^4.1.18 | PostCSS plugin | ✅ |
| postcss | ^8.5.6 | CSS processing | ✅ |
| @eslint/js | ^9.39.1 | ESLint | ✅ |

### Meglepő vagy kockázatos csomagok ⚠️
- **react 19.2.1** - CVE-2025-55182-vel kapcsolatban (SEC_AUDIT.md Finding 4.1) - ** patch-elve volt** a 63dd054 commit
- **howler 2.2.4** - Relatíve öreg, de nem kritikus biztonsági résekkel
- **framer-motion 12.29.0** - Stabil, de nagy bundle méret

### Elavultnak vagy ritkán karbantartott csomagok ⚠️
- **Nincsenek** - Összes direkt függőség aktívan karbantartott

### npm audit status
- SEC_AUDIT.md szerint: `npm audit` nem futtatható a CI környezetben (registry 403 error)
- Online advisory correlation használt

---

## 6. Test coverage becslés

### Test fájlok létezése
- **Van tesztfájl**: ✅ Igen (6 db)
- **Test fájlok listája**:
  1. `src/logic/deck.test.ts`
  2. `src/logic/hand.test.ts`
  3. `src/logic/rules.test.ts`
  4. `src/store/gameStore.test.ts`
  5. `src/store/gameHelpers.test.ts`
  6. `src/components/Table/BlackjackTable.test.tsx`

### Forrás vs. test fájlok arány
- **Forrás fájlok (src/)**: 54 (TS/TSX)
- **Test fájlok (src/)**: 6
- **Arány**: 6/54 ≈ **11%** (fájl alapú)

### Coverage szintjei (coverage-summary.json)
| Metrika | Érték | CI küszöb |
|---------|-------|-----------|
| Lines | 91.42% | 80% ✅ |
| Statements | 90.05% | - |
| Functions | 89.23% | 80% ✅ |
| Branches | 86.36% | - |

### Coverage eloszlás fájlonként
| Fájl | Lines Coverage | Functions Coverage | Branches Coverage |
|------|---------------|-------------------|-------------------|
| `src/App.tsx` | 100% | 100% | 100% |
| `src/logic/deck.ts` | 100% | 100% | 80% |
| `src/logic/hand.ts` | 100% | 100% | 100% |
| `src/logic/rules.ts` | 100% | 100% | 100% |
| `src/store/gameHelpers.ts` | 87.87% | 100% | 78.94% |
| `src/store/gameStore.ts` | 91.26% | 100% | 81.03% |
| `src/components/Table/BlackjackTable.tsx` | 76.47% | 63.63% | 88.88% |
| `src/components/Table/BettingArea.tsx` | **0%** ⚠️ | **0%** ⚠️ | **0%** ⚠️ |
| `src/components/Table/DealerArea.tsx` | 100% | 100% | 94.11% |
| `src/components/Table/PlayerArea.tsx` | 96.29% | 100% | 94.64% |
| `src/components/UI/ActionButtons.tsx` | 100% | 100% | 77.14% |
| `src/components/UI/ChipSelector.tsx` | 100% | 100% | 80% |
| `src/components/UI/GameResult.tsx` | 100% | 100% | 71.42% |

### Teszletlen területek ⚠️

1. **`src/components/Table/BettingArea.tsx`** - **0% coverage**
   - Feltételezett ok: UI komponens, nehezen tesztelhető izoláltan
   - Kockázat: Low - Pure presentation

2. **Hooks** - **Nincsenek unit tesztek**
   - `src/hooks/useSound.ts` - Nem tesztelve
   - `src/hooks/useGameAnimations.ts` - Nem tesztelve
   - Kockázat: Medium - Komplex logika, különösen sound manager

3. **UI Components** - **Részlegesen tesztelve**
   - Csak `BlackjackTable.test.tsx` létezik
   - Többi UI komponens (ActionButtons, ChipSelector, etc.) nem tesztelve
   - Kockázat: Low-Medium

4. **E2E tesztek** - **Korlátozott**
   - Csak 2 scenario (`game-flow.spec.ts`):
     - Dealer bust → player win
     - Player hit → player bust → lose
   - Hiányzó scenariók:
     - Double down
     - Split
     - Insurance
     - Blackjack payout
     - Push (tie)
     - Multiple hands (after split)
   - Kockázat: Medium

---

## 7. Audit-előkészítő összefoglaló

### Top 3 logikai / architekturális kockázat (Prompt 1 számára)

1. **Singleton Sound Manager Globális Állapot**
   - **Fájl**: `src/hooks/useSound.ts:38-72`
   - **Leírás**: A sound manager closure-en keresztül singleton-ként működik, ami implicit globális állapotot jelent a React alkalmazásban
   - **Kockázat**: Middleware tesztelhetőség csökken, állapot reset nehéz

2. **localStorage Shoe Override Production Environmentben**
   - **Fájl**: `src/store/gameHelpers.ts:74-93`
   - **Leírás**: A shoe (pakli) localStorage-ból tölthető be bármely környezetben, ami productionben is lehetővé teszi a csapást
   - **Kockázat**: Biztonsági rések, játéklogika manipulálhatóság

3. **Nincs Centralizált Hiba Kezelés Game Flow-ban**
   - **Fájlok**: `src/store/gameStore.ts` összes action
   - **Leírás**: A game flow action-ek nem kezelik explicitly a hibákat (pl. üres shoe, érvénytelen hand index)
   - **Kockázat**: Nincs validáció, silent fail vagy undefined behavior

### Top 3 biztonsági kockázat (Prompt 2 számára)

1. **LocalStorage-Based Shoe Manipulation** ⚠️ [MEGERŐSÍTETT]
   - **Fájl**: `src/store/gameHelpers.ts:74-93`
   - **Leírás**: Bármely felhasználó beállíthatja a `blackjack:e2e-shoe` localStorage kulcsot, ami directly befolyásolja a játék kimenetelét
   - **Kockázat**: Cheating, business logic manipulation
   - **Lásd**: SEC_AUDIT.md Finding 1.1

2. **Singleton Sound Manager Memory Leak** ⚠️ [HIPOTÉZIS – ellenőrzendő]
   - **Fájl**: `src/hooks/useSound.ts:38-72`
   - **Leírás**: A sound manager singleton egyszer inicializálódik, de soha nem takarítódik fel (unload, cleanup)
   - **Kockázat**: Memory leak, particularly with Howl instances

3. **React 19.2.0 CVE-2025-55182** ⚠️ [MEGERŐSÍTETT]
   - **Fájl**: `package.json:20-21`
   - **Leírás**: CVE-2025-55182 affecting React 19.2.0 line (RSC-related)
   - **Kockázat**: Low direct impact (no RSC in this project), but should be patched
   - **Lásd**: SEC_AUDIT.md Finding 4.1
   - **Status**: **Fixed** in commit 63dd054 (React bump to 19.2.1)

### Top 3 teljesítmény-bottleneck jelölt (Prompt 3 számára)

1. **Howler Sound Loading Overhead**
   - **Fájl**: `src/hooks/useSound.ts:84-117`
   - **Leírás**: Minden hangfájl lazy-loadolódik első használatkor, ami késleltetést okozhat
   - **Kockázat**: First-time sound playback latency, multiple simultaneous loads

2. **Framer Motion Animációk Túlzott Használata**
   - **Fájlok**: `src/components/Card/CardFlip.tsx`, `src/components/Chip/ChipStack.tsx`, etc.
   - **Leírás**: Sok Framer Motion animáció fut párhuzamosan (kártyák, zsetonok)
   - **Kockázat**: Performance overhead on lower-end devices, battery drain

3. **Nincs Shoe Caching / Memoization**
   - **Fájl**: `src/store/gameHelpers.ts:92-93`
   - **Leírás**: Minden új körnél (`createFreshShoe`) új pacsit hoz létre és kever (6 deck = 312 kártya)
   - **Kockázat**: Unnecessary CPU usage, especially on mobile devices
   - **Javaslat**: Cache the shuffled shoe until reshuffle threshold

---

*Dokumentum generálva: 2025-04-30 | Model: mistral-medium-3.5 | Forrás: /home/tibor/PythonProjects/blackjack*
