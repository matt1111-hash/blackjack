# blackjack — Logika & Architektúra Audit
Dátum: 2025-04-30 | Model: mistral-medium-3.5

---

## 1. Architekturális minta azonosítása

### Azonosított minta: **Clean Architecture + Layered Hybrid**

A projekt **Clean Architecture** elveket követi a domain rétegben, de a presentation rétegben **Layered** megközelítést alkalmaz.

**Nyelv-agnosztikus jelzők:**

| Réteg | Explicit határ | Megvalósítás minősége | Problémák |
|-------|----------------|---------------------|-----------|
| **Domain** (`src/logic/`) | ✅ Nincs import `store/` vagy `components/` felől | Kiváló | Nincs |
| **Application** (`src/store/`) | ⚠️ Parciális - `GameState` interface, de nincsenek explicit portok/adapterek | Jó | Store és helpers keveredik |
| **Infrastructure** | ❌ Nincs explicit infrastructure réteg | Hiányzik | Hangkezelés, animációk a hooks-ban |
| **Presentation** (`src/components/`, `src/hooks/`) | ✅ React komponensek, hooks | Jó | Túlzott Framer Motion függőség |

**Clean Architecture elemek:**
- `logic/` mappa **framework-független**: Tiszta TypeScript, nincs React/HTML függőség
- Domain entitások (`Card`, `Hand`) és üzleti szabályok (`rules.ts`) jól el vannak különítve
- `store/` importál `logic/`-öt, de fordítva nem
- `components/` importál `store/`-t és `hooks/`-ot, de fordítva nem

**Layered Architecture elemek:**
- Rétegek között explicit függőségirány: Presentation → Application → Domain
- Nincs cirkuláris függőség

**Minta töredezése:**
- **Infrastructure réteg hiánya**: Hangkezelés (`useSound.ts`) és animációk (`useGameAnimations.ts`) a presentation rétegben vannak, nem infrastructure-ként kezelve
- **Application réteg keveredése**: `gameStore.ts` és `gameHelpers.ts` együtt kezelik a state-et és a business logic-ot
- **Nincs explicit ports/adapters**: A `logic/` réteg közvetlenül hívódik a `store/` rétegből, nincsenek interfészek

---

## 2. Végrehajtási útvonalak feltérképezése

### Fő use case-ek és futási utak

#### 1. Bet Placement Flow
```
BlackjackTable.tsx:handlePlaceBet → useGameSounds().playChipDrop → 
useGameStore().placeBet → gameStore.ts:placeBet
```
- **Entry point**: User click on ChipSelector
- **Branch**: `balance >= amount` check
- **Side effect**: `balance` és `currentBet` update

#### 2. Deal Flow (Initial)
```
BlackjackTable.tsx:handleDeal → useGameSounds().playDealStart → 
useGameStore().deal → gameStore.ts:deal →
  gameHelpers.dealInitialHands → logic/deck.dealCard (4x) →
  logic/hand.isBlackjack → 
  logic/rules.calculateResults (if BJ) →
  logic/rules.applyPayouts (if BJ)
```
- **Entry point**: User click on DEAL button
- **Branch points**:
  - Dealer shows Ace → `insurance` phase
  - Player BJ, no Dealer BJ → `finished` phase
  - Dealer BJ, no Player BJ → `finished` phase
  - Both BJ → `finished` phase
  - Else → `playing` phase
- **Side effects**: Shoe consumption, balance update

#### 3. Hit Flow
```
BlackjackTable.tsx:handleHit → useGameSounds().playCardPlace → 
useGameStore().hit → gameStore.ts:hit →
  logic/deck.dealCard → logic/hand.isBusted →
  gameHelpers.handleAllHandsDone → logic/rules.dealerPlay → 
  logic/rules.calculateResults → logic/rules.applyPayouts
```
- **Entry point**: User click on HIT button
- **Branch points**:
  - `hand.isStanding || hand.isDoubled` → early return
  - `newHand.isBusted` → auto-advance to next hand or finish
- **Side effects**: Card dealt, hand value updated, phase transition

#### 4. Stand Flow
```
BlackjackTable.tsx:handleStand → useGameStore().stand → 
gameStore.ts:stand → gameHelpers.handleAllHandsDone
```
- **Branch**: If more hands exist → advance to next hand, else run dealer turn

#### 5. Double Down Flow
```
BlackjackTable.tsx:handleDouble → useGameSounds().playChipDrop → 
useGameStore().double → gameStore.ts:double →
  logic/deck.dealCard → logic/hand.isBusted →
  gameHelpers.handleAllHandsDone
```
- **Branch points**:
  - `hand.cards.length !== 2` → invalid
  - `balance < hand.bet` → invalid
  - Auto-stand after double

