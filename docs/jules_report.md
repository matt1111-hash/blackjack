# Blackjack Statikus Analízis Jelentés

A repó átfogó vizsgálata alapján az alábbi audit eredmények születtek. Kódmódosítás nem történt, az észrevételek szigorúan az állapot felmérésére korlátozódnak.

---

## 1. Architektúra

A projekt a Clean Architecture bizonyos elveit követi (szétválasztott UI/Presentation `components`, Application/State `store`, és Domain `logic` rétegek), de található néhány kisebb áthallás.

**Tünetek / Észrevételek:**
* A `src/components/Table/DealerArea.tsx` és `src/components/Table/PlayerArea.tsx` közvetlenül importálja és használja a `calculateHandValue` függvényt a `src/logic/hand.ts`-ből a UI-os megjelenítéshez. Hasonlóan, a `GameResult.tsx` a `src/logic/rules.ts`-ből szed típust.
* A React tesztek (pl. `BlackjackTable.test.tsx`) közvetlenül használnak logikai függvényeket.

**Gyökér ok:**
* A számított értékeket (mint a kéz értéke) a komponensek közvetlenül végzik ahelyett, hogy a `gameStore.ts` szolgáltatná ezeket az adatokat származtatott (derived) állapotként.

**Javaslat:**
* A `Zustand` store (vagy dedikált selector-ok) feleljenek az ilyen adatok előállításáért, a komponensek pedig csak az értékeket olvassák ki, teljesen izolálva őket a domain logikától (`src/logic`).

---

## 2. Dependency fa és verziókövetkezetesség

Az `npm ls` parancs lefutott, a függőségi fát felmértük. Nincs jele durva verzióütközésnek, deduplikációs problémának. A `package.json` rendben van, az `npm install` és a `bun install` megfelelően lefutott. Viszont az ellenőrzés rávilágított nem használt dev dependency-kre.

**Tünet:**
* A `knip` jelentése szerint a következő devDependencies nem használtak:
  * `@tailwindcss/postcss`
  * `eslint-plugin-react-refresh`
  * `globals`
  * `postcss`

**Javaslat:**
* Távolítsuk el ezeket a csomagokat a `package.json`-ból.

---

## 3. Tesztek és coverage

A `vitest --coverage` lefutott (100% közelében a `src/logic` és magas a többire is).

**Tünetek / Észrevételek:**
* Az alábbi komponensek nem rendelkeznek 100%-os teszt lefedettséggel a `src/components/` és `src/store/` alatt, beleértve a teljesen fedetlen részeket:
  * `BettingArea.tsx` (0% coverage)
  * `BlackjackTable.tsx`
  * `ActionButtons.tsx`
  * `ChipSelector.tsx`
  * `GameResult.tsx`
  * `gameHelpers.ts`
  * `gameStore.ts`

**Gyökér ok:**
* A fenti UI elemek interaktív viselkedése és egyes store edge-case-ek nincsenek letesztelve, a `BettingArea.tsx` egyáltalán nincs betöltve/tesztelve.
* A `BlackjackTable.test.tsx` a teljes komponenst rendereli egy viszonylag hosszú integrációs tesztként (1 másodperces futási idő).

**Javaslat:**
* E2E/integrációs tesztek helyett/mellett izolált unit tesztek (pl. Zustand store dedikált tesztelése a szabályzat alapján `.getState()` hívásokkal) és specifikus komponens tesztek hozzáadása. Kifejezetten a `BettingArea`-hoz teszt írása.

---

## 4. Build és bundle

A `vite build` tesztelésekor a TypeScript (tsc) hibát dobott a build pipeline-ban.

**Tünet:**
* A `npm run build` (mely `tsc -b && vite build` parancsokat futtat) elbukik ezzel a hibával:
  ```
  vite.config.ts(7,3): error TS2769: No overload matches this call.
  ... 'test' does not exist in type 'UserConfigExport'.
  ```

**Gyökér ok:**
* A `vite.config.ts` tartalmaz `test` beállításokat a Vitest miatt, de hiányzik a Vitest típusokra való explicit hivatkozás, amit a TypeScript fordító igényel.

**Javaslat:**
* A `vite.config.ts` legelső sorába (vagy az importok elé) be kell szúrni a következőt: `/// <reference types="vitest/config" />`. Bár ezt most a szabályzat szerint nem módosítjuk, a hiba fennáll.

