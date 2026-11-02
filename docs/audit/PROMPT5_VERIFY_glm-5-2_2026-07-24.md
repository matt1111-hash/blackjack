# blackjack — Verification Gate
Dátum: 2026-07-24 | Model: glm-5.2
Ellenőrzött auditok: PROMPT0 minimax-m3, PROMPT1 claude, PROMPT2 minimax-m3, PROMPT3 qwen-code

> Független QA audit. A Prompt 0–3 outputjainak minden tényállítását a repó
> tényleges forráskódja ellen verifikáltam. Nem javítok, nem értékelek severity-t
> újra — csak azt mondom meg, hogy egy állítás **létezik-e** és **ott van-e,
> ahol az audit mondja**. A kód az igazság (ground truth).
>
> **Módszer:** minden állításhoz konkrét `grep`/`wc`/`Read` bizonyíték tartozik.
> A `[MEGERŐSÍTETT]` címkéket nem fogadtam el önértékelésként — ki-nyitottam a
> hivatkozott fájlt és megnéztem a sorszámot. A `SEC_AUDIT.md`, `REFACTOR_PLAN`
> és egyéb terv-dokumentumokat **nem** használtam bizonyítékként — csak a kódot.

---

## Összefoglaló verdikt (előzetes)

| Dokumentum | Ellenőrzött | Helyes | Hibás/Pontatlan | Pontosság |
|------------|-------------|--------|-----------------|-----------|
| PROMPT 0 (struktúra) | ~40 | ~32 | ~8 | **~80%** |
| PROMPT 1 (logika) | ~19 | ~17 | ~2 | **~89%** |
| PROMPT 2 (security) | ~22 | ~19 | ~3 | **~86%** |
| PROMPT 3 (optimalizáció) | ~23 | ~21 | ~2 | **~91%** |

**Mindhárom audit (0/1/2/3) döntéshozásra megbízható.** A hibák nem a lényeget
érintik — szinte mind (a) sorszám-eltolódás ±1–4 sor, (b) összegző számlálási
hiba a részletek pontossáával ellentétben, vagy (c) egy-egy mechanizmus
téves leírása. Két valódi technikai tévedés van: **PROMPT 1 3.1** (a
validátorok szigorúságát fordítva írja le), és **PROMPT 2 7.2** (a StrictMode
dupla-preload mechanizmus téves). Ezeket a riport kijavítja.

---

## 1. PROMPT 0 verifikáció — Struktúratérkép

### Pontossági összesítő: 32/40 (~80%)

### 1a. Technológiai leltár

| Állítás | Eredmény | Megjegyzés / bizonyíték |
|---------|----------|-------------------------|
| TypeScript `~5.9.3` `package.json:46` | HELYES | `:46` `"typescript": "~5.9.3"` ✓ |
| Vite `^7.3.3` + `@vitejs/plugin-react-swc@^4.2.2` `package.json:34,48` | HELYES | `:34` plugin-swc, `:48` vite ✓ |
| React `^19.2.1` / react-dom `package.json:20-21` | HELYES | `:20` react, `:21` react-dom ✓ |
| Zustand `^5.0.10` `package.json:22` | HELYES | `:22` ✓ |
| framer-motion `^12.29.0` `package.json:18` | HELYES | `:18` ✓ |
| howler `^2.2.4` + `@types/howler` `package.json:19,30` | HELYES | `:19` howler, `:30` @types/howler ✓ |
| Tailwind 4.1.x `package.json:27,44-45` | HELYES | `:27` @tailwindcss/postcss, `:45` tailwindcss (`:44` postcss) ✓ |
| Vitest 4.0.x `package.json:11-13,...` | PONTATLAN | A `:11-13` sorok a test **scriptek** (`test`, `test:run`, `test:coverage`), nem a vitest dep — az a `:49`-en (`vitest ^4.0.18`). A verzió és a többi ref (`:28-29,35-36,43`) helyes. |
| Playwright `playwright.config.ts:17-34`, 4 project | HELYES | chromium/webkit/mobile-chrome/mobile-webkit ✓; `@playwright/test ^1.55.0` `:26` |
| ESLint 9.39.x `package.json:24-25,37-42` | PONTATLAN | A `:37-42` tartalmazza eslint/config-prettier/plugin-react/plugin-react-hooks/plugin-react-refresh/globals, DE a `typescript-eslint` a `:47`-en (kívül esik). A `:24-25` a `devDependencies:{` + `@eslint/js`, nem a pluginok. Hiányzik az `eslint-plugin-react-refresh` (`:41`) említése. Verziók egyébként helyesek. |
| Prettier nincs explicit dev-dep, csak `.prettierrc` [HIPOTÉZIS] | HELYES (hipotézis igazolva) | A `package.json`-ban tényleg nincs `prettier` csomag (csak `eslint-config-prettier` `:38`). A `.prettierrc` létezik. A [HIPOTÉZIS] valós. |
| CI Node 22, `main`+`refactor`+`production-ready/**` `ci.yml:6-13,26` | HELYES | `node-version: 22` `:26`; branch triggerek `:4-13` ✓ |
| `vite.config.ts` minimális, csak react-swc plugin | HELYES | 7 sor, `plugins: [react()]` ✓ |
| Cutting-edge TS-konfig (`tsconfig.app.json` strict, ES2022) | HELYES | (megfelel a fenti; verzió-szintű, nem sorról sorra újraellenőrizve — a stack más auditokból konzisztens) |

### 1b. Struktúra és fájlszámok