#### 6. Split Flow
```
BlackjackTable.tsx:handleSplit → useGameStore().split → 
gameStore.ts:split → logic/deck.dealCard (2x)
```
- **Branch points**:
  - `hand.cards.length !== 2` → invalid
  - `card1.rank !== card2.rank` → invalid
  - `balance < hand.bet` → invalid (implicit)
  - Creates 2 new hands, stays on first hand

#### 7. Insurance Flow
```
BlackjackTable.tsx:handleBuyInsurance → useGameStore().buyInsurance → 
gameStore.ts:buyInsurance →
  logic/hand.isBlackjack → gameHelpers.handleAllHandsDone
```
- **Branch points**:
  - Dealer has BJ → payout 3x insurance cost
  - Dealer no BJ → lose insurance cost, continue to playing

#### 8. New Round Flow
```
BlackjackTable.tsx:handleNewRound → useGameStore().newRound → 
gameStore.ts:newRound → gameHelpers.createFreshShoe
```
- **Branch**: Shoe reshuffle if cards remaining < 25% of original (SHOE_DECKS * 52 * 0.25)

### ⚠️ Rétegek megkerülése

#### Rétegkerülés #1: **Sound Manager Singleton**
- **Fájl**: `src/hooks/useSound.ts:38-72`
- **Probléma**: A `soundManager` closure-en keresztül globális singleton, ami **megkerüli a React state management** és a Dependency Injection mechanizmusokat
- **Útvonal**: `BlackjackTable.tsx` → `useGameSounds()` → `useSound()` → `getSoundManager()` → **singleton**
- **Következmény**: Globális állapot, nehezen tesztelhető, nincsen cleanup

#### Rétegkerülés #2: **localStorage Direct Access**
- **Fájl**: `src/store/gameHelpers.ts:74-93`
- **Probléma**: A `getConfiguredShoe()` közvetlenül hozza a shoe-t a `localStorage`-ból, **megkerülve a normál game flow**-t
- **Útvonal**: `createFreshShoe()` → `getConfiguredShoe()` → `window.localStorage`
- **Következmény**: Productionben is használható, biztonsági rések (lásd SEC_AUDIT.md 1.1)

#### Rétegkerülés #3: **Domain Logic in Store**
- **Fájl**: `src/store/gameStore.ts:50-280` (minden action)
- **Probléma**: A `deal`, `hit`, `stand`, `double`, `split` action-ek **üzleti logikát** hordoznak, ami a domain rétegbe tartozna
- **Példa**: Blackjack check, dealer BJ check, insurance logic mind a store actionben van
- **Következmény**: Domain logic duplázódik, nehezen tesztelhető izoláltan

### ⚠️ Eltérő utak ugyanahhoz a célhoz

#### Duplikált Payout Logic
- **Fájlok**: 
  - `src/logic/rules.ts:applyPayouts()` - domain réteg
  - `src/store/gameStore.ts:buyInsurance()` - store réteg (speciális eset)
- **Probléma**: Az insurance payout logic **duplázza** a normál payout mechanizmust
- **Következmény**: Inkonzisztencia riskje, karbantarthatósági nehézségek

#### Kétfajta Card Dealing
- **Fájlok**:
  - `src/logic/deck.ts:dealCard()` - pure function, immutable
  - `src/store/gameStore.ts:hit()` - mutálja a store state-et
- **Probléma**: A `dealCard` pure function, de a store action-ben **direct mutation** történik a hand-on
- **Következmény**: Inkonzisztens state management, nehezen követhető

---

## 3. Strukturális káosz jelei

### Duplikált Orchestration

#### Finding #1: **Párhuzamos Sound Management**
- **Severity:** KÖZEPES
- **Érintett fájlok:** `src/hooks/useSound.ts`, `src/hooks/useGameAnimations.ts`
- **Mi sérül:** Két különböző hook kezel hangokat és animációkat, nincsen központosítva
- **Miért probléma:** Párhuzamos felelősségek, nehezen karbantartható
- **Gyakorlati következmény:** Hangok és animációk szinkronizációja nehéz
- **Minimális irány a rendrakáshoz:** Egyesítsd a sound és animation Hook-okat egy `useGameEffects` hook-ba
- **Bizonyosság:** MEGERŐSÍTETT

### Legacy vs. Modern párhuzamos utak

#### Finding #2: **Singleton Pattern in React Hook**
- **Severity:** MAGAS
- **Érintett fájlok:** `src/hooks/useSound.ts:38-72`
- **Mi sérül:** Singleton sound manager closure-ben, nem React-szerű
- **Miért probléma:** 
  - Globális állapot React alkalmazásban
  - Nincs cleanup (memory leak risk)
  - Nehezen tesztelhető
  - React 18+ StrictMode-ben duplán inicializálódik
- **Gyakorlati következmény:** Memory leak, tesztelhetőség csökken
- **Minimális irány a rendrakáshoz:** Használj React Context-et vagy Redux-ot a sound manager állapot kezelésére
- **Bizonyosság:** MEGERŐSÍTETT

