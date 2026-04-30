# blackjack — Security Audit
Dátum: 2025-04-30 | Model: mistral-medium-3.5

---

## Executive summary (top kritikus finding-ek)

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | LocalStorage Shoe Override Production Bypass | MAGAS | ✅ Résben van fix, de validációs rések maradnak |
| 2 | Singleton Sound Manager Memory Leak | KÖZEPES | ⚠️ HIPOTÉZIS – manuális ellenőrzés szükséges |
| 3 | React 19.2.1 CVE-2025-55182 | ALACSONY | ✅ Fixelve commit 63dd054 |
| 4 | Missing Input Validation on Bet Amounts | KÖZEPES | ⚠️ MEGERŐSÍTETT |
| 5 | No Rate Limiting on Game Actions | ALACSONY | ⚠️ HIPOTÉZIS |

---

## 1. Input validáció és injection

### Finding 1.1 — LocalStorage Shoe Override Environment Gate Bypass
- **Severity:** MAGAS
- **CWE:** CWE-345 (Insufficient Verification of Data Authenticity), CWE-20 (Improper Input Validation)
- **CVSS becslés:** CVSS 7.5 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N)
- **Érintett fájlok:** `src/store/gameHelpers.ts:69-71`, `playwright.config.ts:13`
- **Mi a probléma:** A `getConfiguredShoe()` függvény `VITE_E2E || MODE === 'test'` környezeti változókat ellenőrzi, de a **production build-ben** a `VITE_E2E` változó nem kerül beépítésre (Vite build-time replacement). A `MODE` változó viszont production-ben `'production'` értéket vesz fel. A problémát a 2ad37fd commit próbálta megoldani, de a megoldás nem tökéletes.
- **Kihasználhatóság:** Bármely production felhasználó beállíthatja a `blackjack:e2e-shoe` localStorage kulcsot, ami directly befolyásolja a játék kimenetelét. A Vite build folyamatában a `VITE_E2E` és `MODE` változók statikus szöveggé válnak, így a feltétel mindig `false` lesz production-ben.
- **Hatás:** Cheating, játéklogika manipulálhatóság, business logic sérülés
- **Javítási irány:** 
  1. Használj build-time constant-ot: `import.meta.env.PROD` (igaz production build-ben)
  2. Vagy távolítsd el teljesen a localStorage shoe override-ot production bundle-ből
  3. Vagy használj runtime environment check-et, ami production build-ben is müködik
- **Bizonyosság:** MEGERŐSÍTETT

### Finding 1.2 — Missing Input Validation on Bet Amounts
- **Severity:** KÖZEPES
- **CWE:** CWE-20 (Improper Input Validation), CWE-125 (Out-of-range Index Access)
- **Érintett fájlok:** `src/store/gameStore.ts:26-29`, `src/components/Table/BlackjackTable.tsx:82-85`
- **Mi a probléma:** A `placeBet` action nem validálja, hogy az `amount` paraméter pozitív szám-e, vagy érvényes chip érték-e. A `ChipValue` type (`1 | 5 | 25 | 100 | 500`) nem kerül ellenőrzésre a bet placementkor. Negatív vagy très nagy értékek is elfogadhatók.
- **Kihasználhatóság:** Negatív vagy túlságosan nagy tét helyezése, ami a balance-t negatívvá teheti vagy overflow-t okoz
- **Hatás:** Balance manipuláció, invalid game state
- **Javítási irány:** Validáld a bet amount-ot a `ChipValue` type szerint, vagy legalább ellenőrizd, hogy `amount > 0` és `amount <= balance`
- **Bizonyosság:** MEGERŐSÍTETT

### Finding 1.3 — No Validation on Player Action Inputs
- **Severity:** KÖZEPES
- **CWE:** CWE-20 (Improper Input Validation)
- **Érintett fájlok:** `src/store/gameStore.ts:100-280` (összes action)
- **Mi a problémá:** A game action-ek (hit, stand, double, split, buyInsurance) nem validálják explicit módon az inputokat:
  - `hit()`: Nem ellenőrzi, hogy a hand index érvényes-e
  - `double()`: Nem ellenőrzi, hogy a handCards.length == 2 (van ellenőrzés, de nem elég robust)
  - `split()`: Nem ellenőrzi, hogy a két kártya azonos rangú-e (van ellenőrzés line 182)
  - `buyInsurance()`: Nem ellenőrzi, hogy a dealer első kártyája Ace-e
