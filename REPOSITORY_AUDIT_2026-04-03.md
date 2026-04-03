# Teljes repository audit (security + performance)

Dátum: 2026-04-03
Scope: `/workspace/blackjack` teljes repo (alkalmazáskód, e2e, build/launch script, konfigurációk).

## 1) Executive summary

A projekt jelenleg egy kliensoldali (React + Zustand) blackjack alkalmazás backend nélkül. Emiatt a klasszikus webes auth/authz, session/token, CSRF, SSRF támadási felület nagy része nem releváns a jelen implementációra. A legnagyobb **valódi** kockázat az, hogy a játéklogika és az RNG teljesen a kliensen fut, és egy dokumentált E2E-localStorage override jelenleg production path-on is aktív; ez a játékmenet determinisztikus manipulációját lehetővé teszi. Ha bármilyen pénzügyi vagy verseny-integritási tét kapcsolódik a játékhoz, ez kritikus.

Teljesítmény oldalon a legnagyobb költség a kártyahúzás/dealer logika tömb-másolási mintázata (repeated spread/slice), illetve az, hogy a fő komponens a teljes Zustand state-re van feliratkozva, így minden state-változás globális újrarenderelést triggerel.

## 2) Top 10 finding (prioritás szerint)

### F1 — Kliensoldali shoe-manipuláció productionben is engedélyezett
- **Severity:** Critical
- **Érintett fájlok:** `src/store/gameHelpers.ts`, `e2e/game-flow.spec.ts`
- **Mi a probléma:** A `createFreshShoe()` minden körben figyelembe veszi a `localStorage`-ből olvasott `blackjack:e2e-shoe` értéket, nincs env-gate vagy build-time tiltás productionre.
- **Miért kockázat / drága:** Böngészőkonzolból tetszőleges lap-sorrend adható meg, így a round outcome manipulálható.
- **Hogyan validálnám:** DevTools-ban `localStorage.setItem('blackjack:e2e-shoe', JSON.stringify([...]))`, majd új kör indítás; ellenőrizd, hogy a kiosztás reprodukálható.
- **Minimális javítás:** E2E override csak `import.meta.env.MODE === 'test'` vagy explicit `VITE_ENABLE_E2E_SHOE=true` esetén legyen aktív.

### F2 — Trust boundary hiba: játékintegritás teljesen kliensoldali
- **Severity:** High
- **Érintett fájlok:** `src/store/gameStore.ts`, `src/logic/deck.ts`, `src/logic/rules.ts`
- **Mi a probléma:** Balance, betek, payout és RNG mind a kliensen futnak.
- **Miért kockázat / drága:** Tamperelhető állapot (store mutation, JS hooking). Valódi értékű játék esetén business-critical integritási rés.
- **Hogyan validálnám:** DevTools + runtime patch (`useGameStore.setState(...)`) és/vagy function monkey-patch az RNG körül.
- **Minimális javítás:** Szerveroldali authoritative game engine + aláírt round state + kliens csak megjelenítés.

### F3 — Zustand globális subscribe miatt felesleges újrarenderelés
- **Severity:** High (performance)
- **Érintett fájlok:** `src/components/Table/BlackjackTable.tsx`
- **Mi a probléma:** `useGameStore()` selector nélkül a teljes store-ra subscribel; bármely state változás újrarendereli a top-level táblát.
- **Miért kockázat / drága:** Több animált child komponenssel nő a frame-time és a re-render count.
- **Hogyan validálnám:** React DevTools Profiler; action-önkénti render count összehasonlítás selectoros refaktor előtt/után.
- **Minimális javítás:** Szelektorokra bontás (`useGameStore(s => s.balance)`, stb.) vagy `shallow` object selector.

### F4 — O(n²)-közeli tömbmásolási minta card dealing hot path-ban
- **Severity:** High (performance)
- **Érintett fájlok:** `src/logic/deck.ts`, `src/logic/rules.ts`, `src/store/gameStore.ts`
- **Mi a probléma:** `dealCard` és `dealOneCard` minden húzásnál `[card, ...remaining]` mintát használ; ez minden draw-nál új tömböt másol.
- **Miért kockázat / drága:** Kisebb shoe esetén is felesleges memória-allokáció/GC; mobilon érezhető jitter.
- **Hogyan validálnám:** Microbenchmark (100k deal loop) + Performance panel heap allocation profiling.
- **Minimális javítás:** Index pointeres shoe cursor, vagy mutábilis pop/shift stratégia kontrollált immutability boundary-vel.

### F5 — Keverés közben túl sok kripto-RNG hívás és allokáció
- **Severity:** Medium-High (performance)
- **Érintett fájlok:** `src/logic/deck.ts`
- **Mi a probléma:** Minden iterációban új `Uint32Array(1)` + `crypto.getRandomValues` hívás történik.
- **Miért kockázat / drága:** Extra CPU és allocation overhead shuffle idején.
- **Hogyan validálnám:** Benchmark jelenlegi shuffle vs blokkos random bufferrel.
- **Minimális javítás:** Batch random buffer (pl. 1024 uint32/ciklus), és abból fogyasztás.

