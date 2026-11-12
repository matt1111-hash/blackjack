# learnings.md — permanens projekt-állapot

> Harness- és modellfüggetlen memória. Session-elején ELŐSZÖR ezt olvassa
> (főleg az `AKTUÁLIS ÁLLAPOT` blokkot); session-végén / váltás előtt frissítsd.
> Az AGENTS.md / CLAUDE.md írja le a pontos kötelező lépéseket.

---

## AKTUÁLIS ÁLLAPOT
<!-- Ezt a blokkot minden váltás előtt FELÜLÍRJÁK (nem append). Ez a folytatási pointer. -->

- **Aktív feladat:** „Profibb, valódi kaszinó-élmény” — szabad kéz (Harold, 2026-11-12). Az 1–11. ötletpont megvalósítva, minden kapu zöld; **commitra vár** (emberi döntés, GIT_WORKFLOW.md).
- **Hol tartok most:** ülő-nézőpontú félhold-asztal, osztó fejjel (pislog, tekintete követi a shoe-t/lapot), törzs + kezek (`Avatar/DealerFigure`), kezelőpult (`Table/TableConsole`), rendező (`Table/useTableDirector`: feszültség-időzítés), stratégia-edző (`logic/strategy.ts` + `hooks/useStrategyCoach`), kézjelek (`logic/gestures.ts` + `hooks/useTableGestures`), közös mute (`hooks/muteStore` — **Q-01 javítva**), terem-zengés (`hooks/roomReverb`), neurális osztó-hang (Piper en_US-joe-medium, CC0, 3 take/mondat, `scripts/generate_voice_lines_neural.py`). Részletek: HANDOFF.md 7. szakasz.
- **Következő lépés:** (1) ember: commit-bontás jóváhagyása; (2) nyitott döntés: Chrome-ban a böngésző TTS-e szól a neurális fájlok helyett, mert a `useDealerVoice.test.ts` „prefers TTS” spec ezt rögzíti — ha a neurális hang legyen mindig az első, a spec módosítását az embernek kell jóváhagynia; (3) következő ötletek: kör-napló + szabálykártya, mellékfogadások (21+3, Perfect Pairs — domain-bővítés), L-01…L-06 logikai leletek.
- **Nyitott kérdések / fenntartások:** `soundManager.ts` (300) és `gameStore.ts` (298) a CI 250-es sorkorlátja felett — a live-casino körből örökölt, nem bontottam. Playwright-böngészők nincsenek letöltve: e2e/mérés rendszer-Chrome-mal (`channel: 'chrome'`, scratch config / `PW_CHANNEL=chrome`).
- **Blokkoló:** —
- **Utolsó frissítés:** 2026-11-12 15:13 | agent: Claude Opus 5.5 (Claude Code)

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

### 2026-09-06 — PROMPT3 biztonsági audit (read-only AppSec, RUN_ID: PROMPT1_MAP_reasonix_2026-09-06)
- **Feladat:** Támadói nézőpontú, read-only AppSec audit a PROMPT1-térkép bemenetével; output `docs/audit/PROMPT1_MAP_reasonix_2026-09-06/03_SECURITY.md`.
- **Eredmény:** Snapshot-ellenőrzés zöld (commit `818fcaa`, worktree = térkép A. függelék, bájtszinten diff-fel). Deployment-kontextus: solo desktop, nincs backend, nincs hálózati hívás az appban, vite preview 127.0.0.1-re kötve. **0 aktív sérülékenység**; 5 DiD-tétel (S-01 e2e-shoe teszt-hook gate mögött — CWE-489; S-02 modulo-bias; S-03 CSP hiány; S-04 Actions tag-pin; S-05 howler aged). gitleaks: history (80 commit) + worktree (untrackedokkal) 0 leak. `npm audit --offline` 0 vuln. Lockfile: 30/30 semver-ok, minden resolved registry.npmjs.org. Negatív állítások grepekkel lefedve (eval/innerHTML/fs/db/hálózat/upload/postMessage: mind 0).
- **Tanulság:** (1) A `<RUN_ID>` placeholder üresen jött — a prompt „ne kérdezz vissza" szabályával összhangban a determinisztikus megoldás: az egyetlen meglévő `01_MAP.md`-es könyvtár RUN_ID-ja, a döntést a riportban rögzítve. (2) Severity-kalibráció döntött: játékpenzes, loopback, egyuser kontextusban a PROMPT2-es `resetBalance` MAGAS logikai finding biztonságilag NEM finding (nincs átlépett trust boundary) — az elvetett jelöltek közé került, indoklással. (3) A gitleaks history-scan önmagában kevés — untracked fájlokra külön `--no-git` kör kell.
- **Döntés:** „Nincs finding" verdictet csak a teljes sink-sweep parancslistájával adtam (minden kategóriára); az e2e-shoe hookot nem eltávolítandó bugként, hanem FELTÉTELES DiD-ként kezeltem, mert a gate a jelen build-útvonalakon statikusan zár és a teszt-infra tudatosan épül rá.