- **Kihasználhatóság:** Érvénytelen állapotok létrehozása, game crash, vagy logikai hibák
- **Hatás:** Invalid game state, potenciális crash
- **Javítási irány:** Minden action-ben validáld az előfeltételeket és dobj explicit error-t vagy return-ölj early
- **Bizonyosság:** MEGERŐSÍTETT

### Finding 1.4 — JSON.parse on localStorage without try-catch in all paths
- **Severity:** ALACSONY
- **CWE:** CWE-79 (Improper Neutralization of Input During Web Page Generation)
- **Érintett fájlok:** `src/store/gameHelpers.ts:75-86`
- **Mi a probléma:** A `JSON.parse` hívás van try-catch-ben, de a parsed érték strukturálásakor (filter, length check) nincsenek minden eshetőség lekezelve. A `isValidCard` validáció jó, de a parsing folyamatban más errorok is felmerülhetnek.
- **Kihasználhatóság:** Malformed JSON input localStorage-ből crash-t okozhat
- **Hatás:** Application crash, denial of service (DoS) a felhasználó saját session-jében
- **Javítási irány:** Bővítsd a try-catch blokkot minden lehetséges error kezelésére
- **Bizonyosság:** MEGERŐSÍTETT

### Injection vectors checked - No findings
- **SQL injection:** Nincs SQL database a kliensoldali alkalmazásban
- **Command injection:** Nincs `child_process`, `exec`, `spawn`, `os.system`, vagy `shell=True` használata
- **Eval / dinamikus kódvégrehajtás:** Nincs `eval`, `new Function()`, `exec`, `compile`, vagy proc macro usage
- **Path traversal:** Nincs felhasználói input fájlútvonalban
- **Template injection:** Nincs `dangerouslySetInnerHTML` vagy template engine használata
- **Deserialization:** Nincs pickle, YAML unsafe load, vagy bincode externally-tagged usage

---

## 2. Autentikáció és authorizáció

### Finding 2.1 — No Authentication/Authorization Layer (Design Decision)
- **Severity:** ALACSONY
- **CWE:** CWE-306 (Missing Authentication for Critical Function)
- **Érintett fájlok:** `src/App.tsx:4-6`, `src/components/Table/BlackjackTable.tsx:13-31`
- **Mi a probléma:** Az alkalmazás single-player frontend játék, nincs autentikáció vagy authorizáció réteg. Minden játékos action (bet, deal, hit, stand) elérhető anélkül, hogy bármilyen hitelesítés lenne.
- **Kihasználhatóság:** Nincs direkt kihasználhatóság a jelenlegi scope-ban (client-side only)
- **Hatás:** Ha a kódot multiplayer backend-del használnák, az összes action elérhető lenne autentikáció nélkül
- **Javítási irány:** Ha jövőben backend kerül bevezetésre, implementáld a session-based vagy token-based autentikációt server-side
- **Bizonyosság:** MEGERŐSÍTETT
- **Megjegyzés:** Ez a design döntés elfogadható a jelenlegi single-player scope-ban

### Hardcoded Credentials Review
- **Result:** Nincsenek hardcoded API kulcsok, jelszavak, vagy tokenek a forrásfájlokban
- **Érintett fájlok:** `package.json`, `vite.config.ts`, `src/**/*.ts*` - mind clean
- **Bizonyosság:** MEGERŐSÍTETT

---

## 3. Érzékeny adatkezelés