### F6 — Input validation hiány: negatív vagy null bet átcsúszhat programozott hívásból
- **Severity:** Medium (security/integrity)
- **Érintett fájlok:** `src/store/gameStore.ts`
- **Mi a probléma:** `placeBet(amount)` csak `balance >= amount` feltételt ellenőriz; `amount <= 0` nincs tiltva.
- **Miért kockázat / drága:** UI most szűr, de store API közvetlenül hívható; negatív bet balance növeléshez vezethet.
- **Hogyan validálnám:** Unit teszt + `useGameStore.getState().placeBet(-100)`.
- **Minimális javítás:** Guard: `if (!Number.isFinite(amount) || amount <= 0) return;`.

### F7 — Timeout lifecycle kezelés hiányos round-end sound effectnél
- **Severity:** Medium (performance/stability)
- **Érintett fájlok:** `src/components/Table/BlackjackTable.tsx`
- **Mi a probléma:** `setTimeout`-ok nincsenek takarítva effect cleanup-ben.
- **Miért kockázat / drága:** Unmount/phase váltás esetén stale callback futhat, extra hang/event és nehezebb debuggolhatóság.
- **Hogyan validálnám:** Gyors phase-váltás + unmount szimuláció tesztben fake timerrel.
- **Minimális javítás:** timeout id tárolás és cleanup return az effectből.

### F8 — Duplikált `useSound()` példányok és click-listener overhead
- **Severity:** Medium (performance/maintainability)
- **Érintett fájlok:** `src/hooks/useSound.ts`, `src/components/Table/BlackjackTable.tsx`, `src/components/UI/SoundSettings.tsx`
- **Mi a probléma:** `useSound` több komponensből hívva mindegyik külön effecttel `document.click` listenert regisztrál.
- **Miért kockázat / drága:** Felesleges globális listener churn és nehezebben követhető audio state ownership.
- **Hogyan validálnám:** Event listener count ellenőrzés DevTools-ból mount/unmount után.
- **Minimális javítás:** Központi SoundProvider/context singleton state + egyszeri preloading trigger.

### F9 — CSP/security header hiány static entrypointon
- **Severity:** Medium-Low (security hardening)
- **Érintett fájlok:** `index.html`, deploy környezet
- **Mi a probléma:** Nincs deklarált CSP/meta security policy; hardening alaplépések hiányoznak.
- **Miért kockázat / drága:** XSS impactet erősítheti, ha később dinamikus input/render kerül be.
- **Hogyan validálnám:** Response header audit (`Content-Security-Policy`, `X-Content-Type-Options`, stb.).
- **Minimális javítás:** Szigorú CSP header deployment szinten (nonce/hash alapú script policy).

### F10 — Local launch script /tmp log fájlkezelése nem hardeningelt
- **Severity:** Low (local security)
- **Érintett fájlok:** `scripts/launch_desktop.sh`
- **Mi a probléma:** Fix `/tmp/blackjack-build.log` és `/tmp/blackjack-preview.log` pathok.
- **Miért kockázat / drága:** Multi-user hoston symlink/hijack lehetőség (lokális threat model).
- **Hogyan validálnám:** Symlink előkészítés teszt multi-user környezetben.
- **Minimális javítás:** `mktemp` használat és biztonságos jogosultságok.

## 3) Quick wins

1. E2E shoe override env-gatelése (prod tiltás).
2. `placeBet` input guard (`amount > 0` és finiteszám-check).
3. `BlackjackTable` selectoros Zustand használat.
4. Timeout cleanup a round-end effectben.
5. `mktemp` a desktop launcher logokhoz.

## 4) High impact / high effort

1. Szerveroldali authoritative játékmotor + kliensoldali állapot hitelesítése.
2. Shoe kezelés refaktor index pointerre (immutability boundary átgondolásával).
3. Audio kezelés centralizálása Context/Provider rétegbe.
4. Teljesítményprofil-alapú render optimalizáció (memoization + selector-stratégia) több komponensszinten.

## 5) Top 5 azonnali teendő

1. **Azonnal** kapcsold ki a localStorage shoe override-ot productionben.
2. Vezess be store-szintű validációt minden pénzügyi műveletre (`placeBet`, `double`, `split`, insurance).
3. Refaktoráld a `useGameStore()` használatot granular selectorokra a top-level komponensekben.
4. Javítsd a deal/húzás logikát olyan adatszerkezetre, ami nem másolja a teljes maradék shoe-t minden draw-nál.
5. Állíts be deploy oldali security headereket (különösen CSP).

## 6) Opcionális PR/patch javaslatok

- **PR-A (gyors, alacsony kockázat):** E2E gate + bet validation + timeout cleanup + mktemp log.
- **PR-B (közepes):** Zustand selector refaktor a fő UI komponensekben.
- **PR-C (nagy):** Shoe/deal engine optimalizálása cursoros modellre benchmarkkal és regressziós tesztekkel.
- **PR-D (stratégiai):** Backend authoritative game service design + signed round protocol.

## Bizonytalanságok / megjegyzések

- Auth/authz, session, token, CSRF, SSRF témák többsége jelenleg nem értékelhető mélyen, mert nincs backend API a repóban.
- Dependency sérülékenységek automatizált auditja ebben a környezetben `npm audit` 403 miatt nem futott le, ezért supply-chain kockázatbecslés részben korlátozott.
