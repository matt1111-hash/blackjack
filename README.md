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
