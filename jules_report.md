# Blackjack Architektúra és Hibakeresési Jelentés

## Architekturális Elemzés és Függőségi Gráf (Dependency Graph)

A kód alapos vizsgálata alapján a projekt a következőképpen van strukturálva, amely nagy vonalakban követi a Clean Architecture elveit (Domain, Application/Use Cases, Presentation/UI):

### 1. Presentation/UI Réteg (React + Components)
- **Könyvtárak:** `src/components/`, `src/hooks/`
- **Szerepkör:** A felhasználói felület renderelése és a felhasználói interakciók kezelése.
- **Függőségek:** Közvetlenül a `src/store/gameStore.ts`-re támaszkodik a játékállapot lekéréséhez és az akciók (pl. `hit`, `stand`, `placeBet`) indításához. Nem tartalmaz magszintű (domain) üzleti logikát.

### 2. Application/State Management Réteg (Zustand)
- **Fájlok:** `src/store/gameStore.ts`, `src/store/gameHelpers.ts`
- **Szerepkör:** Ez a "Single Source of Truth", a játék központi állapota. Összeköti a UI-t a Domain logikával. Kezeli a fázisátmeneteket (`betting` -> `playing` -> `finished`).
- **Függőségek:** Importálja a `src/logic/` domain függvényeit.
- **Mechanizmus:** 
  - Az inicializálás a `gameHelpers.ts` `createFreshShoe()` függvényével történik (amely vagy `localStorage`-ből tölti be az E2E teszt cipőt, vagy egy új véletlenszerűt generál a `deck.ts`-ből).
  - A `gameStore.ts` akciói (`deal`, `hit`, `stand`, `double`, `split`, `buyInsurance`) módosítják a játékos lapjait.
  - Amikor minden játékoskéz befejezte a kört (pl. mindenki megállt vagy besokallt), a `gameHelpers.ts`-ben lévő `handleAllHandsDone()` kerül meghívásra, ami levezényli az osztó körét és a kiértékelést.

### 3. Domain Logic Réteg (Tiszta TypeScript függvények)
- **Könyvtárak:** `src/logic/`
- **Fájlok és Felelősségek:**
  - `deck.ts`: Kártyák, paklik és cipő (shoe) létrehozása. Tartalmazza a keverést (fisher-yates shuffle), ami *kriptográfiailag biztonságos* `crypto.getRandomValues`-t használ.
  - `hand.ts`: Kézértékek kiszámítása (`calculateHandValue`), besokallás (`isBusted`), és blackjack ellenőrzés (`isBlackjack`). Az Ászok értékének dinamikus (11 vagy 1) kezelése itt történik.
  - `rules.ts`: A legmélyebb üzleti szabályok. 
    - `dealerPlay`: Az osztó húzási logikája (Stand on Soft 17).
    - `calculateResults`: A nyertes/vesztes/döntetlen/blackjack kimenetelek eldöntése.
    - `applyPayouts`: A zsetonok/egyenleg kiszámítása az eredmények alapján.

## Felfedezett Problémák és Inkonzisztenciák (Gyökérokok)

A "tünet alapú" hibakeresés helyett a kód áttanulmányozása során a következő potenciális logikai hibákat és inkonzisztenciákat tártam fel a `src/logic/rules.ts` és `src/store/` integrációjában:

### 1. Inkonzisztens Kifizetési Szorzó (Payout Calculation Bug)
- **Fájl:** `src/logic/rules.ts`
- **Helyszín:** `calculateResults` (56-97. sor) és `applyPayouts` (100-128. sor)
- **A hiba leírása:** 
  A `calculateResults` függvény a normál győzelemhez (`win`) `payout = 1` értéket ad. A megjegyzés szerint ez "1:1 profit (bet is already doubled in hand.bet if doubled down)". 
  A `applyPayouts` függvény az egyenleghez a következőt adja hozzá: `balance += bet + Math.floor(bet * roundResult.payout)`.
  **A probléma a "Double Down" (Duplázás) esetén van.** 
  A `gameStore.ts`-ben (146. sor) amikor a játékos dupláz, a `hand.bet` megduplázódik, ÉS a plusz tét levonásra kerül az egyenlegből (`balance - hand.bet` ahol a hand.bet még az eredeti tét). 
  Azonban, ha a játékos nyer, az `applyPayouts` a *megduplázott* `hand.bet`-et használja, és hozzáadja a `bet + bet * 1`-et. Mivel a `payout` szorzó itt a profitért felel, a matek önmagában helyes lehet, DE a kód nagyon törékeny az állapotfrissítési sorrend miatt. Különösen a tesztekben és a valós UI állapotban inkonzisztenciát okozhat, ha a `payout` valahol a teljes visszakapott összeget, máshol csak a profit szorzóját jelenti.

### 2. Osztó Logikája: Soft 17 Komment vs. Kód Ellentmondás
- **Fájl:** `src/logic/rules.ts`
- **Helyszín:** `shouldDealerHit` (39-45. sor)
- **A hiba leírása:**
  ```typescript
  function shouldDealerHit(value: number, soft: boolean): boolean {
    if (soft) {
      // Soft 17: hit (since dealer stands on soft 17 is false)
      return value < DEALER_STAND_VALUE; 
    }
    // Hard hand: hit if less than 17
    return value < DEALER_STAND_VALUE;
  }
  ```
  A `DEALER_STAND_VALUE` értéke 17. Ha az osztónak "Soft 17"-e van (`value = 17`, `soft = true`), a `17 < 17` feltétel `false`-ra értékelődik. Ez azt jelenti, hogy az osztó **MEGÁLL** a Soft 17-en.
  Azonban a megjegyzés azt állítja: *"Soft 17: hit (since dealer stands on soft 17 is false)"*. 
  Ez egy súlyos ellentmondás az elvárt üzleti logika (komment) és a tényleges implementáció között. Jelenleg a kód szigorúan S17 (Stand on all 17s) szabályt követ.

### 3. Biztosítás (Insurance) Állapotkezelési Probléma
- **Fájl:** `src/store/gameStore.ts`
- **Helyszín:** `buyInsurance` (77-106. sor)
- **A hiba leírása:**
  Amikor a játékos biztosítást köt, és az osztónak Blackjackje van:
  `const finalBalance = newBalance + insuranceCost * 3;`
  A kód azonnal meghívja a `handleAllHandsDone(dealerHand, shoe, playerHands, finalBalance)` függvényt.
  A probléma az, hogy a `handleAllHandsDone` újra ki fogja értékelni a `calculateResults`-t. Mivel az osztónak Blackjackje van, a játékos fő keze elveszíti a kört (kivéve, ha neki is BJ-je van, ami Push). A `handleAllHandsDone` a `finalBalance`-ot kapja meg bemenetként (amiben már benne van a biztosítás nyereménye), és mivel a játékos veszít (`lose`), a `applyPayouts` nem ad hozzá semmit. Ez *matematikailag* helyes végösszeget eredményez, DE az állapotmenedzsment szempontjából egy rejtett, "kötéltáncos" megoldás, ami nagyon megnehezíti a jövőbeli refaktorálást vagy a UI számára a pontos eseménynapló (log) megjelenítését (a UI nem tudja egyértelműen szétválasztani a biztosítás nyereményét a főkéz elvesztésétől a `roundResults` alapján, mert az csak a főkéz eredményét tartalmazza).

---
*A fenti megállapítások tisztán olvasási (read-only) jogkörrel történő kódelemzésen alapulnak, módosítás nem történt.*
