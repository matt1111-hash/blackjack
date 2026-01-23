# Harold's Blackjack Casino

## Projekt Vízió

**Cél:** Egyéni, profi minőségű blackjack játék fejlesztése - a Blackjackist iPad app szenzorikus élményét megközelítve, de saját technológiai stacken.

**Fő motiváció:** 
- A 2026-os frontend stack (Vite + React 19 + TypeScript + Zustand + Tailwind) elsajátítása valós projekten
- "Ott vagyok a casinóban" érzés: kártyák suhogása, zsetoncsörgés, profi grafika
- Csak játékpénz - szórakozás, nem gambling

**Referencia app:** [Blackjack 21: Blackjackist](https://apps.apple.com/cz/app/blackjack-21-blackjackist/id959038492) by KamaGames

---

## Scope Definition

### MVP (2-3 hét)
- [ ] 1 játékos vs dealer
- [ ] Alap szabályok: hit, stand, double down, split
- [ ] 6 vagy 8 paklis shoe
- [ ] Dealer stands on soft 17
- [ ] Szép 3D-hatású asztal (CSS perspective)
- [ ] Kártya flip animáció hanggal
- [ ] Zseton animációk hanggal
- [ ] LocalStorage: egyenleg megőrzése

### Bővített (később, opcionális)
- [ ] Side betek (Insurance, Perfect Pairs)
- [ ] Basic Strategy Trainer mód
- [ ] Statisztikák (winning streak, session history)
- [ ] Több asztal stílus választás
- [ ] Surrender opció

### Nem cél (out of scope)
- Multiplayer
- Valódi pénz
- Backend/szerver
- Mobile app (web-first, responsive elég)

---

## Tech Stack

```
Frontend:
├── Vite (build tool)
├── React 19 (UI)
├── TypeScript (type safety)
├── Zustand (state management - game state, balance, settings)
├── Tailwind CSS (styling)
├── Framer Motion (animációk: card flip, chip slide)
└── Vitest (unit tesztek - blackjack logic)

Opcionális:
├── Howler.js VAGY use-sound (hang kezelés)
└── shadcn/ui (UI komponensek, ha kellenek)
```

---

## Vizuális Koncepció

**Stílus:** Vegas Classic
- Zöld filc asztal textúra
- Meleg, aranyló világítás érzet
- Ferde nézet (CSS perspective) - "ott ülsz az asztalnál"
- Elegáns, nem túl flashy

**Kártyák:**
- Klasszikus francia kártya design
- 3D flip animáció osztáskor (backface → face)
- Smooth slide pozícióba

**Zsetonok:**
- Realisztikus casino chip look
- Stack animáció tétrakáskor
- Kattogó hang egymásra rakáskor

**Hangok (kritikus!):**
- Kártya csúszás/suhogás
- Kártya lerakás (soft thud)
- Zseton koppanás
- Zseton stack (több hang gyors egymásutánban)
- Opcionális: halk casino ambience háttér

---

## Asset Források

### Hangok (ingyenes, jogdíjmentes)

| Forrás | Tartalom | Licensz |
|--------|----------|---------|
| [Kenney.nl Casino Pack](https://opengameart.org/content/54-casino-sound-effects-cards-dice-chips) | 54 hang: kártya, zseton, kocka | CC0 |
| [Mixkit Casino](https://mixkit.co/free-sound-effects/casino/) | 36 casino hang | Free |
| [Pixabay Casino](https://pixabay.com/sound-effects/search/casino/) | Vegyes | Free |

### Kártyák (grafika)

| Forrás | Stílus | Licensz |
|--------|--------|---------|
| [htdebeer/SVG-cards](https://github.com/htdebeer/SVG-cards) | Klasszikus francia, SVG+PNG | LGPL |
| [Kenney Playing Cards](https://kenney.nl/assets/playing-cards-pack) | Pixel art | CC0 |
| [saulspatz/SVGCards](https://github.com/saulspatz/SVGCards) | Jumbo index | Public Domain |

### Zsetonok & UI

| Forrás | Tartalom |
|--------|----------|
| [Vecteezy Poker Chips](https://www.vecteezy.com/free-vector/poker-chip) | 13,000+ vektor |
| [Flaticon Casino Chip](https://www.flaticon.com/free-icons/casino-chip) | 4,300+ ikon |
| [itch.io Poker Assets](https://itch.io/game-assets/tag-poker) | Vegyes packek |

---

## Architektúra Vázlat

```
src/
├── components/
│   ├── Card/
│   │   ├── Card.tsx           # Egyetlen kártya renderelése
│   │   ├── CardFlip.tsx       # Flip animáció wrapper
│   │   └── Hand.tsx           # Kézben lévő kártyák
│   ├── Chip/
│   │   ├── Chip.tsx           # Egyetlen zseton
│   │   └── ChipStack.tsx      # Zseton halom animációval
│   ├── Table/
│   │   ├── BlackjackTable.tsx # Fő játék felület
│   │   ├── BettingArea.tsx    # Tét elhelyezés
│   │   └── DealerArea.tsx     # Dealer kártyái
│   └── UI/
│       ├── Balance.tsx        # Egyenleg kijelző
│       ├── ActionButtons.tsx  # Hit/Stand/Double/Split
│       └── GameResult.tsx     # Win/Lose/Push overlay
├── store/
│   └── gameStore.ts           # Zustand store
├── hooks/
│   ├── useSound.ts            # Hang lejátszás
│   └── useBlackjack.ts        # Játék logika hook
├── logic/
│   ├── deck.ts                # Pakli kezelés, keverés
│   ├── hand.ts                # Kéz értékelés
│   ├── rules.ts               # Blackjack szabályok
│   └── basicStrategy.ts       # (később) Optimális lépés kalkulátor
├── types/
│   └── index.ts               # TypeScript típusok
├── assets/
│   ├── sounds/                # Hang fájlok
│   ├── cards/                 # Kártya képek
│   └── chips/                 # Zseton képek
└── App.tsx
```

---

## Zustand Store Struktúra

```typescript
interface GameState {
  // Pénz
  balance: number;
  currentBet: number;
  
  // Pakli
  shoe: Card[];
  
  // Kezek
  playerHands: Hand[];      // Split esetén több kéz
  activeHandIndex: number;
  dealerHand: Hand;
  
  // Játék fázis
  phase: 'betting' | 'playing' | 'dealerTurn' | 'finished';
  
  // Eredmény
  results: ('win' | 'lose' | 'push' | 'blackjack')[];
  
  // Actions
  placeBet: (amount: number) => void;
  deal: () => void;
  hit: () => void;
  stand: () => void;
  double: () => void;
  split: () => void;
  newRound: () => void;
}
```

---

## Animáció Terv

### Kártya Osztás Szekvencia
1. Kártya megjelenik a shoe-nál (face down)
2. Slide animáció a célpozícióba (300ms, ease-out)
3. Ha face-up kell: flip animáció (200ms)
4. Hang: slide közben "whoosh", lerakáskor "thud"

### Zseton Tét Szekvencia
1. Chip kiválasztás click
2. Chip "repül" a betting area-ra (arc motion, 250ms)
3. Stack-re érkezéskor "koppanás" hang
4. Több chip: staggered animation (50ms késleltetés)

### Dealer Reveal
1. Második kártya face-down volt
2. Játékos stand után: flip animáció
3. Dealer húz: ugyanaz mint játékos osztás

---

## Fejlesztési Fázisok

### Fázis 1: Alap Infrastruktúra (3-4 nap)
- [ ] Vite + React 19 + TS projekt setup
- [ ] Zustand store alapok
- [ ] Típus definíciók
- [ ] Deck logic + unit tesztek

### Fázis 2: Statikus UI (3-4 nap)
- [ ] Asztal layout (CSS perspective)
- [ ] Kártya komponens (még animáció nélkül)
- [ ] Zseton komponens
- [ ] Alapvető elrendezés

### Fázis 3: Játék Logika (3-4 nap)
- [ ] Osztás flow
- [ ] Hit/Stand/Double/Split logika
- [ ] Dealer AI (soft 17 stand)
- [ ] Nyerés/vesztés kalkuláció
- [ ] Kifizetések

### Fázis 4: Animációk (4-5 nap)
- [ ] Framer Motion integráció
- [ ] Kártya flip
- [ ] Kártya slide
- [ ] Zseton animációk
- [ ] Timing finomhangolás

### Fázis 5: Hangok (2-3 nap)
- [ ] Howler.js / use-sound setup
- [ ] Hang fájlok integrálása
- [ ] Animációkkal szinkronizálás
- [ ] Hangerő szabályozás

### Fázis 6: Polish (2-3 nap)
- [ ] LocalStorage persistence
- [ ] Responsive design
- [ ] Edge case-ek kezelése
- [ ] Performance optimalizálás

---

## Blackjack Szabályok (implementálandó)

**Alap:**
- Blackjack pays 3:2
- Dealer stands on soft 17
- Double down bármilyen 2 kártyára
- Split azonos értékű kártyákra (max 1 split kezdetben)
- No surrender (MVP-ben)
- No insurance (MVP-ben)

**Shoe:**
- 6 pakli
- Penetration: ~75% (új shoe kb. 1.5 pakli maradékánál)

---

## Megjegyzések

- **Clean Architecture szemlélet:** A logic/ mappa tisztán TypeScript, React-független - könnyen tesztelhető
- **Animáció-first:** Az élmény kulcsa a timing és a hangok - ne spóroljunk ezen
- **Progresszív fejlesztés:** Először működjön, aztán legyen szép, aztán legyen hangos

---

*Dokumentum verzió: 1.0*
*Utolsó frissítés: 2026-01-23*
