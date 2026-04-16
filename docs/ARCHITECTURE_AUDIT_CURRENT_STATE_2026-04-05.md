# Architecture Audit: Current State Analysis Report
## Blackjack Casino Game - Repository Complexity Assessment
**Repository:** `/home/tibor/PythonProjects/blackjack`
**Analysis Date:** 2026-04-05
**Git Status:** refactor branch, files deleted: GEMINI.md, KIMI.md
**Branch Context:** Recent features include CI/CD enhancements, E2E testing, and desktop launcher integration

---

## 📋 EXECUTIVE SUMMARY

### 🎯 Key Structural Observations (Top 20 Findings)

1. **Architecture Violation: Zustand Store as God Object**
   - `gameStore.ts` (284 LOC) contains BOTH business logic AND state management
   - Violates Clean Architecture by mixing domain rules with storage mechanics
   - Single store handles: game phase transitions, betting logic, player actions, shoe management, and payout calculations

2. **Critical: Duplicate Domain Models**
   - **RoundResult interface** exists in TWO places:
     - `src/logic/rules.ts:6-10` (primary implementation)
     - `src/store/gameHelpers.ts:13-17` (duplicated for store usage)
   - **GamePhase type** duplicated across multiple files
   - **Card/Ha/Hand interfaces** scattered across at least 3 location files

3. **High: Logic Scattering Across Multiple Locations**
   - Game rules logic split across 3+ locations:
     - `logic/rules.ts` - core game logic
     - `store/gameStore.ts` - action dispatchers and orchestration
     - `store/gameHelpers.ts` - helper functions for state transitions
     - Components directly import domain logic for rendering decisions

4. **Medium: Inconsistent State Management Pattern**
   - Zustand store maintains game state
   - Local component state (`PlayerArea.tsx`, `BlackjackTable.tsx`) mirrors store state
   - Race conditions possible when both streams update simultaneously

5. **High: Hidden Business Logic in Store Setters**
   - `buyInsurance()`, `declineInsurance()`, `newRound()` setters in store contain complex business logic
   - Breaks React rendering purity expectations
   - Makes component re-use nearly impossible

6. **Medium: Test Infrastructure as Primary Entry Point**
   - Vitest test files (`*.test.ts`) heavily used during development
   - Playwright E2E tests configuration-heavy
   - Node scripts (`scripts/launch_desktop.sh`) build heavy ceremony

7. **Low: Asset Management Complexity**
   - Sound effects via `useSound.ts` hook
   - Animation system via `useGameAnimations.ts`
   - CSS-in-JS patterns with Tailwind + inline styles

8. **Medium: No Clear Layer Boundaries**
   - Domain layer (`logic/`) not isolated from presentation
   - Store imports directly from business logic files
   - Components trigger state changes that have side effects

9. **High: State Transition Logic Leaks**
   - Multiple entry points to same state transitions:
     - Direct store calls from UI buttons
     - Implicit transition via component effects
   - No central state transition router

10. **Medium: Implicit Global State**
    - Zustand store is global singleton
    - No dependency injection for domain services
    - Environment-based configuration (`localStorage`, `gameHelpers.ts` shoe management)

### 🚨 Main Root Causes of "Szétcsúszás" Perception

1. **Evolutionary Pressure** - Code grew from simple to complex without refactoring
2. **School Project Mentality** - Rapid iteration without architectural discipline
3. **Framework Limitations** - Zustand encourages single store, leading to God Object pattern
4. **TypeScript Deception** - Interfaces duplicated across files giving false sense of structure
5. **React Abstraction Failure** - UI components became state machines instead of dumb view renderers

### 🔍 Key Success Patterns (Keep These)

1. Logic functions separated from rendering (logic/ vs components/)
2. Zustand for global state management (albeit overloaded)
3. TypeScript for type safety
4. Vitest for domain logic testing
5. E2E tests for game flows

---

## 🗂️ ENTRY POINT INVENTORY

### 1. Primary Application Entry Point

**File:** `src/main.tsx` (5 LOC)
```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**Role:** React application bootstrap
**Flows Started:** Single React render pipeline
**Status:** Canonical ✅

**Canonical Path:** Browser `index.html` → `main.tsx` → `App.tsx` → `BlackjackTable.tsx`

### 2. React Application Root

**File:** `src/App.tsx` (7 LOC)
```typescript
import { BlackjackTable } from './components/Table/BlackjackTable';

function App() {
  return <BlackjackTable />;
}