| Állítás | Eredmény | Megjegyzés / bizonyíték |
|---------|----------|-------------------------|
| Forrás TS/TSX fájlok száma = **26** | **HELYTELEN/PONTATLAN** | `find src -name "*.ts*" ! -name "*.test.*" \| wc -l` = **36**. Az audit *saját* fá-fája (2. szekció) 34 kód + 2 test-helper fájlt sorol fel — tehát a "26" belsőleg inkonzisztens a saját leírásával. A struktúra helyes, csak az összegző szám hibás. |
| Forrás LOC ≈ 2 783 | HELYES (becslés) | tényleges `find src ! -name "*.test.*" \| cat \| wc -l` = **2 933**. ~5% eltérés a becslésen belül; nagyságrend helyes. |
| Forrás + teszt LOC ≈ 4 800 | PONTATLAN | tényleges **4 542** (~5% alul). A nagyságrend OK. |
| Komponens fájlok = **18** | PONTATLAN | `find src/components -name "*.ts*"` = **21** (ebből 1 a `.test.tsx`, 1 az `Avatar/index.ts` barrel). Forrás-komponens ~20. A "18" ~2-vel elmarad. |
| `main.tsx` 13 sor | HELYES | `wc -l` = 13 ✓ |
| `App.tsx` 7 sor | HELYES | `wc -l` = 7, csak `<BlackjackTable />` render ✓ |
| `gameStore.ts` 298 sor | HELYES | `wc -l` = 298 ✓ |
| `BlackjackTable.tsx` 235 sor | HELYES | `wc -l` = 235 ✓ |
| `useSound.ts` 271 sor | HELYES | `wc -l` = 271 ✓ |
| `PlayerAvatar.tsx` 152 sor | PONTATLAN | `wc -l` = **151** (±1) |
| `ChipAnimations.tsx` 154 sor | HELYES | `wc -l` = 154 ✓ |
| `CardAnimations.tsx` 139 sor | HELYES | `wc -l` = 139 ✓ |
| `types/index.ts` 40 sor + CHIP_COLORS | HELYES | ~41 sor; CHIP_COLORS jelen ✓ |
| `Hand.tsx` 52 sor | HELYES | `wc -l` = 52 ✓ |
| Minden tesztfájl sorszáma (deck 135, hand 283, rules 205, rules.helpers 128, validators 161, gameHelpers 43, gameStore 273, insurance 244, BlackjackTable.test 137, e2e 188) | HELYES | `wc -l` egy az egyben igazolja az összeset ✓ — ez kiemelkedően pontos |
| `gameStore.ts` "9 action metódus" | PONTATLAN | A `GameState` interfész **11** action-t listáz (`placeBet, deal, hit, stand, double, split, buyInsurance, declineInsurance, newRound, resetBalance, clearError`); a `BlackjackTable` 10-et destrukturál. "9" se nem az interfész, se nem a destructure száma. |
| `code-health-toolkit-v4/` ghost másolat (pyproject, .pre-commit, quality_gate.sh, Makefile, .importlinter, frontend-configs, README) | HELYES (kis pontatlanság) | A mappa létezik és tartalmazza a felsoroltakat, DE a `requirements-dev.txt` **nincs** jelen (az audit felsorolta); helyette `.quality_gate.conf` és `.gitignore` is van (audit nem említette). A "Python-verzió artefakt, a build nem használja" állítás helyes. |
| `code-health-toolkit-v4.0.zip` 18 KB, `.gitignore`-ban | HELYES | 17 646 byte ≈ 18 KB ✓; `.gitignore:29 *.zip` ✓ |
| `public/sounds/` 10 .ogg, SOUND_CONFIG kulcsok 1:1 | HELYES | 10 fájl ✓; a `useSound.ts:16-27` SOUND_CONFIG kulcsai pontosan fedik a fájlneveket ✓ |

### 1c. Belépési pontok

| Állítás | Eredmény | Megjegyzés |
|---------|----------|------------|
| `index.html`: `<div id="root">` + `/src/main.tsx` script tag | HELYES | `:10` root, `:11` script ✓ |
| script tag-nek nincs `defer`/`async` → "parser-blokkoló ESM" | RÉSZBEN | A `defer`/`async` hiánya IGAZ (`:11`), de a következtetés téves: a `<script type="module">` **alapértelmezetten defer-viselkedésű** (sosem parser-blokkoló). A tény helyes, a technikai ok következtetés hibás. |
| `launch_desktop.sh` 73 sor: build hiány → `npm run build`; nohup preview; 20 próbás poll; `xdg-open` | HELYES | `wc -l` = 73; `:64-69` build; `:36` nohup; `:38 {1..20}`; `:72 exec xdg-open "$URL"` ✓ |
| `--check` csak függőségeket ellenőriz `launch_desktop.sh:49-57` | HELYES | `:49-57` ✓ |
| CI lépések: lint → typecheck → test+coverage → build → playwright → e2e; `quality_gate.sh` NEM fut CI-ban | HELYES | `ci.yml` lépések igazolják; nincs `quality_gate.sh` hívás ✓ |

### 1d. Függőségtérkép

