# Harold's Blackjack Casino

Frontend blackjack játék Vite + React + TypeScript stacken.

## Stack

- Vite
- React 19
- TypeScript
- Zustand
- Vitest

## Fejlesztés

```bash
npm install
npm run dev
```

## Ellenőrzés

```bash
npm test -- --run
npm run build
```

## Desktop indítás

```bash
./scripts/launch_desktop.sh
```

## Fontos fájlok

- `src/store/gameStore.ts`: játékállapot és akciók
- `src/logic/`: blackjack szabályok, pakli- és kézlogika
- `src/App.tsx`: fő felület
- `BLACKJACK_PROJECT.md`: részletes projektvízió és scope

## Attribútumok

| Asset | Forrás | Licenc |
|-------|--------|--------|
| Hangok (card-place, card-slide, chip-\*, win, lose, blackjack, deal-start, button-click) | [Kenney Casino Pack](https://opengameart.org/content/54-casino-sound-effects-cards-dice-chips) | CC0 |
| Kártya SVG-k | nyilvános card deck asset-ek | használat a projekt keretében |

A felhasznált assetek licencletehetőségét lásd: `src/assets/sounds/README.md`