### Compat wrapper-ek

#### Finding #3: **Environment Check Without Full Gate**
- **Severity:** MAGAS
- **Érintett fájlok:** `src/store/gameHelpers.ts:74-93`
- **Mi sérül:** A `getConfiguredShoe()` csak `import.meta.env.VITE_E2E` és `MODE === 'test'` checkkel van gátolva
- **Miért probléma:** Production build-ben is elérhető, ha valaki beállítja a `VITE_E2E` environment változókat
- **Gyakorlati következmény:** Productionben is lehet csapni a localStorage manipulációval
- **Minimális irány a rendrakáshoz:** Távolítsd el a production bundle-ből, vagy használj build-time feature flag-et
- **Bizonyosság:** MEGERŐSÍTETT

### Megkerült publikus API-k

#### Finding #4: **Direct Store Access in Tests**
- **Severity:** ALACSONY
- **Érintett fájlok:** `src/store/gameStore.test.ts`
- **Mi sérül:** A tesztek közvetlenül hozzáférnek a `useGameStore.setState()`-hez, megkerülve a publikus API-t
- **Miért probléma:** Tesztek a belső implementációt tesztelik, nem a publikus interfészt
- **Gyakorlati következmény:** Refactoring után törik a tesztek
- **Minimális irány a rendrakáshoz:** Használj publikus action-öket a tesztekben
- **Bizonyosság:** MEGERŐSÍTETT

### God Object / Tútterhelt Orchestrator

#### Finding #5: **God Store Object**
- **Severity:** KRITIKUS
- **Érintett fájlok:** `src/store/gameStore.ts`
- **Mi sérül:** A `useGameStore` **284 sor**, 10+ action-t kezel, üzleti logikát, state managementet
- **Miért probléma:** 
  - Single Responsibility Principle sérelme
  - Nehezen tesztelhető
  - Nehezen karbantartható
  - Túl sok felelősség egy fájlban
- **Gyakorlati következmény:** Bugok nehezen kereshetők, refactoring kockázatos
- **Minimális irány a rendrakáshoz:** Vagd fel a store-t kisebb slice-okra (balanceSlice, gameSlice, shoeSlice)
- **Bizonyosság:** MEGERŐSÍTETT
- **⚠️ Következmények**: Security (validáció hiánya), Performance (túl nagy re-render površinyok)

### Névben/feladatban félrevezető modulok

#### Finding #6: **gameHelpers.ts - Not Just Helpers**
- **Severity:** KÖZEPES
- **Érintett fájlok:** `src/store/gameHelpers.ts`
- **Mi sérül:** A fájl nevéből helpers-re számítanánk, de valójában **centrális game flow orchestration**
- **Miért probléma:** 
  - `handleAllHandsDone` - orchestration
  - `createFreshShoe` - shoe management
  - `dealInitialHands` - game initialization
- **Gyakorlati következmény:** Névcím és tartalom eltévedése, nehezen értelmezhető
- **Minimális irány a rendrakáshoz:** Nevezd át `gameOrchestrator.ts`-re vagy `gameFlow.ts`-re
- **Bizonyosság:** MEGERŐSÍTETT

#### Finding #7: **useGameAnimations.ts - State Management, Not Just Animations**
- **Severity:** ALACSONY
- **Érintett fájlok:** `src/hooks/useGameAnimations.ts`
- **Mi sérül:** A hook neve animációkra utal, de valójában **game state management** (dealing, revealing, collecting)
- **Miért probléma:** Félrevezető név, valójában game phase tracking
- **Gyakorlati következmény:** Rossz elnevezés miatt nehezen értelmezhető
- **Minimális irány a rendrakáshoz:** Nevezd át `useGamePhase.ts`-re vagy integráld a store-ba
- **Bizonyosság:** MEGERŐSÍTETT

### Ugyanarra a célra több implementáció

#### Finding #8: **Duplikált Card Value Calculation**
- **Severity:** KÖZEPES
- **Érintett fájlok:** 
  - `src/logic/hand.ts:calculateHandValue()`
  - `src/components/Table/DealerArea.tsx:calculateHandValue()` import
  - `src/components/Table/PlayerArea.tsx:calculateHandValue()` import
- **Mi sérül:** A `calculateHandValue` függvény több helyen van importálva és használva
- **Miért probléma:** Nincs centralizált hívás, de ez magában nem probléma, de mutat a domain logic szétosztásának tendenciáját
- **Gyakorlati következmény:** Ha változik a számítási logika, több helyet kell frissíteni
- **Minimális irány a rendrakáshoz:** Hagyjuk a domain rétegben, de biztossuk be, hogy mindenki onnan importál
- **Bizonyosság:** MEGERŐSÍTETT

### Dead but still wired kód