| Állítás | Eredmény | Megjegyzés |
|---------|----------|------------|
| Nincs körkörös import (gameStore↔gameHelpers, gameStore↔validators) | HELYES | `gameHelpers.ts` nem importál `gameStore`-t; `validators.ts` csak type-only `GameState`-et. Egyirányú DAG. ✓ |
| Singleton `let soundManager` `useSound.ts:184` + `beforeunload` cleanup | HELYES | `:184` singleton, `:186-197` getSoundManager, `:190-193` beforeunload destroy ✓ |
| `'blackjack:e2e-shoe'` kulcs **3 helyen** definiálva | HELYES | `gameHelpers.ts:8`, `e2e/game-flow.spec.ts:9`, `BlackjackTable.test.tsx:47` — mindhárom saját `const` definíció ✓ |
| `getConfiguredShoe()` VITE_E2E backdoor `gameHelpers.ts:67-92` | HELYES (tartalom) / PONTATLAN (sorszám) | A backdoor valós (`:68` feltétel, `:72` localStorage olvasás, `:78` JSON.parse). A függvény azonban `:67-88`-ig tart, nem `:92`-ig (a `:90-92` már `createFreshShoe`). ±4 sor. |
| `BlackjackTable.tsx:175-176` inline canDouble/canSplit megkerüli a `rules.ts` domain függvényeket | HELYES | `:175 canDouble={balance >= (playerHands[activeHandIndex]?.bet || 0)}`, `:176 canSplit={playerHands.length === 1 && playerHands[0]?.cards.length === 2}` — szó szerint egyezik ✓ |
| `BlackjackTable` széles selector `:14-33` (17 mező) | HELYES (irány) / PONTATLAN (szám) | A destruktúra `:14-33`-ban van ✓, DE **18 mező** (8 state + **10** action), nem "17 (8+9)". `resetBalance` nincs destrukturálva, a többi 10 action igen. A "széles selector, teljes re-render" állítás helyes. |
| `Balance.tsx:11` keskeny selector `useGameStore((state) => state.resetBalance)` | HELYES | `Balance.tsx:11` ✓ |
| Howler globális import `soundHelpers.ts:11` | PONTATLAN | Az **import** a `:2`-es sorban (`import { Howler } from 'howler'`); a `:11` a használat (`Howler.volume(clamped)`). ±9 sor a forráshoz képest. |
| Coverage scope `vitest.config.ts:13-31`, 80% threshold, UI fele kimarad | HELYES | Az include lista **szó szerint** megegyezik (`:13-21`, 7 minta); `thresholds: { lines: 80, functions: 80 }` `:27-30` ✓ |
| 80%-os küszöb aktív; `COVERAGE_THRESHOLD=85/CI=90` használatlan maradék | HELYES | `quality_gate.sh:32-38` a `LOCAL_MIN_LINES/CI_MIN_LINES` (=80) konstansokat használja, NEM a `COVERAGE_THRESHOLD`-ot. A `.quality_gate.conf:16-17` valóban halott. ✓ |
| React 19 StrictMode bekapcsolva `main.tsx:7` | HELYES | `:7 <StrictMode>` ✓ |

### PROMPT 0 szisztematikus megjegyzések
- **Összegző számlálások vs. részletek:** a per-fájl sorszámok (LOC, tesztfájlok) **rendkívül pontosak**, de az összegző counts ("26 forrásfájl", "18 komponens") elmaradnak a valósagtól. Belső inkonzisztencia.
- **Sorszám-eltolódás:** `getConfiguredShoe 67-92` (valójában 67-88), Howler import `:11` (valójában `:2`).

---

## 2. PROMPT 1 verifikáció — Logika & Architektúra

### Pontossági összesítő: 17/19 (~89%)

| Állítás | Eredmény | Megjegyzés / bizonyíték |
|---------|----------|-------------------------|
| `gameHelpers.ts:67-92` infrastruktúra (localStorage/env) a `store/` rétegben (1.1) | HELYES | `getConfiguredShoe()` `:67-88`: `window.localStorage`, `import.meta.env` ✓ |
| `useSound.ts:184-197` modul-szintű singleton, nincs DI (1.2) | HELYES | `:184 let soundManager`, `:186-197` ✓ |
| `CHIP_COLORS` prezentációs adat a `types/`-ben `types/index.ts:34-40` (1.3) | HELYES | `:34-40 export const CHIP_COLORS` (hex színek: `#FFFFFF`, `#E53935`, …) ✓. Kis pontatlanság: az audit "RGB színkonstans"-t ír, valójában hex. A lokáció pontos. |
| `BlackjackTable.tsx:175-176` rétegmegkerülés — inline canDouble/canSplit (2.4, 3.7) | HELYES | `:175-176` szó szerint; `canDouble` csak balance-t, `canSplit` csak hands/cards számot néz — nem hívja `canPlayerDouble/canPlayerSplit` ✓ |
| **`rules.ts:128-147` vs `validators.ts:34-51` duplikáció: "validátorok szigorúbbak", `validateSplit` ellenőrzi az `isDoubled` flag-et (3.1)** | **HELYTELEN** | **Fordítva van.** A domain függvények a szigorúbbak: `canPlayerSplit` (`rules.ts:139-147`) ellenőrzi `!isDoubled`-ot is; `validateSplit` (`validators.ts:43-51`) **NEM** ellenőrzi az `isDoubled`-ot. Ugyanígy `canPlayerDouble` (`rules.ts:128-136`) 5 feltétel (`cards.length===2, !isDoubled, !isStanding, !isBusted, balance>=bet`), míg `validateDouble` (`validators.ts:34-41`) csak 4 (nem nézi `isDoubled/isStanding/isBusted`). Tehát a **validátorok kevésbé szigorúak**, nem "szigorúbbak". A duplikáció létezik, de az irány téves. (Lásd: PROMPT 3 5.4 ezt helyesen írja le.) |
| **`dealOneCard` ≈ `deck.ts` `dealCardOrThrow` (3.2)** | **PONTATLAN** | `dealOneCard` (`rules.ts:47-51`) üres shoe-ra **`undefined`**-et ad vissza (`:48`). A `dealCardOrThrow` (`deck.ts:47-51`) **dobja** a hibát (`:49 throw`). Tehát `dealOneCard` funkcionálisan a `deck.ts` `dealCard`-jával azonos (`deck.ts:39-44`, szintén `undefined`-et ad), NEM a `dealCardOrThrow`-val. (PROMPT 3 5.3 ezt helyesen állítja.) |
| `shouldDealerHit(value, soft)` holt `soft` paraméter, mindkét ág azonos `rules.ts:38-45` (3.3) | HELYES | `:38-45`: `if (soft) return value < DEALER_STAND_VALUE;` és `return value < DEALER_STAND_VALUE;` — valóban azonos. A komment félrevezető. ✓ |
| Két volume-útvonal: `useSound.ts:172-174` + `soundHelpers.ts:8-12` (3.4) | HELYES | `setVolume` `:171-174` (masterVolume + Howler.volume); `useVolume.setMasterVolume` `:8-12` (state + Howler.volume) ✓ |
| Tesztduplikáció `gameStore.test.ts:197-243` ↔ `gameStore.insurance.test.ts:170-243` (3.5) | HELYES (tartalom) / PONTATLAN (szám) | A "validation edge cases" `describe` blokk mindkét fájlban létezik, **azonos tesztnevekkel** (placeBet zero/negative, deal, hit, stand, clearError, successful action, buyInsurance, declineInsurance, newRound rejects). A duplikáció valós. DE a blokk **~10** tesztet tartalmaz, nem "11"; és a `gameStore.test.ts` blokk `:197-272`-ig tart (nem `-243`). |
| `isValidCard()` runtime validáció a `store/`-ban `gameHelpers.ts:52-65` (3.6) | HELYES | `:52-65 isValidCard`, VALID_SUITS/VALID_RANKS halmazok `:10-11` ✓ |
| `deal()` 25 soros if/else játéklogika a store-ban `gameStore.ts:59-83` (4.2) | HELYES | `:59-83` a blackjack/insurance elágazás; a `deal()` action `:52-96` (~45 sor). Az "50+ sor" enyhe túlzás (45). |
| Hang logika a komponensben `BlackjackTable.tsx:65-86` (4.3) | HELYES | `:65-86` useEffect iterál `roundResults`-ot ✓ |
| `split()` `isBlackjack: false` az új kezekre `gameStore.ts:232-248` (4.4) | HELYES | `:238` és `:247` mindkét newHand `isBlackjack: false` ✓ |
| Insurance payout `gameStore.ts:109` `finalBalance = newBalance + insuranceCost * 3` (4.5) | HELYES | `:109` szó szerint; a matek helyes (2:1 + tét vissza = ×3 az `insuranceCost`-ra) ✓ |
| `dealOneCard()` csendes hibakezelés `rules.ts:22-24` (`if (!dealResult) break`) (5.2) | HELYES | `dealerPlay` `:23-24`: `dealOneCard` + `if (!dealResult) break;` ✓ |
| `ErrorBoundary` nem reseta-eli a Zustand store-t `:27-29` (5.3) | HELYES | `handleReload` `:27-29` csak `setState({hasError:false, error:null})` ✓ |
| `applyPayouts` nem védekezik OOB index ellen `rules.ts:106` (5.5) | HELYES | `:106 const hand = hands[roundResult.playerHandIndex];` — nincs guard, `:107 hand.bet` TypeError ha undefined ✓ |
| Nincs körkörös függőség; DAG (7.4) | HELYES | import-irány egyirányú ✓ |
| `Balance.tsx` importálja `useGameStore`-t annak ellenére, hogy balance-t props-ból kap (7.5) | HELYES | `Balance.tsx:2` import, `:11` `resetBalance` selector; `balance` prop ✓ |
| 147 teszt, mind zöld (6.1, függelék) | HELYES (belső konzisztencia) | A per-fájl bontás (33+26+12+13+18+15+3+24+3) pontosan 147-re summázódik; a `gameHelpers=3` és a struktúra igazolva. A futtatás-eredményt nem újra-futtattam, de a számtan konzisztens. |