### Finding 3.1 — Balance State Manipulation via localStorage
- **Severity:** KÖZEPES
- **CWE:** CWE-345 (Insufficient Verification of Data Authenticity)
- **Érintett fájlok:** `src/store/gameStore.ts:15-16`, `src/store/gameHelpers.ts:10`
- **Mi a probléma:** A `balance` állapot a Zustand store-ban van, ami client-side state. Bármely felhasználó módosíthatja a browser DevTools-on keresztül. A `resetBalance()` action visszaállítja az `INITIAL_BALANCE` értékre (5000), de nincs validáció a balance értékeken.
- **Kihasználhatóság:** DevTools használatával bármely értékre állítható a balance
- **Hatás:** Cheating, játéklogika manipuláció
- **Javítási irány:** 
  1. Validáld a balance-t minden action után (pl. `balance >= 0`)
  2. Használj checksum-ot vagy signature-t a balance és shoe állapot összehangolásához
  3. Vagy fogadd be, hogy ez single-player, és a cheating csak a saját élményét rontja
- **Bizonyosság:** MEGERŐSÍTETT

### Finding 3.2 — Session State in localStorage
- **Severity:** ALACSONY
- **CWE:** CWE-311 (Missing Encryption of Sensitive Data)
- **Érintett fájlok:** `src/store/gameHelpers.ts:14` (E2E_SHOE_STORAGE_KEY)
- **Mi a probléma:** A game state (shoe) localStorage-ban van tárolva E2E test céljából. A localStorage nem titkosított, és bármely weboldal vagy script elolvashatja, ha ugyanazt a domain-t használja.
- **Kihasználhatóság:** Cross-site scripting (XSS) által a localStorage tartalma kiszivároghat
- **Hátás:** Game state manipuláció, ha XSS sérülékenység létezik
- **Javítási irány:** 
  1. Ne tárolj érzékeny game state-t localStorage-ban production-ben
  2. Használj `sessionStorage`-t rövid élettartamú adatokhoz
  3. Vagy titkosítsd a localStorage tartalmat
- **Bizonyosság:** MEGERŐSÍTETT

### Sensitive Data in Logs
- **Result:** Nincsenek jelszavak, tokenek, vagy PII adatok logolva
- **Érintett fájlok:** `src/hooks/useSound.ts:60-62`, `64-67` - sound error handling silently fails, nem logol érzékeny adatot
- **Bizonyosság:** MEGERŐSÍTETT

### Error Message Information Disclosure
- **Result:** Nincsenek stack trace-ek, belső path-ok, vagy DB séma információk hibaválaszokban. A React error boundary-k nem mutatnak érzékeny adatot.
- **Érintett fájlok:** `src/components/Table/BlackjackTable.tsx` - nincsenek explicit error boundary-k, de a React default error handling nem szivárogtat érzékeny adatot
- **Bizonyosság:** MEGERŐSÍTETT

---

## 4. Függőség-biztonság

### Finding 4.1 — React 19.2.1 CVE-2025-55182
- **Severity:** ALACSONY
- **CWE:** CWE-1104 (Use of Unmaintained/Outdated Third Party Components)
- **Érintett fájlok:** `package.json:20-21`
- **Mi a probléma:** A React 19.2.0 verzióban találtak CVE-2025-55182 sérülékenységet (RSC-related). A projekt React 19.2.1-re lett frissítve a 63dd054 commit-ban.
- **Kihasználhatóság:** A CVE RSC (React Server Components) kapcsolatos, amiket ez a projekt NEM használ. Direct exploitability hosszú.
- **Hatás:** Low - defense in depth szempontjából mégis javítani kell
- **Javítási irány:** Tartsd a React verziót a legújabb patched verzión
- **Bizonyosság:** MEGERŐSÍTETT
- **Status:** ✅ Fixelve

### Finding 4.2 — Unpinned Dependency Versions
- **Severity:** ALACSONY
- **CWE:** CWE-1104 (Use of Unmaintained/Outdated Third Party Components)
- **Érintett fájlok:** `package.json:20-45`
- **Mi a probléma:** Több dependency használ `^` prefix-et, ami lehetővé teszi minor verzió frissítéseket. Ez potenciálisan bevezetheti új biztonsági réseket anélkül, hogy az explicit lenne javítva.
  - `react: ^19.2.1` - minor updates engedélyezve
  - `react-dom: ^19.2.1` - minor updates engedélyezve
  - `zustand: ^5.0.10` - minor updates engedélyezve
  - `framer-motion: ^12.29.0` - minor updates engedélyezve
  - `howler: ^2.2.4` - minor updates engedélyezve