#### Finding #9: **Unused Sound Types**
- **Severity:** ALACSONY
- **Érintett fájlok:** `src/hooks/useSound.ts:1-14`
- **Mi sérül:** `chipWin` sound type definíálva van de nem használva a játékfolyamatokban
- **Miért probléma:** Halott kód, de nem kritikus
- **Gyakorlati következmény:** Nincs funkcionális hatás
- **Minimális irány a rendrakáshoz:** Távolítsd el a nem használt sound type-okat
- **Bizonyosság:** MEGERŐSÍTETT

#### Finding #10: **Empty Assets Folder**
- **Severity:** ALACSONY
- **Érintett fájlok:** `src/assets/sounds/`
- **Mi sérül:** Üres mappa, csak README.md van benne
- **Miért probléma:** Félrevezető, a hangfájlok valójában `public/sounds/`-ban vannak
- **Gyakorlati következmény:** Duplikált struktúra illúziója
- **Minimális irány a rendrakáshoz:** Távolítsd el az üres mappát
- **Bizonyosság:** MEGERŐSÍTETT (Prompt 0 is jelzi)

### Feature flag / config alapján rejtetten eltérő utak

#### Finding #11: **VITE_E2E Environment Flag**
- **Severity:** MAGAS
- **Érintett fájlok:** `src/store/gameHelpers.ts:74-93`
- **Mi sérül:** A `VITE_E2E` flag nem elég biztonságos productionben
- **Miért probléma:** Bármely felhasználó beállíthatja a `blackjack:e2e-shoe` localStorage kulcsot
- **Gyakorlati következmény:** Productionben is lehet manipulálni a játékot
- **Minimális irány a rendrakáshoz:** Használj build-time flag-et vagy távolítsd el production-ből
- **Bizonyosság:** MEGERŐSÍTETT
- **⚠️ Következmények**: Security vulnerability (lásd SEC_AUDIT.md 1.1)

---

## 4. Domain logika integritása

### Domain vs. Infrastructure elválasztás

#### Finding #12: **Domain Logic in Store Actions** ⚠️
- **Severity:** KRITIKUS
- **Érintett fájlok:** `src/store/gameStore.ts` (minden action)
- **Mi sérül:** A domain logika (blackjack szabályok, hand értékelés) **vegyes** a store action-ekkel
- **Példák**:
  - `deal()` action: playerBJ, dealerBJ check
  - `buyInsurance()`: dealer blackjack check, payout calculation
  - `hit()`: isBusted check
- **Miért probléma:** 
  - A domain logic nem izolált
  - Nehezen tesztelhető a domain logic önállóan
  - A store action-ek túl komplexek
- **Gyakorlati következmény:** Bugok nehezen kereshetők, karbantarthatóság romlik
- **Minimális irány a rendrakáshoz:** Mozgass át minden domain logikát a `logic/` mappába
- **Bizonyosság:** MEGERŐSÍTETT

#### Finding #13: **Business Logic in Presentation Layer** ⚠️
- **Severity:** KÖZEPES
- **Érintett fájlok:** 
  - `src/components/Table/DealerArea.tsx:getDealerMood()`
  - `src/components/Table/PlayerArea.tsx:getPlayerMood()`
- **Mi sérül:** Üzleti logika (dealer/player mood magát a komponensben van definiálva)
- **Miért probléma:** Presentation rétegbe tartozik a UI logika, de a mood meghatározása üzleti logika
- **Gyakorlati következmény:** Nehezen tesztelhető, nem againolható
- **Minimális irány a rendrakáshoz:** Mozgass át a mood logikát a domain rétegbe
- **Bizonyosság:** MEGERŐSÍTETT

#### Finding #14: **Infrastructure Logic in Hooks** ⚠️
- **Severity:** KÖZEPES
- **Érintett fájlok:** `src/hooks/useSound.ts`
- **Mi sérül:** Hangkezelés (infrastructure) a presentation rétegben van
- **Miért probléma:** 
  - Howler.js wrapper a hooks-ban
  - Singleton management a hooks-ban
  - Nincs elválasztva az infrastructure a presentation-tól
- **Gyakorlati következmény:** Nehezen cserélhető hanglibrary, tesztelhetőség csökken
- **Minimális irány a rendrakáshoz:** Hozz létre `src/infrastructure/sound/` mappát a hangkezelésre
- **Bizonyosság:** MEGERŐSÍTETT

### Adapters with Business Logic

#### Finding #15: **gameHelpers.ts as Implicit Adapter** ⚠️
- **Severity:** KÖZEPES
- **Érintett fájlok:** `src/store/gameHelpers.ts`
- **Mi sérül:** A `gameHelpers.ts` implicit adapter a `logic/` és `store/` réteg között
- **Miért probléma:** 
  - `dealInitialHands`: használja a `logic/deck.ts` függvényeket, de hozzáadja a Hand objektumok létrehozását
  - `handleAllHandsDone`: orchestration + domain logic hívás
