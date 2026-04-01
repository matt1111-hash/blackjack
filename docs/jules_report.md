# Statikus Analízis Jelentés

## 1. Architektúra

*   **Tünet:** A `madge` futtatása során nem találtam körkörös importot. A Clean Architecture határok a vizsgált kódbázisban többnyire megfelelőek. A `src/store/` a `src/logic/`-ből importál (pl. `gameHelpers.ts` a `deck.ts`, `hand.ts`, `rules.ts`-ből), ami egy megfelelő irány. Azonban az `UI` rétegre sem a `logic`, sem a `store` nem hivatkozik közvetlenül, ami megfelel az elvárásoknak.
*   **Gyökér ok:** Jó architektúrális tervezés, a felelősségek szétválasztása.
*   **Javaslat:** Jelenleg nincs azonnali beavatkozást igénylő probléma ezen a területen. Érdemes a jövőben is figyelni, hogy a `src/components/` és `src/store/` hivatkozások ne szivárogjanak be a `src/logic/` rétegbe.

## 2. Dependency fa és verziókövetkezetesség

*   **Tünet:** Az `npm ls` parancs lefutott, nincsenek "UNMET DEPENDENCY" vagy hibaüzenetek, ami stabil függőségi fára utal. Nincsenek duplikált függőségek sem (pl. több verziójú `react`).
*   **Gyökér ok:** Jól karbantartott `package-lock.json`.
*   **Javaslat:** Az npm jelzett egy újabb verziót, de a meglévő függőségi fa jelenleg stabil, nincsenek konfliktusok.

## 3. Tesztek és coverage

*   **Tünet:** A `vitest` coverage futtatása során összességében 91.42%-os line coverage-t mértem.
    *   Bizonyos UI komponenseknél hiányosságok vannak: `src/components/Table/BettingArea.tsx` (0% coverage), `BlackjackTable.tsx` (~76% coverage), és `ActionButtons.tsx` (100% utasítás, de csak 77% ág-lefedettség).
    *   A `BlackjackTable.test.tsx` a tesztek futtatásához a teljes `<App />` fát rendereli (`render(<App />)` hívásokkal), ami integrációs terhelést okoz egy unit tesztnek szánt fájlban. A `BlackjackTable.test.tsx` mindössze 3 tesztjének lefutása >1 másodpercet (1067ms) vesz igénybe, míg a `rules.test.ts` 25 tesztje 16ms alatt lefut.
*   **Gyökér ok:**
    *   A tesztelés hiánya bizonyos UI szituációkra és edge-case-ekre (pl. `BettingArea` teljesen hiányzik a tesztekből).
    *   A `BlackjackTable` tesztelésénél nem csak az adott komponenst izolálják vagy gúnyolják (mock), hanem a gyökérelemet (`<App />`) tesztelik, ami belassítja a futást.
*   **Javaslat:**
    *   Unit tesztek írása a hiányzó részekhez (`BettingArea.tsx`, `ActionButtons.tsx` ágai).
    *   A `BlackjackTable.test.tsx` átírása úgy, hogy az `<App />` renderelése helyett csak a `BlackjackTable` komponenst renderelje egy mockolt Zustand store (vagy provider) segítségével, elkerülve a feleslegesen nagy fák renderelését.

## 4. Build és bundle

*   **Tünet:** A `npm run build` (`tsc -b && vite build`) parancs hibára fut. Hibaüzenet: `vite.config.ts(7,3): error TS2769: ... 'test' does not exist in type 'UserConfigExport'`. A build megakad.
*   **Gyökér ok:** A `vite.config.ts`-ben a `test` property be van állítva a Vitest-hez, de a TypeScript nem ismeri fel a Vitest típusait a konfigurációban. Hiányzik a Vitest típusok beemelése.
*   **Javaslat:** Hozzá kell adni a `/// <reference types="vitest/config" />` direktívát a `vite.config.ts` legelső sorához.

## 5. Típusbiztosság

*   **Tünet:** `any` típus használata nincs a kódbázisban. A `tsc --noEmit` hibátlanul (0 hibával) lefut a source kódra, ami erős típusbiztosságot jelent.
*   **Gyökér ok:** Strict TypeScript használata és szabályozott környezet.
*   **Javaslat:** A jelenlegi szigorú típuskezelés fenntartása. Nincs azonnali javításra szoruló típus probléma a src mappában.

## 6. Dead code és lint

*   **Tünet:** A linter (`eslint`) sikeresen, hibák és warningok nélkül lefut a kódbázison. Nincsenek olyan szabálysértések, mint a nem használt importok, vagy nem használt változók.
*   **Gyökér ok:** A kód megfelelő karbantartása, és a pre-commit / linting folyamatok valószínűleg megfelelően lettek korábban konfigurálva (pl. `@eslint/js` és TypeScript szabályok).
*   **Javaslat:** Továbbra is tartani ezt a linting sztenderdet. Jelenleg nincs szükség kód törlésére ezen a téren.
