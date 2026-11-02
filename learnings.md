# learnings.md — permanens projekt-állapot

> Harness- és modellfüggetlen memória. Session-elején ELŐSZÖR ezt olvassa
> (főleg az `AKTUÁLIS ÁLLAPOT` blokkot); session-végén / váltás előtt frissítsd.
> Az AGENTS.md / CLAUDE.md írja le a pontos kötelező lépéseket.

---

## AKTUÁLIS ÁLLAPOT
<!-- Ezt a blokkot minden váltás előtt FELÜLÍRJÁK (nem append). Ez a folytatási pointer. -->

- **Aktív feladat:** "Nincs hang a játékban" hiba javítása — ELKÉSZÜLT (KÉT gyökér ok), MÉG NEM COMMITOLVA
- **Hol tartok most:** Ember **Brave** böngészőt használ (Chromium-alapú). Két bizonyított gyökér ok javítva:
  - **(A) ogg-only formátum** → Safari/WebKit/iOS nem támogatja → fix: ogg+mp3 fallback (`SOUND_CONFIG: Record<SoundType,string[]>`, 10 új `public/sounds/*.mp3`).
  - **(B) VALÓDI OK Brave/Chromium production-ben: race condition** — a `useSound` hook **kétszer hívódik** (SoundSettings + BlackjackTable), így a `preload()` kétszer fut párhuzamosan; a `tryLoadOne` `existing.unload()` megsemmisítette a `play()` által épp használt Howl-t → "hol hang, hol csend" fluktuáció (mérve: baseline 5 futás = **80% csend**). Fix: `tryLoadOne` idempotens (nem unload-ol loaded hangot) + `preload` deduplikálása (`preloadingPromise`). **Mérve javítás után: 5/5 futás = 100% hang** (peak 200-228). Dev szerveren mindig is ment; csak a production (bundolt, szorosabb timing) produkálta a race-t.
  - Quality gate ZÖLD: typecheck 0 hiba, lint 0 warning, **151 teszt** zöld, build OK.
- **Következő lépés:** Ember commitol (javasolt: `fix(sound): cross-browser mp3 + preload race fix`). Kötelező: **hard refresh** Brave-ben (Ctrl+Shift+R) vagy preview szerver újraindítás, mert a régi JS bundle cache-elve van (`index-CvgZy6dR.js` → `index-BRs6Ydy1.js`). Opcionális: (a) valódi webkit/iOS E2E; (b) a `useSound` mock feloldása részben, hogy a hangrendszert is lefedje (most mock-olva van → sosem volt tesztelve, ezért maradt észrevétlen); (c) P2/P3 finding-ek.
- **Nyitott kérdések / fenntartások:** (1) A `BlackjackTable.test.tsx` `vi.mock('../../hooks/useSound')` miatt a hangrendszer **sosem volt tesztelve** — ezért rejtve maradt a race. (2) A circuit-breaker (`CIRCUIT_BREAKER_THRESHOLD=5`) megmaradt — defenzív, de 5 tranziens hiba véglegesen némíthat; nem bántottam. (3) `howler@2.2.4` aged, de nincs ismert CVE.
- **Blokkoló:** —
- **Utolsó frissítés:** 2026-07-25 | agent: glm-5.2 (2_glm_zai profil)

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