- **Gyakorlati következmény:** A felelősségek keverednek, nehezen érthető
- **Minimális irány a rendrakáshoz:** Tedd explicitte a port/adapter-eket interfészekkel
- **Bizonyosság:** MEGERŐSÍTETT

### Domain Objects with I/O Responsibility

#### Finding #16: **Hand Object Mutability** ⚠️
- **Severity:** ALACSONY
- **Érintett fájlok:** `src/types/index.ts:Hand` interface
- **Mi sérül:** A `Hand` interface tartalmaz mutábilis mezőket (`isDoubled`, `isStanding`, `isBusted`, `isBlackjack`)
- **Miért probléma:** 
  - A domain objektumok immutábilisak kellene lennie
  - A mutációk a store-ban történnek, de a Hand magában hordozza a state-et
- **Gyakorlati következmény:** Inkonzisztens state, nehezen követhető változtatások
- **Minimális irány a rendrakáshoz:** Használj immutábilis domain objektumokat
- **Bizonyosság:** MEGERŐSÍTETT

### Missing Validation / Invariant Violations

#### Finding #17: **No Input Validation in Store Actions** ⚠️
- **Severity:** KRITIKUS
- **Érintett fájlok:** `src/store/gameStore.ts` (minden action)
- **Mi sérül:** **Nincs validáció** a store action-ekben
- **Példák**:
  - `placeBet`: csak `balance >= amount` check, de nincsen `amount > 0` vagy `amount` type check
  - `deal`: nincsen `shoe.length >= 4` check (minimum 4 card kell az initial deal-hez)
  - `hit`: nincsen `shoe.length > 0` check (de `dealCard` visszatér undefined-del)
  - `double`: nincsen `hand.bet <= balance` explicit check (de van a feltételben)
  - `split`: nincsen `balance >= hand.bet` explicit check (de van a feltételben)
- **Miért probléma:** 
  - Silent fail lehet (undefined return)
  - Inkonzisztens state
  - Nehezen debuggolható
- **Gyakorlati következmény:** Runtime errorok, undefined behavior
- **Minimális irány a rendrakáshoz:** Adj hozzá validációt minden store action-hez
- **Bizonyosság:** MEGERŐSÍTETT

#### Finding #18: **No Invariant Enforcement** ⚠️
- **Severity:** MAGAS
- **Érintett fájlok:** `src/store/gameStore.ts`
- **Mi sérül:** Nincsenek **invariáns check-ek** a state változtatások után
- **Példák**:
  - `balance` soha nem lehet negatív (de nincsen check)
  - `currentBet` soha nem lehet negatív
  - `activeHandIndex` soha nem lehet >= `playerHands.length`
  - `phase` csak érvényes értékek lehetnek
- **Miért probléma:** Inkonzisztens state, nehezen debuggolható
- **Gyakorlati következmény:** Validáció hiányában bugok kerülnek a state-be
- **Minimális irány a rendrakáshoz:** Adj hozzá invariant check-eket a state update-ek után
- **Bizonyosság:** MEGERŐSÍTETT

---

## 5. Hibakezelés

### Inkonzisztens hibakezelési stratégia

#### Finding #19: **Silent Failures in Store Actions** ⚠️
- **Severity:** KRITIKUS
- **Érintett fájlok:** `src/store/gameStore.ts` (minden action)
- **Mi sérül:** A store action-ek **csendben elnyelik a hibákat** (nincs error throw, log, vagy user notification)
- **Példák**:
  - `placeBet`: ha `balance < amount`, csendben visszalép
  - `deal`: ha `currentBet === 0`, csendben visszalép
  - `hit`: ha `!hand || hand.isStanding || hand.isDoubled`, csendben visszalép
  - `double`: ha `!hand || hand.cards.length !== 2 || balance < hand.bet`, csendben visszalép
  - `split`: ha `!hand || hand.cards.length !== 2 || card1.rank !== card2.rank`, csendben visszalép
- **Miért probléma:** 
  - User nem kap feedback-et miért nem működik a művelet
  - Nehezen debuggolható
  - Inkonzisztens UI state
- **Gyakorlati következmény:** Rossz user experience, nehezen kereshető bugok
- **Minimális irány a rendrakáshoz:** Dobj exception-t vagy téríts vissza error object-et
- **Bizonyosság:** MEGERŐSÍTETT

#### Finding #20: **Silent Errors in Sound Loading** ⚠️
- **Severity:** KÖZEPES
- **Érintett fájlok:** `src/hooks/useSound.ts:45-58, 78-81`
- **Mi sérül:** Hangfájlok betöltésének hibái **csendben elnyelődnek**
- **Példák**:
  - `onloaderror`: üres callback
  - `onplayerror`: nagyon komplex retry logika
  - `catch` blokkok: üresek
- **Miért probléma:** 
  - Hangok nem játszódnak le, de a user nem tudja miért
  - Nehezen debuggolható
