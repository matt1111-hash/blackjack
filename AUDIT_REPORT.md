# Teljes Repository Audit Jelentés - Blackjack

## 1. Executive Summary
A Blackjack projekt forráskódjának biztonsági és teljesítmény fókuszú auditja során megállapítottuk, hogy a projekt modern stackre (React 19, Vite, Zustand, TypeScript) épül, melynek struktúrája és modularitása alapvetően megfelelő. A kártyakeveréshez biztonságos (`crypto.getRandomValues`) API-t használ.
Az audit ugyanakkor kritikus sebezhetőségeket és architekturális hiányosságokat tárt fel a biztonság és a performancia terén. A legfőbb kockázat az aszimmetrikus bizalmi modell, amely a teljes játéklogikát és állapotot (például egyenleg) a kliensoldalon kezeli, ezáltal triviálisan manipulálhatóvá teszi. Teljesítmény szempontjából a Zustand állapotkezelő helytelen (nem szelektív) használata okoz jelentős, felesleges újrarendereléseket (re-renders), amely csökkenti a futási teljesítményt (különösen gyengébb eszközökön). Emellett a build környezetben jelen lévő magas prioritású NPM sebezhetőségek (supply-chain kockázatok) is azonnali beavatkozást igényelnek.

---

## 2. Top Findingok (Kockázat és Hatás szerint priorizálva)

### 1. Kliensoldali Állapot-manipuláció (Client-Side Trust / Game State Exploit)
- **Severity:** CRITICAL
- **Érintett fájlok/komponensek:** `src/store/gameStore.ts`, az összes logikai fájl (`src/logic/*`)
- **Mi a probléma:** A teljes játékállapot (egyenleg, tét, kártyapakli) a böngésző memóriájában (Zustand store) fut és tárolódik. Nincs szerveroldali validáció.
- **Miért kockázat / miért drága:** Egy rosszindulatú felhasználó böngészős fejlesztői eszközökkel (DevTools) vagy egy konzolból futtatott JavaScript parancssal könnyedén felülírhatja a Zustand store állapotát. Megváltoztathatja a `balance` értékét végtelenre, vagy beleláthat a pakliba (`shoe`), tudva a következő kártyákat. Valódi tétes vagy ranglistás környezetben ez 100%-os exploitálhatóságot jelent.
- **Hogyan validálnád:** Nyisd meg a DevTools Console-t, és írd át az állapotot, pl. a React DevTools vagy közvetlen memóriahozzáférés révén, avagy a `window` objektumhoz kötött függvényekkel.
- **Minimális javítási javaslat:** Mivel ez "play money" játék, az architektúra újraírása szerveroldali logikára (Backend API-k bevezetése a laposztásra és tétkezelésre) *High effort*. Ha marad kliensoldali, a kockázatot el kell fogadni, de legalább az állapot elrejtése a globális névtérből és az egyenleg minimális obfuszkációja javasolt (habár ez nem nyújt igazi biztonságot).

### 2. Zustand Állapotkezelési Anti-pattern (Massive Re-renders)
- **Severity:** HIGH
- **Érintett fájlok/komponensek:** `src/components/Table/BlackjackTable.tsx` és valószínűleg más UI komponensek is.
- **Mi a probléma:** A komponens egyben destrukcionálja a store-t: `const { balance, currentBet, dealerHand, ... } = useGameStore();`.
- **Miért kockázat / miért drága:** A Zustand esetében ez azt jelenti, hogy a `BlackjackTable` feliratkozik a **teljes store** összes változására. Ha a hátralévő kártyák száma csökken (`shoePenetration`), vagy egy háttérváltozó módosul, a teljes játékasztal (és minden gyermeke, amennyiben nincsenek `React.memo`-val levédve) teljesen újrarenderelődik. Ez melegszik a telefonokon, rontja a framerate-et, és pazarolja a CPU-t (Hot path).
- **Hogyan validálnád:** Használd a React Profiler-t, játssz le egy kört. Látni fogod, hogy a `BlackjackTable` minden apró állapotváltozásnál teljes re-renderen esik át.
- **Minimális javítási javaslat:** Szelektív selectorok használata a Zustand store-ból.
  ```typescript
  // HELYTELEN:
  // const { balance, currentBet } = useGameStore();

  // HELYES (optimalizált):
  const balance = useGameStore((state) => state.balance);
  const currentBet = useGameStore((state) => state.currentBet);
  ```

### 3. NPM Dependency és Supply-Chain Sebezhetőségek
- **Severity:** HIGH
- **Érintett fájlok/komponensek:** `package.json`, `package-lock.json`
- **Mi a probléma:** Az `npm audit` 6 sebezhetőséget tárt fel (4 High, 2 Moderate), többek között a `rollup`, `minimatch` és `flatted` csomagokban.
- **Miért kockázat / miért drága:** Bár ezek nagyrészt build/dev dependenciák (pl. Vite alatt), a Path Traversal és ReDoS (Regular Expression Denial of Service) sebezhetőségek komoly kockázatot jelentenek a CI/CD pipeline-ra nézve. Egy fertőzött csomag fejlesztői gépeket vagy a build szervert kompromittálhatja.
- **Hogyan validálnád:** Futtasd: `npm audit`
- **Minimális javítási javaslat:** Azonnali csomagfrissítés: `npm audit fix` vagy `npm update` futtatása a javított verziók behúzásához.

