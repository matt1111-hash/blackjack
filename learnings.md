# learnings.md — permanens projekt-állapot

> Harness- és modellfüggetlen memória. Session-elején ELŐSZÖR ezt olvassa
> (főleg az `AKTUÁLIS ÁLLAPOT` blokkot); session-végén / váltás előtt frissítsd.
> Az AGENTS.md / CLAUDE.md írja le a pontos kötelező lépéseket.

---

## AKTUÁLIS ÁLLAPOT
<!-- Ezt a blokkot minden váltás előtt FELÜLÍRJÁK (nem append). Ez a folytatási pointer. -->

- **Aktív feladat:** P0/P1 optimalizációs javítássor + dependency/security fix ELKÉSZÜLT, quality gate ZÖLD
- **Hol tartok most:** 6 finding javítva 11 fájlban (4.1, 5.9, 4.2, 5.8, 5.3, 5.4, 5.1) + `npm audit fix` (8 sérülékenység → 0, köztük CRITICAL vitest 4.0.18→4.1.10 és HIGH vite 7.3.3→7.3.6). typecheck 0 hiba, lint 0 warning, 151 teszt zöld, coverage 92.5%/92.5%, build OK, **0 vuln**. Még NEM commitolva — az ember dönt.
- **Következő lépés:** Az ember commitol. Két logikus commit: (1) `refactor: P0/P1 optimalizáció...` (11 forrásfájl), (2) `deps: npm audit fix — 8 vuln javítva (vitest/vite/ws/js-yaml/brace-expansion/babel)` (package-lock.json). Utána opcionális: P2/P3 finding-ek, vagy a hátralévő major-bumpok (typescript 5→7, vite 7→8, eslint 9→10, jsdom 27→29 — mind dev-tooling, külön, verifikálva).
- **Nyitott kérdések / fenntartások:** (1) A `ChipStack` komponens is feltehetően dead, de az audit nem jelölte — békén hagytam. (2) `BlackjackTable.tsx` 273 sor (volt 235) a useShallow miatt — 300 alatt. (3) Major dev-dependency bumpok (TS 7, vite 8, eslint 10) NEM auto-applikálva — törő verziók, tudatos döntés + gate kellene mindegyikhez. (4) E2E nem futtatva — double/split tiszta kezekkel mennek; unit + build zöld.
- **Blokkoló:** —
- **Utolsó frissítés:** 2026-07-24 | agent: glm-5.2 (2_glm_zai profil)

---

## NAPLÓ
<!-- Dátumozott bejegyzések — váltás előtt IDE FŰZZ egyet (append a végéhez). -->

*(még nincs bejegyzés)*

### 2026-07-24 — Prompt 3 optimalizációs & kódminőség audit
- **Feladat:** A blackjack repo teljesítmény- és kódminőség-auditja (read-only, P0/P1 kontextussal)
- **Eredmény:** 23 finding (2 MAGAS, 8 KÖZEPES, 13 ALACSONY), Top 5 quick win, prioritizált táblázat. Mentve: `docs/audit/PROMPT3_OPTIM_qwen-code_2026-07-24.md`
- **Tanulság:** A projekt ~2800 LOC-os, tiszta architektúrájú. A valós hot path-ok szűkek (blackjack kör ~10-20 művelet), ezért a klasszikus algoritmikus bottleneck minimális. A legnagyobb hatású probléma a Zustand széles selector miatti felesleges re-render és az inline canDouble/canSplit domain-megkerülés. 6 db dead code elem (~260 sor) azonosítva.
- **Döntés:** A P0 finding-ek (4.1 Zustand selector, 5.9 canDouble/canSplit) javítása ajánlott elsőként — mindkettő kicsi effort, nagy hatás.

### 2026-07-24 — Prompt 5 független verifikációs audit (Verification Gate)
- **Feladat:** A Prompt 0–3 auditok minden tényállításának ellenőrzése a tényleges forráskód ellen (read-only, nem javít).
- **Eredmény:** ~104 állítás verifikálva. Mentve: `docs/audit/PROMPT5_VERIFY_glm-5-2_2026-07-24.md`. Pontosság: P0 ~80%, P1 ~89%, P2 ~86%, P3 ~91% (összesen ~86%). Csak 2 valódi tartalmi tévesztés (P1 3.1 validátor-szigorúság irány; P2 7.2 StrictMode dupla-preload mechanizmus).
- **Tanulság:** (1) A per-fájl LOC/sorszám-adatok nagyon pontosak, de az összegző counts (P0 "26 forrásfájl"→valójában 36, "18 komponens"→20/21) elmaradnak. (2) Sorszám-eltolódás ±1–9 sor minden auditban jelen van, de ritka és kicsi. (3) P1 és P3 a `dealOneCard` párósításában és a validátor-szigorúságban ellentmondanak — P3 a megbízható. (4) A hamis-negatív grep (eval/fetch/secrets/dangerouslySetInnerHTML) mind 0 találat — a security audit nem hagyott ki klasszikus kockázatot. (5) A `SEC_AUDIT.md` (2026-04-15) cross-check megerősíti, hogy a VITE_E2E backdoor NEM lett javítva — a PROMPT 2 aktív finding jogos.
- **Döntés:** Mind a 4 audit döntéshozásra megbízható a fenti 2 korrekcióval. P3 a legprecízebb; P0 strukturális adatai kiválóak, de az összegző fájlszámait ne használd. Újra-audit nem indokolt.