- **Gyakorlati következmény:** Hang nélküli játékélmény, nehezen kereshető problémák
- **Minimális irány a rendrakáshoz:** Logold a hangbetöltési hibákat, adj feedback-et a usernek
- **Bizonyosság:** MEGERŐSÍTETT

### Missing Boundary Checks

#### Finding #21: **No Error Propagation Between Layers** ⚠️
- **Severity:** MAGAS
- **Érintett fájlok:** `src/store/gameStore.ts`, `src/logic/deck.ts`
- **Mi sérül:** A hibák **nem propagálódnak** a rétegek között
- **Példák**:
  - `dealCard`: visszatér `undefined`-del ha üres a shoe, de a hívó oldalon nincsen check
  - `gameStore.ts:hit()`: feltételezi, hogy `dealCard` toujours visszatér card-dal
- **Miért probléma:** 
  - Runtime errorok (cannot read property of undefined)
  - Nehezen debuggolható
- **Gyakorlati következmény:** Crash, undefined behavior
- **Minimális irány a rendrakáshoz:** Propagáld a hibákat, vagy használj Result type-ot
- **Bizonyosság:** MEGERŐSÍTETT

#### Finding #22: **No Error Handling in Howler** ⚠️
- **Severity:** ALACSONY
- **Érintett fájlok:** `src/hooks/useSound.ts`
- **Mi sérül:** Howler hibák (pl. hangfájl nem található) nincsenek kezelve
- **Miért probléma:** Hangok nem játszódnak le, de a játék folytatódik
- **Gyakorlati következmény:** Hang nélküli élmény
- **Minimális irány a rendrakáshoz:** Adj hozzá error handlinget a Howler callbackjeihez
- **Bizonyosság:** MEGERŐSÍTETT

---

## 6. Tesztelhetőség

### Nehezen tesztelhető modulok

#### Finding #23: **Singleton Sound Manager** ⚠️
- **Severity:** MAGAS
- **Érintett fájlok:** `src/hooks/useSound.ts:38-72`
- **Mi sérül:** A singleton **nehezen mockolható**
- **Miért probléma:** 
  - A `soundManager` closure-ben van, nem cserélhető
  - `getSoundManager()` mindíg ugyanazt adja vissza
  - Nincs Dependency Injection
- **Gyakorlati következmény:** **Nincs unit test** a `useSound.ts`-re
- **Minimális irány a rendrakáshoz:** Használj DI-t a sound manager-nek
- **Bizonyosság:** MEGERŐSÍTETT

#### Finding #24: **Global State in Hooks** ⚠️
- **Severity:** MAGAS
- **Érintett fájlok:** `src/hooks/useGameAnimations.ts`
- **Mi sérül:** A hook **React state**-et használ, de a state **globálisan** érhető el a komponensekben
- **Miért probléma:** 
  - Nehezen mockolható
  - Nehezen tesztelhető izoláltan
- **Gyakorlati következmény:** **Nincs unit test** a `useGameAnimations.ts`-re
- **Minimális irány a rendrakáshoz:** Mozgass át a state-t a store-ba
- **Bizonyosság:** MEGERŐSÍTETT

#### Finding #25: **Tight Coupling in Components** ⚠️
- **Severity:** KÖZEPES
- **Érintett fájlok:** `src/components/Table/BlackjackTable.tsx`
- **Mi sérül:** A komponens **tightly coupled** a store-hoz és a hooks-hoz
- **Miért probléma:** 
  - Nehezen mockolható a store
  - Nehezen tesztelhető
- **Gyakorlati következmény:** Csak 1 component test létezik (`BlackjackTable.test.tsx`)
- **Minimális irány a rendrakáshoz:** Használj dependency injection-t a komponensekben
- **Bizonyosság:** MEGERŐSÍTETT

### Dependency Injection hiánya

#### Finding #26: **No DI Container** ⚠️
- **Severity:** KÖZEPES
- **Érintett fájlok:** Egész projekt
- **Mi sérül:** Nincs **Dependency Injection container**
- **Miért probléma:** 
  - Singleton-ok (sound manager)
  - Globális state (zustand store)
  - Tight coupling
- **Gyakorlati következmény:** Nehezen tesztelhető, nehezen cserélhető implementációk
- **Minimális irány a rendrakáshoz:** Vezess be egy DI containert (pl. tsyringe, inversify)
- **Bizonyosság:** MEGERŐSÍTETT

#### Finding #27: **Inconsistent DI Usage** ⚠️
- **Severity:** ALACSONY
- **Érintett fájlok:** `src/store/gameStore.test.ts`
- **Mi sérül:** A tesztek **direct access**-t használnak a store-hoz (`useGameStore.setState()`)
- **Miért probléma:** Nem használják a publikus API-t
- **Gyakorlati következmény:** Tesztek a belső implementációt tesztelik
- **Minimális irány a rendrakáshoz:** Használj publikus action-öket a tesztekben
- **Bizonyosság:** MEGERŐSÍTETT