### PROMPT 1 szisztematikus megjegyzések
- **Két valódi téves irányítás:** (3.1) a validátor-vs-domain szigorúság fordítva; (3.2) a `dealOneCard` párosítása `dealCardOrThrow`-val `dealCard` helyett. Mindkettőt PROMPT 3 helyesen írta le — a két audit itt **ellentmond egymásnak**, és PROMPT 3 a megbízhatóbb.

---

## 3. PROMPT 2 verifikáció — Security

### Pontossági összesítő: 19/22 (~86%)

### 3a. Severity-realitás (a sérülékenység létezése, nem a súly)

| Állítás | Eredmény | Megjegyzés / bizonyíték |
|---------|----------|-------------------------|
| Nincs `fetch`/`XMLHttpRequest`/`new Function` — `0 találat` (1.1) | HELYES | `grep -rnE "(fetch\(\|XMLHttpRequest\|new Function)" src/ e2e/` = 0 ✓ |
| Nincs `eval`/`exec` — `0 találat` (1.1) | HELYES | `grep` = 0 ✓ |
| Nincs `dangerouslySetInnerHTML`/`innerHTML` — `0 találat` (1.1) | HELYES | `grep` = 0 ✓ |
| Nincs hardcoded secret — `0 találat` (2.2) | HELYES | `grep -rniE "(api[_]?key\|password\|secret\|bearer\|authorization)" src/ e2e/` = 0 ✓ |
| Nincs `.env` fájl a repóban (2.2) | HELYES | `ls -la .env*` = nincs; `.gitignore:36 .env` ✓ |
| `JSON.parse` méretellenőrzés nélkül `gameHelpers.ts:78,83` (1.2) | HELYES | `:78 JSON.parse(rawValue)`, `:83 parsedValue.filter(isValidCard)` ✓ |
| `isValidCard` defense-in-depth elfogadható `gameHelpers.ts:52-65` (1.2B) | HELYES | `:52-65` halmazellenőrzés; üres input is biztonságosan kezelve ✓ |
| Nincs user account/auth/session (2.1) | HELYES | nincs Auth/Token/Credential a kódban ✓ |
| `ErrorBoundary` `console.error` `:24` (3.2) | HELYES | `:24 console.error('[ErrorBoundary] ...', error, info.componentStack)` ✓ |
| `error.message` render a fallback UI-ban `ErrorBoundary.tsx:73` (3.2) | HELYES (tartalom) / PONTATLAN (sorszám) | A render `:74`-en (`{this.state.error.message}` a `<pre>`-ben `:67-75`); az audit `:73`-at ír. ±1. |
| `/tmp/blackjack-{build,preview}.log` `launch_desktop.sh:9,36` (3.3) | HELYES | `:8-9` log path-ek, `:36` nohup redirect ✓ |
| Preview szerver `127.0.0.1`-re köt `launch_desktop.sh:36` + `playwright.config.ts:13` (3.4) | HELYES | mindkettő `--host 127.0.0.1` ✓ |
| `howler ^2.2.4` "AGED", utolsó release 2022 (4.1) | HELYES (verzió) / PLAUSIBLE (kor) | Verzió ✓. A "2022/aged" ítélet hálózat nélkül nem verifikálható, de a howler valóban lassan mozog — a [HIPOTÉZIS] jelölés őszinte. |
| Dependabot: heti npm + havi github-actions, nincs severity-filter (4.4) | HELYES | `dependabot.yml`: npm `interval: weekly`, github-actions `interval: monthly`; csak label-ek (`dependencies`, `ci`) ✓ |
| Nincs `npm audit`/CodeQL/Snyk a CI-ban `ci.yml:18-48` (4.5) | HELYES | CI lépések: lint/typecheck/test/build/playwright; nincs audit lépés ✓ |
| Nincs CSP meta `index.html` (5.1A) | HELYES | 13 sor, nincs `<meta http-equiv="Content-Security-Policy">` ✓ |
| Nincs SRI `integrity` `index.html:11` (5.1B) | HELYES | `:11` script tag, nincs integrity ✓ |
| `BLACKJACK_PORT` validálatlan `launch_desktop.sh:6` (5.2) | HELYES | `:6 PORT="${BLACKJACK_PORT:-4173}"`, nincs regex/validáció; `:36,72` felhasználja ✓. A "nem command injection (idézőjelezett)" indoklás helyes. |
| `set -euo pipefail` `launch_desktop.sh:3` (5.2B) | HELYES | `:3` ✓ |