### 2026-07-24 — P0/P1 optimalizációs javítássor implementálva
- **Feladat:** A PROMPT 3 (qwen-code) által azonosított, PROMPT 5 által verifikált 6 db P0/P1 finding javítása (4.1, 5.9, 4.2, 5.8, 5.3, 5.4, 5.1).
- **Eredmény:** 11 fájl módosítva, quality gate ZÖLD: typecheck 0 hiba, lint 0 warning, **151 teszt** zöld (147 + 4 új validators teszt a szigorított viselkedésre), coverage **92.51% lines / 92.5% functions** (küszöb 80%), fájl-méret ≤300, build OK (120KB gzip).
  - 4.1: BlackjackTable `useShallow` (8 adat + 10 action) — csak a valóban használt mezőkre iratkozik fel.
  - 5.9: inline canDouble/canSplit → `canPlayerDouble`/`canPlayerSplit` domain függvények (split-nél `playerHands.length===1` őr megőrizve).
  - 4.2: result-sound `setTimeout` cleanup + `RESULT_SOUND_DELAY_MS` konstans.
  - 5.8: `getSoundManager` exportálva; `useVolume.setMasterVolume` a soundManager-en át ír → egyetlen író útvonal (masterVolume + Howler.volume szinkronban).
  - 5.3: `dealOneCard` törlése, `dealCard` import — nulla viselkedésváltozás.
  - 5.4: `validateDouble`/`validateSplit` delegálnak `canPlayerDouble`/`canPlayerSplit`-re, üzenetek megőrizve + 4 új teszt.
  - 5.1: `useGameAnimations.ts` + `CardAnimations.tsx/.css` törölve, `ChipButton`/`BettingChips` eltávolítva, barrel frissítve.
- **Tanulság:** Két Explore ágens (tesztviselkedés + selector/prop-térkép) előre igazolta, hogy a viselkedésváltozások (5.4 szigorítás, 5.9 domain-delegálás) **nem törnek tesztet** — így a megvalósítás elsőre zöld lett, iteráció nélkül. A 4 db `toContain` üzenet-assertion megmentése a `validators.test.ts`-ben kulcs volt (üzenet-szöveget megőrizni, csak authority-t delegálni). A `noUncheckedIndexedAccess` nincs bekapcsolva (csak `strict`), így a `playerHands[0]` indexelés biztonságos.
- **Döntés:** P2/P3 (gameStore darabolás, coverage scope bővítés useSound-ra, magic numbers, RANK_SYMBOLS) külön mennek — most csak a P0/P1 scope-ot csináltam meg (AGENTS.md: no scope creep). Még NEM commitolva — az ember végzi (GIT_WORKFLOW.md).

### 2026-07-24 — Dependency security fix (npm audit fix)
- **Feladat:** `npm outdated` + `npm audit` lefuttatása (az ember kérte: "futtasd, ne delegálj"), majd a talált sérülékenységek javítása.
- **Eredmény:** 8 sérülékenység (1 low / 4 high / 3 critical) → **0**. `npm audit fix` 42 csomagot frissített, **csak `package-lock.json` módosult** (`package.json` caret-tartományok érintetlenek). Kritikus javítások: **vitest 4.0.18→4.1.10** (CRITICAL: Vitest UI tetszőleges fájl olvasás/végrehajtás — GHSA-5xrq-8626-4rwp), **vite 7.3.3→7.3.6** (HIGH: server.fs.deny bypass Windows-on), továbbá ws/js-yaml/brace-expansion/@babel/core (DoS, transitive). Quality gate utána is ZÖLD: 151 teszt, coverage 92.5%, build OK — **nem tört el semmi**.
- **Tanulság:** Ez pontosan a PROMPT 2 security audit **5.4** finding-je ("nincs npm audit lépés a CI-ban") éles példája — a CI-ban nem fut audit, így egy CRITICAL sérülékenység hetekig bennmaradhatott. A `npm audit fix` (semver-safe, nem `--force`) a megfelelő eszköz: major-bumpok nélkül, gate-tel verifikálva. A hátralévő outdated mind major verzió (typescript 5→7, vite 7→8, eslint 9→10, jsdom 27→29) — ezeket külön, egyesével kellene verifikálni, nem tömegesen.
- **Döntés:** A security fix bekerül a commitba (külön `deps:` commit javasolt). A major dev-dependency bumpokat most NEM csinálom meg — az EMBER dönti el, melyiket akarja (mindegyikhez gate-ellenőrzés kell). A `howler@2.2.4` (aged, PROMPT 2 4.1) továbbra is nyitott, de nincs ismert CVE — külön migrációs döntés.