### 2026-07-25 — "Nincs hang a játékban" — root cause + cross-browser fix
- **Feladat:** Ember: "nincs hang a játékban, keresd meg az okot és javítsd" → root cause analysis (nem tüneti javítás) + javítás.
- **Eredmény:** **Gyökér ok:** a `useSound.ts` `SOUND_CONFIG`-ja minden hanghoz **csak `.ogg`** formátumot adott meg (Phase 5 `00b9faa` óta). WebKit/Safari/iOS nem támogatja az Ogg Vorbis kódeket → Howler nem tudja dekódolni → `play()` csendesen elbukik (circuit-breaker vagy nem játszható src), **0 hang, 0 konzolhiba, 0 látható hiba**. **Fix:** minden hanghoz `[...ogg, ...mp3]` (ogg preferált jobb tömörítés, mp3 univerzális fallback); Howler az első támogatott kódeket választja. 10 új `public/sounds/*.mp3` ffmpeg-gel konvertálva (`libmp3lame -b:a 96k`). Érintett: `src/hooks/useSound.ts` (SOUND_CONFIG `Record<SoundType,string[]>`, Howl `src: SOUND_CONFIG[type]`). Gate ZÖLD: typecheck/lint/151 teszt/build. **Bizonyítás Playwright-tal (rendszer Chrome + canPlayType-szimuláció):** Chrome `ogg=probably` → 4 play ogg-on; Safari-szim (`ogg=""`) → fix előtt **0 play**, fix után **5 play mp3-on** (mind `stateBefore:"loaded"`, 0 error).
- **Tanulság:** (1) A `useSound` **mock-olva van** `BlackjackTable.test.tsx`-ben (`vi.mock('../../hooks/useSound', ...)`), tehát a hangrendszer SOHA nem volt valóban tesztelve — ezért maradhatott egy ilyen alapvető cross-browser hiba hetekig észrevétlen, CI zöld mellett. (2) A root cause nem derül ki kódolvasásból (a `play()` útvonal Chrome-ban helyesnek tűnik) — **valós böngésző-diagnosztika kellett**: Playwright + `Howl.prototype.play` hook + `HTMLMediaElement.prototype.canPlayType` override (Safari-szim), hogy mérjem a tényleges play hívásokat. (3) **Fontos csapda:** a 4173-as porton `vite preview` futott (lebuildelt `dist/`), nem `vite dev` — a HMR-módosítás nem jelent meg, amíg nem indítottam külön `vite dev`-et 5174-en. Ha valaki diag-ot futtat, ellenőrizze melyik szerver szolgálja a modult. (4) A Howler doc mondja: "always provide multiple codecs" — ez a hiba klasszikus példája ennek a figyelmen kívül hagyásának.
- **Döntés:** ogg+mp3 fallback (nem csak mp3) — az ogg jobb tömörítés Chrome/Firefox-on, az mp3 Safari-t fedi le. A circuit-breaker mechanizmust nem bántottam (defenzív marad, de ld. nyitott kérdés 3). Még NEM commitolva — az ember végzi. Jövőbeli: valódi webkit/iOS E2E a hangra + a `useSound` mock feloldása részben (legalább a SOUND_CONFIG struktúra ellenőrzése).

### 2026-07-25 (2. kör) — "Nincs hang MÉG MINDIG" — valódi gyökér ok: preload/play race
- **Feladat:** Ember az mp3 fix után is "nincs hang még mindig" jelezte + közölte, hogy **Brave** böngészőt használ (Chromium-alapú). Az ogg/mp3 fix tehát nem oldotta meg az ő esetét — Brave támogatja az ogg-ot. Újra diagnosztika kellett.
- **Eredmény:** **VALÓDI gyökér ok (Brave/Chromium production-ben): race condition a `soundManager`-ben.** A `useSound` hook **kétszer hívódik** (`SoundSettings` + `BlackjackTable`), így a `useEffect`-ben lévő `preload()` **kétszer fut párhuzamosan**. A `tryLoadOne` belső `existing.unload()` megsemmisítette azt a Howl-példányt, amit a `play()` épp használt → **"hol hang, hol csend" fluktuáció**. Dev szerveren a timing lazább volt (stabil hang); production (bundolt, szorosabb) fluktuált. **Mérve baseline (mp3 fix, production, 5 futás): peak = 0, 0, 0, 200, 0 = ~80% csend.** Fix: (1) `tryLoadOne` idempotens — ha már létezik ÉS loaded Howl, nem unload-olja; (2) `preload` deduplikálása `preloadingPromise`-szal — már futó teljes preload-ot vár, nem indít újat. **Mérve javítás után: peak = 207, 207, 200, 200, 228 = 100% hang.** Gate ZÖLD: typecheck/lint/151 teszt/build.
- **Tanulság:** (1) **Az első diagnózisom (ogg/mp3) RÉSZLEGES volt** — bizonyítottam, hogy Chrome-ban a `play()` hívás lefut, és ezt "működik"-ként jelentettem. DE a `play()` API hívás ≠ hallható hang: a Howl `'play'` event és a tényleges audio output két különböző dolog. Csak az **AnalyserNode a `Howler.masterGain`-en** (a Web Audio graph tényleges jelének mérése) bizonyította, hogy a hang HOL keletkezik, HOL nem → a fluktuáció. (2) A fluktuáció **csak a production (bundolt) builden** jelentkezett, nem a dev szerveren — ezért a korábbi dev mérések hamis "működik" képet adtak. **Lecke: hibakeresésnél a production buildet is tesztelni, nem csak a devet.** (3) Az ember visszajelzése ("még mindig") KULCS volt — az első "megoldva" jelentés hamis volt. Ne zárjunk le hamar. (4) A tesztek `vi.mock`-olják a `useSound`-t, így a race SOHA nem volt lefedve — CI zöld mellett hetekig rejtve.
- **Döntés:** Két célzott, minimális javítás (idempotens `tryLoadOne` + deduplikált `preload`) — nem architektúra-átírás. A circuit-breakert nem bántottam. Ember commitol. Kötelező: **hard refresh** Brave-ben (régi bundle cache).