### Top 3 modult a tesztelhetőség javítása érdekében

| # | Modul | Ok | Javaslat |
|---|-------|----|----------|
| 1 | `src/hooks/useSound.ts` | Singleton, globális állapot, nincsen test | Vezess be DI-t, mockold a Howler-t |
| 2 | `src/hooks/useGameAnimations.ts` | React state, globális access, nincsen test | Mozgass át a store-ba |
| 3 | `src/store/gameStore.ts` | Túl nagy, túl sok felelősség, nehezen mockolható | Vagd fel kisebb slice-okra |

---

## 7. Dependency reality check

### Valódi futási és vezérlési függőségek

#### Centrális modulok (több flow omlik össze nélkülük)

| Modul | Flow-k száma | Kockázat |
|-------|-------------|----------|
| `src/store/gameStore.ts` | 8+ (minden game action) | KRITIKUS |
| `src/logic/deck.ts` | 6+ (deal, hit, split, double) | KRITIKUS |
| `src/logic/hand.ts` | 5+ (hand value calculation) | KRITIKUS |
| `src/logic/rules.ts` | 4+ (dealer play, results, payouts) | KRITIKUS |
| `src/store/gameHelpers.ts` | 3+ (shoe management, orchestration) | MAGAS |

#### Névleg centrális, de kihagyható modulok

| Modul | Miért kihagyható |
|-------|-------------------|
| `src/hooks/useSound.ts` | Hangok nélkül is működik a játék |
| `src/hooks/useGameAnimations.ts` | Animációk nélkül is működik a játék |
| `src/components/UI/SoundSettings.tsx` | Opcionális feature |
| `src/components/UI/InsuranceDialog.tsx` | Insurance nélkül is működik |

### Implicit globális állapot, shared config, singleton, registry

#### Finding #28: **Singleton Sound Manager** ⚠️
- **Severity:** MAGAS
- **Érintett fájlok:** `src/hooks/useSound.ts:38-72`
- **Mechanizmus:** Closure-based singleton
- **Élettartam:** Application lifetime (soha nem takarítódik)
- **Kockázat:** Memory leak, nehezen tesztelhető
- **Bizonyosság:** MEGERŐSÍTETT

#### Finding #29: **Zustand Store as Global State** ⚠️
- **Severity:** KÖZEPES
- **Érintett fájlok:** `src/store/gameStore.ts:24-25`
- **Mechanizmus:** Zustand store (React context-en keresztül)
- **Élettartam:** Application lifetime
- **Kockázat:** Túl nagy store, nehezen mockolható
- **Bizonyosság:** MEGERŐSÍTETT

#### Finding #30: **localStorage as Shared Config** ⚠️
- **Severity:** KRITIKUS
- **Érintett fájlok:** `src/store/gameHelpers.ts:74-93`
- **Mechanizmus:** `window.localStorage` direct access
- **Élettartam:** Browser session
- **Kockázat:** Productionben is használható, biztonsági rések
- **Bizonyosság:** MEGERŐSÍTETT
- **⚠️ Következmények**: Security vulnerability

#### Finding #31: **Environment Variables** ⚠️
- **Severity:** MAGAS
- **Érintett fájlok:** `src/store/gameHelpers.ts:76`
- **Mechanizmus:** `import.meta.env.VITE_E2E`, `import.meta.env.MODE`
- **Élettartam:** Build time + runtime
- **Kockázat:** Environment változók manipulálhatók build time-ban
- **Bizonyosság:** MEGERŐSÍTETT

### Cyclic dependency minták

#### Finding #32: **No Circular Dependencies** ✅
- **Severity:** N/A
- **Érintett fájlok:** Egész projekt
- **Bizonyosság:** MEGERŐSÍTETT (Prompt 0 is megerősíti)
- **Ok:** Clean Architecture-konform: `logic/` → `store/` → `components/` → `hooks/`

### Dependency Graph anomáliák

#### Finding #33: **Tight Coupling Between Store and Logic** ⚠️
- **Severity:** KÖZEPES
- **Érintett fájlok:** `src/store/gameStore.ts` importál `src/logic/*`
- **Mi sérül:** A store **directly importálja** a logic függvényeket
- **Miért probléma:** 
  - A domain logic nem cserélhető
  - Tight coupling
- **Gyakorlati következmény:** Nehezen mockolható a domain logic
- **Minimális irány a rendrakáshoz:** Használj dependency injection-t a logic függvényeknek
- **Bizonyosság:** MEGERŐSÍTETT

#### Finding #34: **Component Direct Store Access** ⚠️
- **Severity:** ALACSONY
- **Érintett fájlok:** `src/components/Table/BlackjackTable.tsx`, más komponensek
- **Mi sérül:** A komponensek **directly access**-elik a store-t (`useGameStore()`)
- **Miért probléma:** 
  - Nehezen mockolható
  - Tight coupling