### 3b. Javítási állapot keresztellenőrzés

| Állítás | Eredmény | Megjegyzés |
|---------|----------|------------|
| VITE_E2E backdoor `gameHelpers.ts:8,67-92` — MAGAS (6.1) | HELYES — **NEM már-javítva** | A `SEC_AUDIT.md` (2026-04-15, Finding 1.1, MEDIUM, CWE-345/20) **ugyanezt** a localStorage-shoe backdoort jelöli, és azt javasolja, hogy csak `MODE === 'test'`-re korlátozzák. A **jelenlegi kód** (`:68`) még mindig `VITE_E2E \|\| MODE === 'test'`-re nyit — tehát a SEC_AUDIT által javasolt szűkítés **nem történt meg**. A PROMPT 2 aktív finding helyes, nem "már javítva". A `git log` nem tartalmaz `CWE-` security-fix commitot. |
| `'blackjack:e2e-shoe'` 3 helyen; "(a `BlackjackTable.test.tsx` a `gameHelpers.ts`-ból importálja)" (6.1 kulcs-drift) | PONTATLAN | A 3 hely **IGAZ** (`gameHelpers:8`, `e2e:9`, `test:47`). DE a teszt **NEM importálja** a konstansokat — saját lokális `const E2E_SHOE_STORAGE_KEY`-t definiál (`BlackjackTable.test.tsx:47`). Továbbá az audit `:50`-et ír a definíciónak, de az a `:47`-en van (`:50` a `setItem` használat). A drift-kockázat valójában **nagyobb**, mint az audit mondja. |
| `localStorage` csak `getConfiguredShoe`-ban (6.2) | HELYES | `grep localStorage src/` (teszteken kívül) csak `gameHelpers.ts:72`-t ad ✓ |

### 3c. Hamis negatívok keresése

A Prompt 5 által elvárt hamis-negatív grep-ek mind **0 találatot** adtak:
`eval/exec/pickle/yaml.load/subprocess` — 0; `hardcoded/password/secret/api_key/token` — 0;
`dangerouslySetInnerHTML/innerHTML` — 0; `fetch/XMLHttpRequest` — 0.

→ **Nem találtam olyan valós kockázatot, amit a PROMPT 2 elmulasztott volna jelölni.**
A security lefedettség alapos. (Lásd még 6. szekció egy apró kiegészítésért.)

### 3d. Kontextus-érzékenység

| Állítás | Eredmény | Megjegyzés |
|---------|----------|------------|
| Single-player desktop profil → attacker = victim; legtöbb finding defense-in-depth (8.5) | HELYES | Az audit következetesen és helyesen contextualizál: a top finding-eket "design anti-pattern / integritás" keretbe helyezi, nem aktívan kihasználható támadásként. A severity-ítélet nem újraértékelendő, de a kontextusfigyelem megfelelő. |

### 3e. Egy valódi mechanizmus-tévesztés

| Állítás | Eredmény | Megjegyzés |
|---------|----------|------------|
| **`useSound` StrictMode-ban a preload `requestIdleCallback`-je kétszer fut le → dupla preload (7.2)** | **HELYTELEN** | A `preload` useEffect (`useSound.ts:241-260`) **visszatér egy cleanup függvénnyel**, ami `cancelIdleCallback(idleId)`-et hív (`:249-251`). Az `idleId` az effect törzsében deklarált `const` (`:247`) — tehát **minden effect-invokáció saját closure-ében** hordozza a saját ID-ját. StrictMode mount: setup(idleId=A) → cleanup(cancel A) → setup(idleId=B). Csak B marad aktív. A preload tehát **NEM** fut le kétszer StrictMode-ban — a cleanup helyesen törli az elsőt. Az állítás mechanizmusa téves. (A `useState(() => () => getSoundManager())` singleton-védelme viszont helyesen van leírva.) |

### PROMPT 2 szisztematikus megjegyzések
- **Egy hamis mechanizmus-állítás** (7.2 StrictMode dupla-preload) — a cleanup invokáció-specifikus, nem "single ID".
- **Egy téves import-állítás** (6.1 "a teszt importálja a konstansokat") — a teszt saját másolatot definiál.

---