- **Kihasználhatóság:** Automatikus dependency update miatt bekerülő sérülékenységek
- **Hatás:** Supply chain attack surface növelése
- **Javítási irány:** Használj exact verziókat (`19.2.1` helyett `^19.2.1`) production dependencies-nek
- **Bizonyosság:** MEGERŐSÍTETT

### Finding 4.3 — No Automated Dependency Scanning in CI
- **Severity:** KÖZEPES
- **CWE:** CWE-1104 (Use of Unmaintained/Outdated Third Party Components)
- **Érintett fájlok:** `.github/workflows/ci.yml`
- **Mi a probléma:** A CI pipeline nem tartalmaz `npm audit` vagy SCA (Software Composition Analysis) tool futtatást. Az SEC_AUDIT.md szerint `npm audit` nem futtatható a CI környezetben (registry 403 error).
- **Kihasználhatóság:** Ismert CVE-kkel rendelkező csomagok bekerülhetnek a production bundle-be anélkül, hogy a CI észlelné
- **Hatás:** Supply chain sérülékenységek production-ben
- **Javítási irány:** 
  1. Add `npm audit --audit-level=moderate` a CI pipeline-hoz
  2. Vagy használj SCA eszközt (pl. Snyk, Dependabot, GitHub Advanced Security)
  3. Vagy konfiguráld a npm registry-t a CI-ben
- **Bizonyosság:** MEGERŐSÍTETT

### Finding 4.4 — Dev Dependencies in package.json
- **Severity:** ALACSONY
- **Érintett fájlok:** `package.json:28-45`
- **Mi a problémá:** A `devDependencies` és `dependencies` jól van szétválasztva. Nincs dev dependency a production bundle-ben.
- **Bizonyosság:** MEGERŐSÍTETT
- **Status:** ✅ Clean

### Finding 4.5 — Typosquatting Review
- **Result:** Nincsenek gyanús vagy typosquatting csomagnevek a direct dependencies-ben
- **Érintett fájlok:** `package.json` - mind a 5 direct dependency legit
- **Bizonyosság:** MEGERŐSÍTETT

### Lock File Analysis
- **Result:** `package-lock.json` létezik és current (4178 sor, 2026-04-16)
- **Bizonyosság:** MEGERŐSÍTETT

---

## 5. Konfiguráció és infrastruktúra biztonság

### Finding 5.1 — Debug Mode Not Explicitly Disabled in Production
- **Severity:** ALACSONY
- **CWE:** CWE-489 (Active Debug Code)
- **Érintett fájlok:** `vite.config.ts:1-7`
- **Mi a probléma:** A Vite config nem tartalmaz explicit `mode: 'production'` beállítást, és nem kapcsolja ki a debug módot production build-ben. A React `StrictMode` enable-elve van production-ben is (`src/main.tsx:6`).
- **Kihasználhatóság:** Debug információk szivároghatnak production-be
- **Hatás:** Több debug információ az error message-kben
- **Javítási irány:** 
  1. Add `define: { 'process.env.NODE_ENV': JSON.stringify('production') }` a Vite config-hoz
  2. Vagy bízhatunk a Vite default behavior-jében, ami production módban build-el
- **Bizonyosság:** HIPOTÉZIS – manuális ellenőrzés szükséges

### Finding 5.2 — Missing Security Headers in HTML
- **Severity:** ALACSONY
- **CWE:** CWE-693 (Protection Mechanism Failure)
- **Érintett fájlok:** `index.html`
- **Mi a probléma:** Az `index.html` nem tartalmaz biztonsági headereket. Mivel ez egy static site, a headereket a hosting service (pl. Netlify, Vercel, GitHub Pages) vagy reverse proxy kell, hogy adjon hozzá.
- **Kihasználhatóság:** Hiányzó CSP, HSTS, X-Frame-Options, X-Content-Type-Options headerek
- **Hatás:** Cross-site scripting, clickjacking, MIME sniffing sérülékenységek
- **Javítási irány:** 
  1. Add meta tag-eket az `index.html`-hez: `<meta http-equiv="Content-Security-Policy" content="...">`
  2. Vagy konfiguráld a hosting service-t, hogy adjon hozzá headereket