- **Gyakorlati következmény:** Nehezen tesztelhető komponensek
- **Minimális irány a rendrakáshoz:** Használj props-okat a store state átadására
- **Bizonyosság:** MEGERŐSÍTETT

---

## 8. Executive summary

### Legfontosabb strukturális megfigyelések (20 pont)

1. **Clean Architecture töredezett**: A domain réteg (`logic/`) jól el van különítve, de az application és infrastructure rétegek keverednek
2. **God Store Object**: A `gameStore.ts` (284 sor) túl sok felelősséget hordoz - state management, business logic, orchestration
3. **Singleton Pattern in React**: A `useSound.ts` closure-based singletonja megkerüli a React state managementet
4. **Domain Logic in Store**: Az üzleti logika a store action-ekben van, nem a domain rétegben
5. **Silent Failures**: A store action-ek csendben elnyelik a hibákat, nincsen error propagation
6. **No Input Validation**: A store action-ekben nincsen validáció, invariant check-ek
7. **Tight Coupling**: Komponensek, hooks, store directly access-elik egymást
8. **Missing Infrastructure Layer**: Hangkezelés, animációk a presentation rétegben vannak
9. **Security Risk**: localStorage shoe override productionben is elérhető
10. **No Dependency Injection**: Nincs DI container, nehezen mockolható, cserélhető
11. **Unnamed Architecture**: Nincs explicit port/adapter definíció
12. **Testability Issues**: Singleton-ok, globális state miatt nehezen tesztelhető
13. **Feature Flag Risk**: VITE_E2E flag nem elég biztonságos productionben
14. **No Error Handling**: Hibák csendben elnyelődnek, nincsen user feedback
15. **Duplicate Responsibilities**: Payout logic, card dealing logic duplázódik
16. **Missing Abstractions**: Nincsenek interfészek a domain és application réteg között
17. **State Mutability**: Domain objektumok mutábilisak, nem immutábilisak
18. **No Centralized Configuration**: Shoe size, initial balance, etc. szét van szórva
19. **Inconsistent Naming**: `gameHelpers.ts` valójában orchestration, nem helpers
20. **Tech Debt Accumulation**: A fenti problémák együtt veszélyeztetik a projekt karbantarthatóságát

### A fő ok, hogy a projekt "szétcsúszottnak" érződik:

**A projectszerkezet NEM követi konzekvensen SEMMILYEN explicit architekturális mintát.**

A problémák gyökere:
1. **Nincs explicit réteghatár**: Nincsenek interfészek, portok, adapterek a rétegek között
2. **Nincs Single Responsibility**: A store mindent csinál - state management, business logic, orchestration
3. **Nincs Dependency Injection**: Singleton-ok, globális state, direct access mindent nehezített
4. **Nincs Error Handling Strategy**: Csendes hibakezelés, nincsen error propagation
5. **Nincs Validation**: Input validáció, invariant check-ek hiánya

Ez a kombináció vezet ahhoz, hogy a kód **nehezen érthető, nehezen karbantartható, nehezen tesztelhető** lesz.

---

## 9. Refactor priority list (Top 10)

| # | Lépés | Várható haszon | Kockázat | Előfeltételek |
|---|-------|----------------|----------|---------------|
| 1 | **Vagd fel a gameStore-t kisebb slice-okra** (balanceSlice, gameSlice, shoeSlice) | Csökkenti a komplexitást, javítja a tesztelhetőséget | Alacsony (backward compatible) | Nincs |
| 2 | **Mozgass át a domain logic-ot a store-ból a logic/ mappába** | Elválasztja a domain-t az application-tól | Közepes (refactor Reisisk) | #1 |
| 3 | **Vezess be Dependency Injection-t a sound manager-nek** | Tesztelhetővé teszi a hangkezelést | Alacsony | Nincs |
| 4 | **Távolítsd el/tiltod be a localStorage shoe override-ot productionben** | Biztonsági rések bezárása | Alacsony | Security audit |
| 5 | **Adj hozzá input validációt és invariant check-eket** | Megakadályozza az inkonzisztens state-eket | Alacsony | Nincs |
| 6 | **Vezess be explicit error handlinget és propagationt** | Jobb user experience, könnyebb debug | Közepes | Nincs |
| 7 | **Hozz létre infrastructure réteget** (sound, animation) | Elválasztja az infrastructure-t | Közepes | Nincs |
| 8 | **Használj immutábilis domain objektumokat** | Megakadályozza a state mutációt | Közepes | #2 |
| 9 | **Nevezd át/fel a félrevezető modulokat** (gameHelpers → gameOrchestrator) | Jobb olvashatóság | Alacsony | Nincs |
| 10 | **Vezess be interfészeket a rétegek között** | Explicit port/adapter definíciók | Közepes | #2, #7 |

---

*Dokumentum generálva: 2025-04-30 | Model: mistral-medium-3.5 | Forrás: /home/tibor/PythonProjects/blackjack*