---

## 5. Típusbiztosság

Bár a kód szigorú TypeScript módra épít és konkrét `any` típusok elvétve sem fordulnak elő a `src` mappán belül, vannak potenciálisan nem biztonságos típuskonverziók (Type Assertions).

**Tünet:**
* A `grep -rn "as "` használatával sok `as` castolást találtunk, többek között:
  * React CSSProperties castolások animációknál (pl. `as React.CSSProperties`) - *ezek viszonylag ártalmatlanok*.
  * Tesztekben és teszteszközökben (`deck.test.ts`, `rules.test.ts`, `gameHelpers.ts`) sok erőszakos castolás van:
    * `dealCard(deck) as [import('../types').Card, import('../types').Card[]]`
    * `const card = candidate as Partial<Card>;` a `gameHelpers.ts`-ben.

**Gyökér ok:**
* Olyan esetekben, ahol a TypeScript nem tudta egyértelműen leszűkíteni a típust, vagy ahol egy objektum csak egy részét használták (pl. teszt mock-ok), `as` cast-hoz folyamodtak. A tuple/tömb dekonstrukciónál hiányzik a szigorúbb típusos visszatérési érték (vagy a typescript as const következtetés).

**Javaslat:**
* Használjunk type guardokat (pl. `is Card` fügvényeket) vagy határozzuk meg a visszatérési típusokat szigorúbban. A `gameHelpers.ts`-beli `as Partial<Card>` esetében egy valós `Type Guard` vagy validáció szükséges.

---

## 6. Dead code és lint

A kód vizsgálatához a `knip` eszközt is lefuttattuk.

**Tünetek:**
* Az alábbi, használaton kívüli fájlok / exportok találhatók:
  * Használaton kívüli fájlok: Sok `.css` fájl (pl. `App.css`, `Avatar.css`), valamint a `BettingArea.tsx`, `BettingArea.css`, `CardAnimations.tsx`, `ChipStack.tsx`, `useGameAnimations.ts`.
  * Használaton kívüli exportok:
    * `ChipButton` (a `src/components/Chip/ChipAnimations.tsx`-ből)
    * `DEALER_STAND_VALUE` (a `src/logic/rules.ts`-ből)
    * `E2E_SHOE_STORAGE_KEY` (a `src/store/gameHelpers.ts`-ből)
  * Használaton kívüli típusok: `SoundType`, `HandResult`.

**Gyökér ok:**
* A fejlesztés során benne maradtak korábbi iterációk vagy tervezett, de még be nem kötött funkciók (pl. kártya és zseton animációs fájlok, amik nem kerültek használatba). A CSS-eket valószínűleg leváltotta a Tailwind.

**Javaslat:**
* Távolítsuk el ezeket a dead file-okat, exportokat, ne terheljük feleslegesen a projektet (például a nem használt animációs és CSS fájlokat törölni kell, vagy be kell kötni a használatukat). A Lint (`npm run lint`) hibátlanul lefutott (vagyis a `max-warnings 0` nem dobott hibát), ami dicséretes.

---

## Összegzés a korábban azonosított inkonzisztenciákról

Korábbi analízisünk (ami a szabályok vizsgálatából fakadt) három potenciális logikai és állapotmenedzsmenti hibát is felszínre hozott, melyeket dokumentálni kell:
1. **Inkonzisztens Kifizetési Szorzó (Payout Calculation Bug):** A `rules.ts`-ben (`applyPayouts` és `calculateResults`) a "Double Down" miatti kifizetés állapota nagyon törékeny, a `payout` változó értelmezése (profit szorzó vs teljes viszakapott szorzó) zavaros.
2. **Soft 17 Komment vs. Kód Ellentmondás:** A `rules.ts`-ben (39-45. sor) a `shouldDealerHit` függvénynél a megjegyzés szerint az osztó húz (hit) Soft 17-re, míg a kód megáll (stand).
3. **Biztosítás (Insurance) Állapotkezelési Probléma:** A `gameStore.ts`-ben (77-106. sor) a biztosítás nyereménye azonnal módosítja az egyenleget és utána beindul a standard fázis vége logika, amely "lose" eredmény esetén nem vonja ki a főtéteket korrekten, ha már a biztosítással a balansz számítás megzavarodott. Ezt tiszta állapotátmenetekkel érdemes refaktorálni.