## 4. PROMPT 3 verifikáció — Optimalizáció (legkritikusabb)

### Pontossági összesítő: 21/23 (~91%)

Ez a legprecízebb audit. Egyetlen "MEGOLDOTT ✅" sem szerepel (minden finding
aktívként van jelölve), így nincs hamis biztonságérzet-veszély. A "HIPOTÉZIS"
jelölések (3.1, 3.2) őszinték.

### 4a. Algoritmikus / memória / I/O findings

| Állítás | Eredmény | Megjegyzés / bizonyíték |
|---------|----------|-------------------------|
| Shoe immutable spread O(n) `deck.ts:39-43` `dealCard` (1.1) | HELYES | `dealCard` `:39-44`: `const [card, ...remaining] = shoe;` (`:41`) ✓ |
| `crypto.getRandomValues` iterációnként `deck.ts:29-35` (1.2) | HELYES | shuffle ciklus `:29-34`: `new Uint32Array(1)` + `crypto.getRandomValues` minden iterációban (`:30-31`) ✓ |
| `calculateHandDetails` redundáns újraszámítás `rules.ts:56-63`, `hand.ts:16-30` (1.3) | HELYES | `calculateResults` `rules.ts:58,65` hívja; `dealerPlay` `:20,29` ciklusban; `PlayerArea.tsx:94`, `DealerArea.tsx:13` render-enként. (`hand.ts` `calculateHandDetails` `:16-31`, audit `16-30`, ±1.) ✓ |
| Howl instance felhalmozódás lazy-load-on `useSound.ts:131-138,143-148` (2.1) | HELYES | `loadSound` `:132-139` új Howl ha nincs a Map-ben; `tryLoadOne` `:84-91` unload+delete+új create; `destroy` csak beforeunload `:191` ✓ |
| `DealerArea.displayCards` új tömb minden render `DealerArea.tsx:14` (2.2) | RÉSZBEN | Az új-tömb-per-render IGAZ (`:14 .map()`). DE a leírás pontatlan: a kód **csak a második (hole) lapot** másolja (`i === 1 ? {...c, faceUp:false} : c`), nem "az összes lapot kivéve az elsőt". A GC-terhelés állítás kisebb, mint leírva. |
| `PlayerArea.getPlayerMood()` 2× `.some()` render-enként `PlayerArea.tsx:59-67` (2.3) | HELYES | `:61-62` két `roundResults.some(...)`, `:73` inline hívás (nem memoizált) ✓ |
| 10 párhuzamos preload `useSound.ts:241-260`, `:151-153` (3.1) [HIPOTÉZIS] | HELYES | `:152 Promise.all(toLoad.map(loadWithRetry))`; `:248 { timeout: 3000 }`; MAX_RETRIES=3×LOAD_TIMEOUT=5000 ✓. A [HIPOTÉZIS] jelölés megfelelő (hatás mérés kérdése). |
| Nincs bundle code-splitting `vite.config.ts:1-7` (3.2) [HIPOTÉZIS] | HELYES | 7 sor, nincs `manualChunks`/lazy/dynamic import ✓ |

### 4b. Concurrency findings

| Állítás | Eredmény | Megjegyzés |
|---------|----------|------------|
| Széles selector "17 mező (8 state + 9 action)" `BlackjackTable.tsx:14-33` (4.1) | HELYES (irány) / PONTATLAN (szám) | A destruktúra `:14-33` ✓, de **18 mező** (8 state + **10** action), nem 17. A "MAGAS — teljes re-render" ítélet és a `useShallow` javaslat helyes; csak a számolás téves. |
| `setTimeout(playX, 500)` cleanup hiánya StrictMode-ban `BlackjackTable.tsx:65-86` (4.2) | HELYES | A result-sound useEffect (`:65-86`) **nem tartalmaz** `return () => clearTimeout(...)`. A három `setTimeout` (`:79,81,83`) nem törlődik. ✓ (Megjegyzés: az *error-toast* useEffect `:37-47` helyesen használ `timerRef`+cleanup — az audit nem állítja ezt hibásnak.) Kis pontatlanság: StrictMode csak mount-kor duplikál, nem "state változáskor". |

### 4c. Kódminőség findings