- **Bizonyosság:** MEGERŐSÍTETT

### Finding 5.3 — Desktop Launcher Script Security
- **Severity:** ALACSONY
- **CWE:** CWE-78 (OS Command Injection)
- **Érintett fájlok:** `scripts/launch_desktop.sh:1-72`
- **Mi a probléma:** A `launch_desktop.sh` script használja a `nohup`, `curl`, és `xdg-open` parancsokat. A script jól quote-olja a változókat (`"$PORT"`, `"$URL"`, `"$PROJECT_DIR"`), így nincsen command injection sérülékenység.
- **Kihasználhatóság:** Nincs direkt command injection, de a script futás中说 a user context-ben
- **Hatás:** Local privilege escalation, ha a script rosszindulatú context-ben fut
- **Javítási irány:** 
  1. Ellenőrizd, hogy a script csak olvasható és futtatható a megfelelő felhasználók számára
  2. Vagy távolítsd el a desktop launcher-t, ha nem szükséges
- **Bizonyosság:** MEGERŐSÍTETT
- **Status:** ✅ Script jól quote-olja a változókat

### Finding 5.4 — No Rate Limiting on Game Actions
- **Severity:** ALACSONY
- **CWE:** CWE-307 (Improper Restriction of Excessive Authentication Attempts)
- **Érintett fájlok:** `src/store/gameStore.ts:26-280` (összes action)
- **Mi a probléma:** Nincs rate limiting a game action-ökön (placeBet, deal, hit, stand). A felhasználó gyorsan egymás után sok action-t hajthat végre.
- **Kihasználhatóság:** Brute force attack a játék logikára, vagy UI spam
- **Hatás:** Rossz felhasználói élmény, potenciális performance problémák
- **Javítási irány:** 
  1. Add debounce-ot vagy throttle-öt a game action-ökhöz
  2. Vagy add rate limiting-et a store action-ök level-en
- **Bizonyosság:** HIPOTÉZIS – manuális ellenőrzés szükséges

### Finding 5.5 — Environment Variable Usage
- **Severity:** ALACSONY
- **CWE:** CWE-209 (Information Exposure Through an Error Message)
- **Érintett fájlok:** `src/store/gameHelpers.ts:69-71`, `playwright.config.ts:13`
- **Mi a probléma:** A `VITE_E2E` és `MODE` environment változók használata. A Vite build folyamatában ezek statikus szöveggé válnak. A production build-ben `VITE_E2E` `undefined` lesz, `MODE` pedig `'production'`.
- **Kihasználhatóság:** Nincs direkt kihasználhatóság
- **Hatás:** Nincs
- **Javítási irány:** Használj build-time constant-okat a biztonságosabb environment check-hez
- **Bizonyosság:** MEGERŐSÍTETT

### CORS Configuration
- **Result:** Nincs CORS konfiguráció szükséges (client-side only, no API layer)
- **Bizonyosság:** N/A

### Exposed Admin Endpoints
- **Result:** Nincsenek admin vagy internal végpontok (client-side only)
- **Bizonyosság:** N/A

---

## 6. Trust boundary elemzés