### 2026-09-06 — PROMPT4 teljesítmény- és kódminőség-audit (read-only, RUN_ID: PROMPT1_MAP_reasonix_2026-09-06)
- **Feladat:** Bottleneck + karbantarthatóság, kód módosítása nélkül; output `docs/audit/PROMPT1_MAP_reasonix_2026-09-06/04_PERFORMANCE.md`.
- **Eredmény:** Snapshot forráson zöld. **0 aktív performance finding** — a régi PROMPT3 MAGAS dealCard-másolást mérés cáfolta (312 lapos drain medián 0.186 ms; 50 kör 0.513 ms). Bundle = térkép (402.97 kB / gzip 126.08 kB). **5 quality finding** (Q-01 mute/TTS KÖZEPES, négy ALACSONY). Vitest 235/235 PASS.
- **Tanulság:** Call-site és O(n) a 312-es zárt shoe-n nem bottleneck; a mute-hiba a két `useSound` példány React-state-je, nem a Howler. A Repowise health-index a tiszta HEAD-et látja, a live-casino fájlokra nem támaszkodtam.
- **Döntés:** Nulla performance finding érvényes; Q-01 a következő javítandó minőségi tétel, külön a L-01…L-06-tól.

### 2026-11-12 — Profi kaszinó-élmény: ülő-nézőpont, edző, rendező, neurális osztó
- **Feladat:** A docs/casino-elmeny-otletek.html ötletein túli, „profibb” élmény; szabad kéz minden rétegben.
- **Eredmény:** Félhold-asztal a játékos székéből (rotateX 16°, egyenes osztói él), 92px-es lapok nagy sarokindexszel és bordó-arany hátlappal, kaszinó-lépcsőzés (a kéz szélessége a lapszámból számolódik → valóban középre kerül); egy fénymodell (`--elev-card*`); rajzfilm-avatárok törölve, helyettük osztó-törzs + kezek; a gombok a kezelőpultra kerültek (egy anyag: lakk + réz, a nem szabályos döntés nem jelenik meg, REBET & DEAL); egyetlen egyenleg; oldalnézetes zseton-oszlop, kifizetés a tét mellé az osztó felől; a tét csak a koreográfia VÉGÉN söprődik (korábban a hole card fordítása előtt — dramaturgiai hiba); feszült felfedés (hole card emelés + 650 ms kivárás + lassabb flip + terem-elcsendesülés), gyors/élő tempó; basic strategy edző (S17, 6D, DAS) pontossággal; dupla koppintás = HIT, söprés = STAND (csak érintés); Q-01 mute-hiba gyökér-javítás; szintetizált terem-zengés; neurális osztó-hang. 325 unit teszt (+90), 16/16 e2e, 13/13 elfogadási mérés, coverage 97,1%/97,9%, quality gate PASS.
- **Tanulság:** (1) A framer-motion `animate` felülírja az elem CSS `transform`-ját — CSS-transzformot (zseton-lapítás, emelés, központozás) mindig egy belső, nem animált elemre kell tenni (ez okozta a régi InsuranceDialog elcsúszását is). (2) SVG presentation-attribútumban (`stopColor`) a `var()` nem működik — `style`-ban kell. (3) A Piper-hangok licence eltér: ryan és hfc_male CC BY-NC(-SA) → kizárva; joe = CC0, norman = public domain; a spektrális lapultság (0,15 vs 0,31) objektíven mutatta, hogy a joe tisztább. (4) `git rm --cached`-del ne takaríts: az indexet módosítja — sima `rm` elég.
- **Döntés:** Domain érintetlen (csak tiszta, új `logic/strategy.ts` és `logic/gestures.ts`). A meglévő tesztekhez nem nyúltam; a TTS-preferencia spec miatt Chrome-ban a böngésző-hang marad. Commit nincs — az ember dönt.

### 2026-11-12 — Az osztó fejet kapott (Harold visszajelzése: „az osztó feje nem látszik”)
- **Feladat:** A fej nélküli törzs csonkának hatott; az osztó arca a jelenlét része.
- **Eredmény:** Arányos, visszafogott fej (haj, fül, szemöldök, orr, száj, felső kulcsfény), pislogás 5,2 s-onként, a pupillák osztáskor a shoe felé, felfedéskor a lapra néznek. Fejtér 104→156px (mobil 58→112, alacsony laptop 124), rövidebb nyak, a kezek a vállszélességhez húzva. Gate PASS, 16/16 e2e, 13/13 mérés.
- **Tanulság:** A korábbi „arc nélkül nincs rajzfilm-hatás” döntésem rossz volt — az ember a hiányzó fejet csonkaságként élte meg. Az arc nem baj, ha arányos és visszafogott. Az első változat nyaka túl hosszú lett (a törzs 120 egységgel lejjebb indult) — mindig képernyőképpel ellenőrizni.
- **Döntés:** Fej marad; a fejtér a tokenekben (`--dealer-headroom`) skálázódik képernyőméret szerint.