export default App;
```

**Role:** Container component bootstrap
**Flows Started:** UI rendering pipeline
**Status:** Canonical ✅ Simple and appropriate

### 3. Game Orchestration Entry - BlackjackTable

**File:** `src/components/Table/BlackjackTable.tsx` (200 LOC)
**Structure:** Presentation + orchestration hybrid

```typescript
export function BlackjackTable() {
  const {
    balance, currentBet, dealerHand, playerHands,
    placeBet, deal, hit, stand, double, split,
    buyInsurance, declineInsurance, newRound,
  } = useGameStore();
  
  // Direct orchestration of game flow
  const handleDeal = () => {
    playDealStart();
    playButtonClick();
    deal();  // ⚠️ Direct store call
  };
  
  const handleHit = () => {
    playCardPlace();
    playButtonClick();
    hit();  // ⚠️ Direct store call
  };
}
```

**Role:** Central game controller UI component
**Flows Started:**
- Betting phase orchestration
- Game action flow (hit/stand/double/split)
- Sound management integration
- Visual state transitions

**Status:** **High Risk ⚠️ Canonical but problematic**
- Components should be dumb views
- Contains orchestration logic that belongs in store
- Has callbacks that directly trigger store mutations

**Code Smell Indicators:**
- 200 LOC component with complex mapping
- Direct import and usage of store actions
- Sound effect orchestration inline
- Event handler:/event effect coordination

### 4. Zustand Store Entry Point

**File:** `src/store/gameStore.ts` (284 LOC)

**Role:** Central state management container
**Flows Actually Orchestrated:**
- All game phases (betting, playing, insurance, dealerTurn, finished)
- All player actions (hit, stand, double, split, insurance)
- Shoe management and reshuffling
- Balance tracking
- Round result calculation

**Status:** **CRITICAL: This is the actual application entry point** ❌

**Entrypoint Analysis:**
```
Browser (start) → main.tsx → App.tsx 
                   ↓
      → BlackjackTable.tsx components ←→ 
                   ↓
          → useGameStore() hook ←→ 
                   ↓
      → gameStore.ts (the real orchestration)
                   ↓
      → src/logic/*.ts (business logic)
```

### 5. E2E Test Entry via Playwright

**File:** `e2e/game-flow.spec.ts`
**Configuration:** `playwright.config.ts`

**Role:** Automated acceptance testing
**Flows Tested:**
- Game completion scenarios
- Win/loss outcomes
- Shoe management
- Insurance flow

**Status:** Canonical for test automation ✅
- Well-configured tests
- Configurable shoe via localStorage
- Tests actual game logic

### 6. Desktop Launcher Script

**File:** `scripts/launch_desktop.sh`
**Dependencies:** Node.js, npm, xdg-open, zenity (for errors)

**Role:** Production distribution wrapper
**Flows:**
1. Check dependencies
2. Build production assets
3. Launch browser-based preview
4. Open default browser

**Status:** Canonical for distribution ✅
- Proper error handling
- Configuration via environment
- Writes build logs

### 7. Quality Gate CLI Entrypoints

**Files:**
- `quality_gate.sh` (CI/CD quality checker)
- `code-health-toolkit-v4/*` (import linter, quality checks)
- `.github/workflows/ci.yml` (GitHub Actions)

**Role:** Development workflow enforcement
**Flows:**
- CI/CD pipeline execution
- Code health validation
- Import sorting
- Type checking

**Status:** Canonical for development ✅

### 🗂️ Summary Table: Entry Points by Type

| Entrypoint Type | File Path | Canonical | Risk Level | Description |
|----------------|-----------|-----------|------------|-------------|
| App Bootstrap | src/main.tsx | ✅ Yes | Low | React DOM initialization |
| React Root | src/App.tsx | ✅ Yes | Low | Component tree root |
| UI Controller | src/components/Table/BlackjackTable.tsx | ⚠️ Hybrid | HIGH | Contains orchestration logic |
| State Orchestrator | src/store/gameStore.ts | ❌ Hidden | CRITICAL | The real application entry |
| Test Runner | e2e/game-flow.spec.ts | ✅ Yes | Low | E2E game flow verification |
| CLI Launcher | scripts/launch_desktop.sh | ✅ Yes | Low | Desktop distribution |
| CI/CD | .github/workflows/ci.yml | ✅ Yes | Low | Quality enforcement |
| Dev Quality | quality_gate.sh | ✅ Yes | Low | Development workflow |

**🚨 CRITICAL INSIGHT:** 
The `gameStore.ts` file IS the application entry point in practice, containing business logic orchestration that should exist in dedicated service layers or domain modules.

---

## 🌉 MAIN FLOW MAPS

### Flow 1: User Betting Round

```
Starting Point: Browser URL → /index.html
                     ↓
         BlackjackTable.tsx renders
                     ↓
{ phase: 'betting', currentBet: 0, balance: 5000 }
                     ↓
User clicks chip → placeBet(amount) called
                     ↓
  state.balance -= amount, state.currentBet += amount
                     ↓
User clicks DEAL → handleDeal() in BlackjackTable.tsx
                     ↓
  playDealStart(), playButtonClick() sounds
                     ↓
  store.deal() called (stored as separate function)
                     ↓
      gameStore.ts:deal() executes:
      ├─ Checks currentBet validity
      ├─ Calls gameHelpers.dealInitialHands(shoe, currentBet)
      ├─ Creates playerHand with initialBet
      ├─ Creates dealerHand
      ├─ Checks dealerAce + insurance logic
      ├─ Checks playerBJ vs dealerBJ
      ├─ Sets newPhase: 'insurance', 'playing', or 'finished'
      └─ Updates store state
                     ↓
Result: New state: playerHands, dealerHand, newPhase
                     ↓
BlackjackTable.tsx re-renders → switches to deal view
```

**📍 Key Architecture Violations in Flow 1:**
- ✅ `dealInitialHands()` correctly separated in gameHelpers
- ❌ BlackjackTable.tsx directly calls `store.deal()` as UI handler
- ✅ `deal()` method in store contains complex state logic
- ❌ Business rules intertwined with state management

### Flow 2: Player Action During Game

```
Starting Point: Player on 'playing' phase
                     ↓
User clicks HIT → handleHit() in BlackjackTable.tsx
                     ↓
  playCardPlace(), playButtonClick() fires
                     ↓
  store.hit() called
                     ↓
      gameStore.ts:hit() executes:
      ├─ gets shoe, playerHands, activeHandIndex, dealerHand, balance
      ├─ calls deck.ts:dealCard(shoe, true)
      ├─ creates newHand with additional card
      ├─ checks isBusted → triggers allHandsDone handler
      ├─ EITHER:
      │   └─ nextIndex exists → set state with new shoe, playerHands
      │   └─ allHands done → calls handleAllHandsDone()
      └─ store setState mutation
                     ↓
Result: Updated state → game phase transitions or finish
                     ↓
UI re-renders → shows updated hands
```

**📍 Architecture Issues Flow 2:**
- ❌ `store.hit()` method contains game loop logic
- ✅ `deck.ts` delegate for card dealing (correct abstraction)
- ❌ No domain layer separation between action and outcome
- ❌ Mutation logic in store setter (breaks Redux principles)
- ❌ Side effects in store methods (illegal state transitions)

### Flow 3: Round Completion

```
Starting Point: All player hands completed
                     ↓
  store calls handleAllHandsDone(dealerHand, shoe, playerHands, balance)
                     ↓
    gameStore.ts:handleAllHandsDone() (shared between multiple actions)
    ├─ dealerPlay() from rules.ts
    │   ├─ reveals dealer's hole card
    │   ├─ dealer draws until >= 17
    │   └─ updates dealerHand state
    ├─ calculateResults() from rules.ts
    │   ├─ evaluates each hand vs dealer
    │   └─ returns RoundResult[]
    └─ applyPayouts() from rules.ts
        ├─ updates balance
        └─ returns new balance
                     ↓
  Final state: phase='finished', roundResults=[...], balance=updated
  BlackjackTable.tsx renders GameResult overlay
  Animation plays based on results
```

**📍 Critical Path:**
- ✅ `rules.ts` handles pure game logic (CORRECT)
- ❌ `handleAllHandsDone()` exists in two places:
  - `src/store/gameHelpers.ts:123-141`
  - `src/store/gameStore.ts:163-180, 175-179` (duplicated inline)
- ✅ Calculations are pure functions
- ❌ State orchestration in store is imperative and imperative

### Flow 4: Insurance Sub-Flow

```
Starting Point: dealer shows Ace during deal
                     ↓
  gameStore.deal() detects dealerAce + checks balance
                     ↓
  Sets phase = 'insurance'
                     ↓
BlackjackTable.tsx shows InsuranceDialog
                     ↓
User clicks Buy or Decline → store.buyInsurance/declineInsurance
                     ↓
  gameStore.ts methods contain business rules YET AGAIN
  - Checks dealerBusted or playerBusted
  - Directly calls handleAllHandsDone (same duplication)
  - Updates phase to 'playing' or 'finished'
```

**📍 Insurance Architecture Issues:**
- ✅ Insurance phase UI component (dumb) ✅
- ❌ Insurance business logic in two store methods
- ❌ Logic duplicated with main round completion
- ❌ No separate insurance domain service

### Flow 5: New Round Reset

```
Starting Point: phase='finished', user clicks NEW ROUND
                     ↓
  BlackjackTable handles NEW ROUND button
                     ↠
  store.newRound() called
                     ↓
    gameStore.ts:newRound()
    ├─ Checks shoe penetration (< 25% remaining)
    │   ├─ Reshuffles if needed
    │   └─ Otherwise uses existing shoe
    ├─ Resets all game state:
    │   ├─ playerHands = []
    │   ├─ dealerHand = createHand(0)
    │   ├─ phase = 'betting'
    │   ├─ balances: currentBet = 0
    │   └─ roundResults = null
    └─ Updates store
                     ↓
  UI shows betting area again
```

**📍 Reset Path Issues:**
- ✅ Shoe reshuffle logic separated ✅
- ❌ Game state reset logic in store setter
- ❌ No domain "round