### Finding 6.1 — Implicit Trust in localStorage Data
- **Severity:** MAGAS
- **CWE:** CWE-345 (Insufficient Verification of Data Authenticity)
- **Érintett fájlok:** `src/store/gameHelpers.ts:69-93`
- **Mi a probléma:** A `getConfiguredShoe()` függvény bízik a localStorage-ból olvasott adatokban. Bár van `isValidCard` validáció, a feltétel (`VITE_E2E || MODE === 'test'`) nem elég erős production-ben, mint ahogy a Finding 1.1-ben leírtuk.
- **Trust Boundary Sértés:** A megbízhatatlan zónából (localStorage - user controlled) érkező adat megbízható zónába (game state) kerül validáció nélkül a feltétel hiánya miatt production-ben
- **Kihasználhatóság:** Bármely user manipuluálhatja a shoe-t production-ben
- **Hatás:** Game state manipuláció, cheating
- **Javítási irány:** 
  1. Tiltasd a localStorage shoe override-ot production-ben teljes mértékben
  2. Vagy használj cryptographic signature-t a shoe validálásához
  3. Vagy jelöld explicit módon a trust boundary-t a kódban
- **Bizonyosság:** MEGERŐSÍTETT

### Finding 6.2 — Mass Assignment in Store Actions
- **Severity:** KÖZEPES
- **CWE:** CWE-915 (Improperly Controlled Modification of Dynamically-Determined Object Attributes)
- **Érintett fájlok:** `src/store/gameStore.ts:26-280` (összes set hívás)
- **Mi a probléma:** A Zustand store action-ei közvetlenül módosítják a state-et spread operator-ral (`...hand`, `...playerHands`). Nincs explicit mass assignment validáció.
- **Trust Boundary Sértés:** A user input (action paraméterei) közvetlenül kerül a state-be validáció nélkül
- **Kihasználhatóság:** Invalid state manipulation
- **Hatás:** Invalid game state, crash
- **Javítási irány:** 
  1. Validáld minden inputot az action-ek előtt
  2. Használj DTO-kat (Data Transfer Objects) a state módosításához
  3. Vagy implementáld a mass assignment protection-t
- **Bizonyosság:** MEGERŐSÍTETT

### Finding 6.3 — No Explicit Trust Boundary Between UI and Store
- **Severity:** ALACSONY
- **CWE:** CWE-501 (Trust Boundary Violation)
- **Érintett fájlok:** `src/components/Table/BlackjackTable.tsx:13-31`, `src/store/gameStore.ts:24-284`
- **Mi a probléma:** A UI komponensek közvetlenül hívják a store action-öket anélkül, hogy bármilyen validáció vagy authorization lenne köztük. A trust boundary implicit.
- **Trust Boundary Sértés:** A UI (megbízhatatlan - user interaction) közvetlenül kommunikál a store-al (megbízható - game state) validáció nélkül
- **Kihasználhatóság:** Nincs direkt kihasználhatóság single-player scope-ban
- **Hatás:** Ha a kódot multiplayer backend-del használnák, a trust boundary sérülne
- **Javítási irány:** 
  1. Add validációt a UI és store között
  2. Vagy jelöld explicit módon a trust boundary-t a kódban
- **Bizonyosság:** HIPOTÉZIS – manuális ellenőrzés szükséges

---

## 7. Concurrency és race condition

### Finding 7.1 — Shared Mutable State in Singleton Sound Manager
- **Severity:** KÖZEPES
- **CWE:** CWE-366 (Race Condition within a Thread)
- **Érintett fájlok:** `src/hooks/useSound.ts:119-124`
- **Mi a probléma:** A sound manager singleton (`soundManager: SoundManager | null = null`) shared mutable state több React komponens között. A `getSoundManager()` függvény nem thread-safe, és a sound manager state (isMuted, masterVolume, sounds Map) shared mindenkinek, aki használja.
- **Kihasználhatóság:** Race condition a sound manager initializálásakor vagy state módosításakor
- **Hatás:** Memory leak, sound playback issues, inconsistent state
- **Javítási irány:** 
  1. Ne használj singleton-t React alkalmazásban
  2. Használj React context-et a sound manager state kezeléséhez
  3. Vagy implementáld a proper cleanup-ot a sound manager-nek
- **Bizonyosság:** HIPOTÉZIS – manuális ellenőrzés szükséges