### 4. Bemenet Validáció Hiánya (Input Validation Flaw) a Tétrakásnál
- **Severity:** MEDIUM
- **Érintett fájlok/komponensek:** `src/store/gameStore.ts` (`placeBet` függvény)
- **Mi a probléma:** A `placeBet` metódus csupán annyit ellenőriz, hogy `balance >= amount`. Nincs ellenőrizve, hogy a szám pozitív-e.
  ```typescript
  if (balance >= amount) { set({ balance: balance - amount, currentBet: currentBet + amount }); }
  ```
- **Miért kockázat / miért drága:** Kliensoldali módosítással egy negatív tét (-500) meghívása átmegy a `balance >= -500` validáción. Ezáltal `balance - (-500)` hozzáadódik az egyenleghez, a tét pedig negatív lesz. Ingyen egyenleg növelés.
- **Hogyan validálnád:** Hívj meg egy konzolból egy store műveletet negatív számmal.
- **Minimális javítási javaslat:** Logikai validáció hozzáadása:
  ```typescript
  if (amount > 0 && balance >= amount) { ... }
  ```

### 5. Komponens Memoizáció Hiánya (React.memo)
- **Severity:** MEDIUM
- **Érintett fájlok/komponensek:** `src/components/Table/DealerArea.tsx`, `src/components/Table/PlayerArea.tsx`, `src/components/Card/*`
- **Mi a probléma:** Nem látunk `React.memo` optimalizációkat a tiszta prezentációs komponenseknél (pl. a leosztott Kártya komponens).
- **Miért kockázat / miért drága:** Mivel a szülő `BlackjackTable` túl gyakran renderel, a gyermek komponensek feleslegesen re-calculate fázisba lépnek, újra rajzolva az animációkat és felületeket.
- **Hogyan validálnád:** React Profiler - "Highlight updates when components render" bekapcsolása.
- **Minimális javítási javaslat:** Csomagold a statikus vagy ritkán változó UI komponenseket `React.memo`-ba, a callback függvényeket pedig védd le `useCallback`-kel.

### 6. Hiányzó aszinkron betöltés (Bundle Size / Lazy Loading)
- **Severity:** LOW
- **Érintett fájlok/komponensek:** `src/App.tsx` vagy router beállítások.
- **Mi a probléma:** Az összes komponens és modul szinkron módon töltődik be a main bundle-ben.
- **Miért kockázat / miért drága:** Bár egyelőre kicsi a játék, a későbbiekben (további hangfájlok, nagyobb libraryk, más nézetek, pl. szabálykönyv) drasztikusan nőhet a kezdeti oldalbetöltési idő (TTV - Time to View).
- **Hogyan validálnád:** Hálózat elemzése devtools-szal "Fast 3G" szimulációval.
- **Minimális javítási javaslat:** React `lazy()` és `Suspense` használata az olyan komponenseknél, amelyek nem kellenek azonnal, vagy különálló nézeteket képviselnek.

---

## 3. Quick Wins & High Impact / High Effort Tételek

### Quick wins (Alacsony erőfeszítés, azonnali nyereség)
1. **NPM Audit fix:** `npm audit fix` futtatása, ez azonnal megjavítja a sérülékeny tranzitív dependenciákat.
2. **Bemeneti validáció a Store-ban:** Az `amount > 0` és esetleg egy asztal maximum (`amount <= MAX_BET`) korlát beillesztése a `placeBet` és a `double` függvényeknél.
3. **Zustand selectorok átírása:** A `BlackjackTable.tsx`-ben a destrukcionált objektum helyett egyenkénti selectorok használata drasztikusan javítja a render performanciát anélkül, hogy az architekturát bontani kellene.

### High impact / High effort (Nagy hatás, de komoly beavatkozás)
1. **Szerveroldali Game Engine:** Ha a játék valaha is többre hivatott demonstrációs céloknál, a tiszta kliensoldali modellt le kell cserélni. Backend létrehozása (pl. Node.js/Go) WebSocket vagy REST alapon, ahol a böngésző csak a kliens, és a `logic/*` kód a szerveren fut a kliens elől elzárt paklival és hitelesített egyenlegkezeléssel.
2. **Kiterjedt Memoizáció és UI Virtualizáció:** Minden vizuális elem (zsetonok, kártyák) profilozása, animációk kiszervezése CSS rétegre (`transform` és `opacity` fókusszal), hogy a React Reconciler ne legyen szűk keresztmetszet a sok kártya és zseton mozgatásánál.

---

## 4. Top 5 Azonnali Teendő

1. Futtasd le az `npm audit fix`-et a High és Moderate sebezhetőségek azonnali megszüntetéséhez a Node dependenciákban.
2. Írd át a `BlackjackTable.tsx`-ben a `useGameStore()` hívásokat szigorú, property-alapú selectorokra (pl. `useGameStore(state => state.phase)`), hogy megszűnjenek a globális felesleges újrarenderelések.
3. Biztosítsd a `placeBet` és más pénzügyi (balance-et érintő) műveleteket `src/store/gameStore.ts`-ben szigorú `> 0` és érvényességi ellenőrzésekkel (pl. NaN, Infinity elleni védelem).
4. Vezesd be a `React.memo`-t a `DealerArea` és `PlayerArea` alá tartozó egyszerűbb bemutató komponensekhez (pl. kártyalapok).
5. Készíts biztonsági megjegyzést a README-ben, amely egyértelműsíti, hogy a projekt tisztán demó/kliens alapú, és nem alkalmas pénzes környezetben való futtatásra ebben az architektúrában.