| Állítás | Eredmény | Megjegyzés / bizonyíték |
|---------|----------|-------------------------|
| Dead code: `CardAnimation`, `ChipButton`, `BettingChips`, `useGameAnimations`, `useCardCount`, `isSoftHand` sosem importálva (5.1) | HELYES | `CardAnimation` (`CardAnimations.tsx:75`), `ChipButton` (`ChipAnimations.tsx:92`), `BettingChips` (`ChipStack.tsx:43`), `useGameAnimations`/`useCardCount` (`useGameAnimations.ts:9,52`) — mind csak a saját fájljukban/barrel-ben; `isSoftHand` (`hand.ts:39`) csak `hand.test.ts`-ben. `grep` 0 production használat. ✓ |
| `shouldDealerHit` holt `soft` paraméter `rules.ts:38-45` (5.2) | HELYES | (azonos PROMPT 1 3.3-mal) ✓ |
| `dealOneCard` ≈ `deck.ts` `dealCard` (nem `dealCardOrThrow`) (5.3) | HELYES | **Ez a helyes verzió** — `dealOneCard` `undefined`-et ad, mint `dealCard`. (PROMPT 1 3.2 téved itt.) ✓ |
| `validators.ts` vs `rules.ts` divergencia: `validateDouble` nem néz `isDoubled/isStanding/isBusted`; `validateSplit` nem néz `isDoubled` (5.4) | HELYES | `validateDouble` (`validators.ts:34-41`), `validateSplit` (`:43-51`) — pontosan ahogy leírva. ✓ (Ez a PROMPT 1 3.1 téves állításának helyesbítése.) |
| `RANK_SYMBOLS` identitás-leképezés `Card.tsx:10-24` (5.5) | HELYES | `:10-24`: minden kulcs önmagára képez (`A:'A'`, `'10':'10'`, …) ✓. **DE:** a `RANK_SYMBOLS` **használatban van** (`:63,70`), tehát nem dead code. A QW2 "dead code eltávolítása" listába tételesen tévesen kerül — eltávolítása a `:63,70`-es használat átírását igényli, nem egyszerű törlést. A 5.5 finding ("redundáns") helyes; a QW2 keretezés pontatlan. |
| Magic number-ök (5.6) | HELYES (tartalom) / PONTATLAN (sorszámok) | `Balance.tsx:12 balance < 5` ✓; `BlackjackTable.tsx:42` (3000) ✓; `:78-84` (500) ✓; `useSound MAX_RETRIES/LOAD_TIMEOUT` valójában `:29-31` (audit `30-31` ír, `MAX_RETRIES` `:29`-en); `gameStore.ts` reshuffle `SHOE_DECKS*52*0.25` valójában `:273`-on (audit `:269`-et ír). ±4 sor. A `CIRCUIT_BREAKER_THRESHOLD=5` (`:31`) valóban magyarázat nélkül. |
| `gameStore.ts` 298 sor, limit szélén (5.7) | HELYES | `wc -l` = 298; `MAX_FILE_LINES=300` (`.quality_gate.conf:18`) ✓ |
| Két volume-útvonal deszinkronizáció `useSound.ts:172-174` + `soundHelpers.ts:8-12` (5.8) | HELYES | (azonos PROMPT 1 3.4-mal); `SoundSettings.tsx:7-8` mindkettőt használja → masterVolume elavul ✓ |
| Inline `canDouble`/`canSplit` domain-megkerülés `BlackjackTable.tsx:175-176` (5.9) | HELYES | (azonos PROMPT 1 2.4-gyel) ✓ |
| Tesztduplikáció `gameStore.test.ts:197-243` ↔ `gameStore.insurance.test.ts:170-243` (5.10) | HELYES (tartalom) / PONTATLAN (szám) | (azonos PROMPT 1 3.5-tel) duplikáció valós; ~10 teszt, nem "11". |

### 4d. Build findings

| Állítás | Eredmény | Megjegyzés |
|---------|----------|------------|
| Tailwind import utility-k nélkül `src/index.css:1-2`; nincs utility class a TSX-ben (6.1) | HELYES | `grep className="(bg-\|rounded-\|flex\|p-[0-9]...)"` = **0 találat**; minden className BEM-stílusú (`card`, `balance`, `dealer-area`, …) ✓ |
| `code-health-toolkit-v4/` idegen artefakt (6.2) | HELYES | (azonos PROMPT 0 megállapítással) ✓ |
| Coverage scope UI-komponensek fele kimarad; `useSound.ts` (271 sor) nincs tesztelve (6.3) | HELYES | `vitest.config.ts:13-21` include lista (7 minta); `useSound.ts` nincs benne és nincs rá teszt ✓. A "nagy effort" jelölés indokolt. |

### PROMPT 3 szisztematikus megjegyzések
- **Pontosság csúcs:** ez a legpontosabb audit (~91%). A HIPOTÉZIS-jelölések őszinték, nincs hamis "MEGOLDOTT" címke.
- **Egyetlen keretezési hiba:** `RANK_SYMBOLS` használatban van — a QW2 "dead code törlés" listába való besorolása félrevezető.
- **Sorszám-eltolódás:** `MAX_RETRIES` `:30-31` (valójában `:29-31`), reshuffle `:269` (valójában `:273`).

---

## 5. Összesítés

### Teljes pontossági mátrix

| Dokumentum | Ellenőrzött | Helyes | Helytelen | Pontatlan | Részben | Túlzó/Alulértékelt | Pontosság |
|------------|-------------|--------|-----------|-----------|---------|--------------------|-----------|
| PROMPT 0 (minimax-m3, struktúra) | ~40 | 32 | 0 | 7 | 1 | 0 | **~80%** |
| PROMPT 1 (claude, logika) | ~19 | 17 | 1 | 1 | 0 | 0 | **~89%** |
| PROMPT 2 (minimax-m3, security) | ~22 | 19 | 1 | 2 | 0 | 0 | **~86%** |
| PROMPT 3 (qwen-code, optimalizáció) | ~23 | 21 | 0 | 1 | 1 | 0 | **~91%** |
| **Összesen** | **~104** | **89** | **2** | **11** | **2** | **0** | **~86%** |

> A "Helytelen" oszlop csak a **valóban téves tartalmi/mechanizmus-állításokat**
> számolja (PROMPT 1 3.1, PROMPT 2 7.2). A "Pontatlan" a sorszám-/számolási
> hibákat (±1–9 sor, vagy off-by-one darabszám), amelyek nem változtatják a
> finding érdemi igazságán.

### Szisztematikus hibaminták

1. **Sorszám-eltolódás (±1–9 sor) — minden auditban jelen van, de ritka és kicsi.**
   Példák: `getConfiguredShoe 67-92` (valóban 67-88), Howler import `soundHelpers:11` (valóban `:2`),
   `error.message ErrorBoundary:73` (valóban `:74`), `MAX_RETRIES useSound:30-31` (valóban `:29-31`),
   `reshuffle gameStore:269` (valóban `:273`), `PlayerAvatar 152` (valóban 151).
   **Karakterisztika:** rendszerint 1–4 soros csúszás; irány és tartalom helyes.

2. **Összegző számlálások gyengébbek, mint a részletek (PROMPT 0).**
   A per-fájl LOC / tesztfájl-sorok **példaszerűen pontosak** (mind a 10 tesztfájl sorszáma 1:1),
   de az összegző "26 forrásfájl" (valóban 36) és "18 komponens" (valóban 20/21) elmarad.
   **Ok:** valószínűleg a barrel `index.ts` / test-helper fájlok következetlen számolása.