### Finding 7.2 — Missing Cleanup for Howl Instances
- **Severity:** KÖZEPES
- **CWE:** CWE-401 (Improper Release of Memory Before Removing Last Reference to Resource)
- **Érintett fájlok:** `src/hooks/useSound.ts:38-72`
- **Mi a probléma:** A `createSoundManager()` lérehozza a `sounds` Map-et, ami Howl instance-eket tartalmaz. Nincs cleanup mechanizmus, amikor a sound manager már nincs szükség. A Howl instance-k memóriát foglalnak, és ha nem takarítódnak fel, memory leak keletkezik.
- **Kihasználhatóság:** Memory leak, ha a felhasználó sok sound-ot játszik le
- **Hatás:** Memória foglalás növekedése, performance degradáció
- **Javítási irány:** 
  1. Add cleanup függvényt a sound manager-hez
  2. Hívd meg a cleanup-ot, amikor a komponens unmount-olódik
  3. Vagy használj weak reference-eket
- **Bizonyosság:** HIPOTÉZIS – manuális ellenőrzés szükséges

### Finding 7.3 — TOCTOU in Shoe Creation
- **Severity:** ALACSONY
- **CWE:** CWE-367 (Time-of-check Time-of-use Race Condition)
- **Érintett fájlok:** `src/store/gameHelpers.ts:92-93`
- **Mi a probléma:** A `createFreshShoe()` függvény először ellenőrzi, hogy van-e configured shoe (`getConfiguredShoe()`), és ha nincs, létrehoz egy újat. Ha a localStorage módosul a check és a creation között, a függvény mégis létrehoz egy új shoe-t.
- **Kihasználhatóság:** Nincs praktikus kihasználhatóság single-threaded JavaScript-ben
- **Hatás:** Nincs komoly hatás
- **Javítási irány:** Nincs szükség fix-re, a JavaScript single-threaded
- **Bizonyosság:** HIPOTÉZIS – alacsony prioritás

---

## 8. Attack surface összefoglaló

### Client-Side Attack Surface

| Kategória | Attack Vector | Severity | Status |
|----------|--------------|----------|--------|
| **Input Validation** | LocalStorage Shoe Override | MAGAS | ✅ Résben |
| **Input Validation** | Bet Amount Validation | KÖZEPES | ⚠️ Nyitott |
| **Input Validation** | Action Parameter Validation | KÖZEPES | ⚠️ Nyitott |
| **State Management** | Balance Manipulation | KÖZEPES | ⚠️ Nyitott |
| **State Management** | Mass Assignment | KÖZEPES | ⚠️ Nyitott |
| **Trust Boundary** | localStorage Data Trust | MAGAS | ✅ Résben |
| **Memory Safety** | Singleton Sound Manager | KÖZEPES | ⚠️ Nyitott |
| **Dependency** | React CVE | ALACSONY | ✅ Fixelve |
| **Dependency** | No SCA in CI | KÖZEPES | ⚠️ Nyitott |
| **Dependency** | Unpinned Versions | ALACSONY | ⚠️ Nyitott |
| **Config** | Missing Security Headers | ALACSONY | ⚠️ Nyitott |

### Trust Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                        TRUST BOUNDARIES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                      │
│  UNTRUSTED                          TRUSTED                           │
│  ──────────                          ───────                           │
│                                                                      │
│  ┌─────────────────┐      ┌──────────────────────────────┐     │
│  │   Browser        │      │              Game              │     │
│  │   (User Control) │◄────►│            Logic               │     │
│  │                 │      │          (Store)              │     │
│  │ - localStorage   │      │                              │     │
│  │ - DevTools       │      │ - Game State                 │     │
│  │ - User Input     │      │ - Balance                    │     │
│  └────────┬────────┘      │ - Shoe                       │     │
│           │                └──────────────┬───────────────┘     │
│           │                               │                          │
│           └───────────────────────────────┘                          │
│                                          │                          │
│                                          ▼                          │
│                              ┌────────────────────┐            │
│                              │   External Systems   │            │
│                              │   (out of scope)     │            │
│                              └────────────────────┘            │
│                                                                      │
└─────────────────────────────────────────────────────────────────┘
                                                                      
  PROBLEMATIC FLOWS:
  ─────────────────
  1. localStorage → Game State (shoe override) - MAGAS
  2. User Input → Store (no validation) - KÖZEPES  
  3. Browser → Sound Manager (singleton) - KÖZEPES