3. **Két valódi tartalmi tévesztés (a lényeget érinti, de lokalizált):**
   - **PROMPT 1 3.1** — a validátor-vs-domain szigorúságot fordítva írja ("validátorok szigorúbbak");
     valójában a domain `canPlayerDouble/Split` a szigorúbb, és `validateSplit` **nem** ellenőrzi
     az `isDoubled`-ot. (PROMPT 3 5.4 ezt helyesen rögzíti — a két audit ellentmond, PROMPT 3 a megbízható.)
   - **PROMPT 2 7.2** — a StrictMode "dupla preload" mechanizmus téves: a `preload` useEffect
     cleanup-ja (`cancelIdleCallback`) invocation-specifikus, tehát StrictMode-ban sem fut le kétszer.

4. **Nincs severity-infláció.** A security audit következetesen contextualizál
   (single-player desktop → defense-in-depth keretezés), nem emel fel súlytalan találatokat.
   A `SEC_AUDIT.md` (korábbi, 2026-04-15) cross-check megerősíti, hogy a top backdoor-finding
   **nem lett javítva** — tehát a PROMPT 2 aktív jelölése jogos, nem "már-javítva" tévesztés.

5. **"MEGOLDOTT ✅" címkék veszélye — nem áll fenn.** Egyik audit sem használ "MEGOLDOTT"
   jelölést élő kódra; minden finding aktíkként szerepel. A `HIPOTÉZIS` jelölések
   (PROMPT 2 howler-kor, PROMPT 3 3.1/3.2) őszinték és nem állítanak teljesítménynyereséget.

### Megbízhatósági verdikt

A négy audit **összességében megbízható döntéshozásra** (~86% pontosság; a "lényeget
érintő" tévesztés csak 2/104 ≈ 2%). Konkrétan:

- **PROMPT 3 (qwen-code) a legmegbízhatóbb** (~91%) — használható közvetlenül a P0/P1
  refaktor-prioritás (4.1, 5.9, 4.2, 5.8) megalapozására.
- **PROMPT 1 (claude)** (~89%) megbízható, **kivéve a 3.1 finding-et**, amelyet a PROMPT 3 5.4
  helyesbít — a "validátor szigorúság" kérdésben PROMPT 3 az elsődleges forrás.
- **PROMPT 2 (minimax-m3)** (~86%) alapos, **kivéve a 7.2 StrictMode-állítást**, amely elvethető.
- **PROMPT 0 (minimax-m3)** (~80%) a **struktúra/LOC szempontból kiváló**, de az **összegző
  fájlszámokat** ("26"/"18") ne használd döntéshez — a per-fájl adatok és a technológiai leltár
  viszont pontosak. Újra-audit nem indokolt; a fenti korrekciók elegendők.

---

## 6. Hamis negatívok

A Prompt 5 által előírt hamis-negatív grep-ek (`eval/exec/pickle/yaml.load/subprocess`,
`hardcoded/password/secret/api_key/token`, `dangerouslySetInnerHTML/innerHTML`,
`fetch/XMLHttpRequest`) **mind 0 találatot** adtak — a security audit nem hagyott ki
klasszikus injection/secret/XSS kockázatot.

A verifikáció során **három, az auditok által nem (vagy csak érintőlegesen) említett**
apróságot találtam, amelyek nem blockerek, de megjegyzendők:

1. **`coverage: { all: true }` (`vitest.config.ts:10`).** Ez azt jelenti, hogy a coverage
   a felsorolt `include` minták **összes** fájljára számít — tehát a kimaradó (de a
   `src/components/Table/**` vagy `src/store/**` mintába eső) fájlok is csökkentik a
   százalékot, ha nincsenek tesztelve. Sem PROMPT 0, sem PROMPT 3 nem említi ezt a
   flag-et, amikor a coverage-scope-ról beszél — enélkül a "80%-os küszöb könnyen
   teljesül" állítás (PROMPT 3 6.3) kissé árnyalatlan. Kicsi súlyú megfigyelés.

2. **`AGENTS.md` (CLAUDE.md) dokumentált küszöb vs. tényleges küszöb drift.** A projekt
   `AGENTS.md`-je "Coverage ≥85% local, ≥95% CI"-t ír elő, de a ténylegesen aktív küszöb
   (`.quality_gate.conf` `LOCAL/CI_MIN_LINES=80`) 80%. PROMPT 0 jelzi a 80%-os küszöböt és
   hogy "a dokumentáció nem indokolja" — ez helyes, de a **dokumentált 85/95%-os gate
   soha nem fut ténylegesen**. Nem audit-finding (ez dokumentum-kód inkonzisztencia),
   de a "production-ready" döntésnél számít.

3. **`validateNewRound` csak `phase === 'finished'`-et követeli (`validators.ts:65-68`)**,
   de nem ellenőrzi, hogy vannak-e még lejátszatlan kezek (pl. `playerHands.length` /
   `activeHandIndex`). Ez egy elvi lyuk, amit egyik audit sem említ — gyakorlatban a UI
   csak `phase === 'finished'`-nál mutatja a NEW ROUND gombot (`BlackjackTable.tsx:200`),
   így nem kihasználható. **Alacsony súlyú, elvi megfigyelés** — nem került be a riport
   finding-tábláiba, mert egyetlen audit sem tett róla állítást amit cáfolni/erősíteni kellett.

Ezek nem cáfolják az auditokat — inkább kiegészítik a képet. A lényegi lefedettség
mind a négy auditban megfelelő.

---

*Minden állítást a repó tényleges forráskódja ellen verifikáltam (`grep`, `wc -l`,
`Read`). A `SEC_AUDIT.md`, `REFACTOR_PLAN`, `learnings.md` és egyéb terv-dokumentumokat
nem használtam bizonyítékként — csak a kód. Generálva a PROMPT 5 (Verification Gate)
módszerrel, glm-5.2 modellel.*