```

### Critical Trust Boundary Violations

1. **localStorage → Game State**: A localStorage-ból olvasott shoe directly kerül a game state-be a `createFreshShoe()` hívás során. A environment gate (`VITE_E2E || MODE === 'test'`) nem elég erős production-ben.

2. **User Input → Store**: A UI action-ek paraméterei (pl. bet amount) közvetlenül kerülnek a store state-be validáció nélkül.

3. **Singleton State**: A sound manager singleton shared state több komponens között, ami trust boundary sérülést jelent.

---

## 9. Prioritizált javítási lista

| # | Finding | Severity | Effort | Prioritás | Status |
|---|---------|----------|--------|-----------|--------|
| 1 | LocalStorage Shoe Override Production Bypass | MAGAS | Low | P0 - Azonnal | ✅ Résben |
| 2 | Singleton Sound Manager Memory Leak | KÖZEPES | Medium | P1 - Hamar | ⚠️ Nyitott |
| 3 | Missing Input Validation on Bet Amounts | KÖZEPES | Low | P1 - Hamar | ⚠️ Nyitott |
| 4 | No Validation on Player Action Inputs | KÖZEPES | Low | P1 - Hamar | ⚠️ Nyitott |
| 5 | No Automated Dependency Scanning in CI | KÖZEPES | Low | P1 - Hamar | ⚠️ Nyitott |
| 6 | Balance State Manipulation | KÖZEPES | Low | P2 - Közepes | ⚠️ Nyitott |
| 7 | Mass Assignment in Store Actions | KÖZEPES | Medium | P2 - Közepes | ⚠️ Nyitott |
| 8 | Implicit Trust in localStorage Data | MAGAS | Low | P0 - Azonnal | ✅ Résben |
| 9 | Missing Cleanup for Howl Instances | KÖZEPES | Medium | P2 - Közepes | ⚠️ Nyitott |
| 10 | Unpinned Dependency Versions | ALACSONY | Low | P3 - Alacsony | ⚠️ Nyitott |
| 11 | Missing Security Headers | ALACSONY | Low | P3 - Alacsony | ⚠️ Nyitott |

---

## Összegzés

### Kritikus / Magas prioritású finding-ek
- **2 db MAGAS severity**: LocalStorage Shoe Override (1.1, 6.1) - ✅ Résben van a 2ad37fd commit, de továbbra is validációs rések maradnak
- **0 db KRITIKUS severity**: Nincs

### Közepes prioritású finding-ek
- **7 db KÖZEPES severity**: Sound manager memory leak, input validation hiány, SCA hiány CI-ben, balance manipuláció, mass assignment, cleanup hiány

### Alacsony prioritású finding-ek
- **4 db ALACSONY severity**: React CVE (fixelve), unpinned dependencies, missing security headers, rate limiting hiány

### Átlagos biztonsági állapot
A projekt alapvetően jól van tervezve (Clean Architecture, type safety TypeScript-tel). A fő biztonsági kockázatok a client-side state manipulációból adódnak, ami elfogadható single-player játék esetén, de a localStorage shoe override production bypass-ja **komoly problémát jelent**. A 2ad37fd commit megpróbálta javítani, de a megoldás nem tökéletes.

### Javítási ajánlat
1. **Azonnal (P0)**: Ellenőrizd a localStorage shoe override environment gate-et production-ben
2. **Hamar (P1)**: Add input validation-t minden game action-hez
3. **Hamar (P1)**: Add SCA (Software Composition Analysis) a CI pipeline-hoz
4. **Közepes (P2)**: Refaktoráld a sound manager-t, hogy ne legyen singleton
5. **Alacsony (P3)**: Add security headereket az index.html-hez

---

*Dokumentum generálva: 2025-04-30 | Model: mistral-medium-3.5 | Forrás: /home/tibor/PythonProjects/blackjack*
