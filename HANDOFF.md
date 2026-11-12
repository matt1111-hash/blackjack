# HANDOFF — LIVE_CASINO_PLAN.md végrehajtása (Fázis 0–8) + bővítések

**Dátum:** 2026-09-06
**Agent:** ZCode (GLM-5.3)
**Bázis commit:** `818fcaa` (main)
**Állapot:** MINDEN fázis + a három jóváhagyott bővítés (CLEAR, ambience, TTS) implementálva, minden kapu zöld — commitra vár (emberi döntés, GIT_WORKFLOW.md szerint).

---

## 1. Ellenőrzési eredmények (mind futtatva, mind zöld)

| Kapu | Eredmény |
|---|---|
| `npm run lint` | 0 hiba, 0 warning |
| `npx tsc --noEmit` | tiszta |
| Unit tesztek | **232 passed** (151 eredeti + 81 új, 22 fájl) |
| e2e (chromium + mobile-chrome) | **16/16 passed**, két egymás utáni újrafuttatásban is stabil |
| `./quality_gate.sh` (local) | **PASSED** — coverage 97,05% lines / 97,59% functions, minden fájl ≤300 sor |
| `npm run build` | OK |
| Objektív elfogadási kritériumok (VIII. rész) | **12/12 teljesül** (ld. `scripts/measure_live.mjs` kimenet) |

### Mért elfogadási kritériumok (a terv VIII. része against)

| Kritérium | Before | After (mérve) |
|---|---|---|
| HUD-elemek lapítása (rotateX) | 0.883 arány | **nincs transzform** (computed `transform: none`) |
| Zseton él-jelölések külön pozíción | 4/8 | **8/8** |
| SHOE az asztal sávján belül | nem (+126px ki) | **igen** (felt 322–1118, shoe 1052–1096) |
| Header az asztal geometriáján belül | nem | **igen** (header 300–1140 = frame 300–1140) |
| Vízszintes túlcsordulás 390px-en | volt | **nincs** (scrollWidth 390 = innerWidth 390) |
| Lapérték látszik `playing` fázisban | nem | **igen** ("20") |
| Tét látszik `playing` fázisban | nem | **igen** (BetStack a DOM-ban) |
| Valódi tét-felbontás | fix $25 | **$125 → 100+25 (2 zseton)** |
| Osztó lapjai egyesével | nem | **igen** (16 → 26 felszámol, ~0,4 s/lap) |
| Osztó BUST badge | nem | **igen** |
| Eredmény-overlay a termet sötétíti | teljes viewport | **31% alsó sáv, lapok olvashatók** |
| Osztó megszólal | soha | **igen** ("Dealer busts" mérve) |

Screenshotok: `docs/visual-live/` (desktop + mobil × betting/playing/finished).

---

## 2. Mit valósult meg (fázisonként)

- **Fázis 0 + M0 (12 quick win):** `src/styles/tokens.css` (egyetlen színforrás), D1 ellen-forgatások törölve 5 helyről, D2 zseton-redesign (színes test + fehér él-betétek, 8 pozíció), D3/D4 header+shoe az asztal geometriájához kötve, D21 halott kód törölve (`ChipStack.tsx`, `ChipAnimations.tsx`, `showBack`, `CARD_FLIP_DURATION`, `CHIP_COLORS`), D14 lapérték minden fázisban, D15 osztó BUST badge, Hand spread 35→44px.
- **Fázis 1:** terem-háttér (sötét bordó + szőnyegminta + fénykúp + vignetta), párnázott bőr rail öltésmintával, finomabb filc-textúra (baseFrequency 0.9→0.35), `TableMarkings.tsx` (BLACKJACK PAYS 3 TO 2 / DEALER MUST STAND ON 17 / INSURANCE PAYS 2 TO 1, tétkörök — S17-szabály szerint), `Shoe.tsx` (maradék lappal, penetration végre látszik), `DiscardTray.tsx`, `ChipTray.tsx`.
- **Fázis 2:** `useDealChoreography` (játékos→osztó→játékos→osztó, ~200ms lépés, shoe-irányú repülés, slide+place hang), `useDealerReveal` (hole card 3D flip 0,5s → egylaponként 0,4s, érték-felszámolás), `CardFlip` végre bekötve, `HOLE_CARD_REVEAL_DURATION`/`DEAL_STAGGER_DELAY` végre használva, `CHOREO_SPEED` (e2e ×0,25, reduced-motion 0, unit-teszt 0), eredmény/kapuzás a koreográfiára.
- **Fázis 3:** `logic/chips.ts` (`decomposeBet`, mohó 500/100/25/5), `BetStack.tsx` (kézzel rakott stack jitterrel, win bounce / lose az osztóhoz csúszik, összeg-címke), tét végig az asztalon minden fázisban, `useCountUp` (egyenleg rugós felszámolás), `BetControls` (REBET + DOUBLE BET).
- **Fázis 4:** `logic/dealerLines.ts` (11 mondás HU+EN Recordban, totális leképezés), `DealerSpeech.tsx` (aria-live buborék), idle élet (pislogás + légzés CSS-sel), `--excited/--sad/--dealing` animációk végre bekötve.
- **Fázis 5:** soft-kéz "7 / 17" kijelzés, bust rázkódás+bélyegző, blackjack arany kitörés, nyertes kéz glow, eredmény-szalag (D5, testidek+szövegek VÁLTOZATLANOK), aktív kéz arany pulzálás.
- **Fázis 6:** `soundPool.ts` (RoundRobin pool, 3 példány/hang — D18: 4 gyors card-place → 4 megszólalás), ±6% rate / ±10% volume variáció (D19), `soundManager.ts` + useSound refaktor (302→~100 sor), `card-slide`/`chip-stack`/`chip-win` végre bekötve (0 kihasználatlan hang).
- **Fázis 7:** HUD a frame-en belül, mobil layout (fejléc wrap, hang-fiók, 390px nulla túlcsordulás), `SessionStats` (körök, winrate, legnagyobb nyeremény, széria), `useKeyboardShortcuts` (H/S/D/P, Space, 1–4), shoe-újrakeverés jelzése („Shuffling a new shoe").
- **Fázis 8:** `prefers-reduced-motion` → CHOREO_SPEED=0 (teljes játszhatóság), aria-live (osztó + eredmény), kontrasugár-javítás (0.4–0.6 → 0.78+ opacity), csak transform/opacity animációk.
- **D22:** `rules.ts` — félrevezető soft-17 komment javítva, halott ág összevonva (viselkedésváltozás NINCS, 218 teszt zöld).

## 3. Hibák, amiket a végrehajtás közben találtam és javítottam

1. **Avatárok fekete körök lettek volna** — az avatar-színeket CSS-osztályokba tettem, de az `Avatar.css`-t senki sem importálta (eredetileg inline fill élt benne). Import hozzáadva, computed fill-ekkel ellenőrizve.
2. **Eredmény-badge a hole-card flip ELŐTT jelent meg** — a `useDealerReveal` effekt csak a render után tudta resetelni a `done`-t; a stand renderjében az előző fázis `done:true`-ja engedte be a badge-t. Megoldás: fázisváltáskor render-időű állapot-reset (hivatalos React minta). MutationObserver-rel 30ms felbontásban bizonyítva.
3. **Mobilon a split utáni második kéz akciógombjai a viewport ALATT** (y=788 > vh=727) — a két kéz egymás alá tört; a force-click a HTML gyökérbe ment. Mobilon egy sorba kényszerítettem a kezeket + biztonsági scroll.
4. **Playwright böngészők hiányoztak** — `npx playwright install chromium` + `webkit` letöltve.

## 4. Jóváhagyott bővítések (emberi döntés: „mehet") — implementálva

### 4.1 CLEAR gomb (store-bővítéssel)
- `store/validators.ts`: új `validateClearBet` (csak betting fázisban, nem nulla tét).
- `store/gameStore.ts`: új `clearBet` akció — a tét visszaaz egyenlegbe. A fájl limit alatt maradt (298 sor): a `deal()` három azonos natur-blackjack ága összevonva egy `playerBJ || dealerBJ` ágba (viselkedésazonos, a 232 teszt őrzi).
- UI: `BetControls` CLEAR gomb (`data-testid="bet-clear"`), `C` billentyű is töröl. Visszajátszva élőben: $125 tét → CLEAR → egyenleg vissza $5000-ra.
- Tesztek: `gameStore.clearBet.test.ts` (7 db — validator + store viselkedés).

### 4.2 Ambience hang
- **Asset: `public/sounds/ambience.{ogg,mp3}` — 16 s körtűrozható loop, NUMERIKUSAN SZINTETIZÁLVA** (brown-noise room tone + modulált távoli moraj + ritka zseton-koccanások; RMS −30 dB). Self-authored → **licenc-kockázat nulla**, nem kell külső beszerzés.
- `soundManager`: loop-oló Howl (`html5`), `startAmbience/stopAmbience/setAmbienceVolume`; a fontos hangoknál (win/lose/blackjack/chip-win) 300 ms-os **ducking** (fade 0,3×-ra és vissza).
- `hooks/useAmbience.ts`: szint + be/ki; `SoundSettings`: külön „AMB" csúszka (mobilon fiókba csuklik).
- Élőben ellenőrizve: ambience.ogg HTTP 206 töltődik, a slider működik.
- Konstansok `soundPool.ts`-ben: `AMBIENCE_LEVEL=0.12`, `DUCK_FACTOR=0.3`, `DUCK_MS=300`.

### 4.3 Osztó-hang (kétmotorú: TTS + generált hangfájlok)
- **Gyökér ok (Brave Nightly):** a Brave kivezte a beépített TTS-hangokat → `speechSynthesis.speak()` néma, `getVoices()` üres. Ezért a `useDealerVoice` **kétmotorú**:
  1. **TTS (Web Speech)** — HA a böngésző ténylegesen hangokat ad (350 ms probe + `voiceschanged`);
  2. **generált hangfájl** — minden más böngészőben; `public/sounds/voice/{key}.{en|hu}.{ogg|mp3}` (20 mondat × 2 formátum), a `scripts/generate_voice_lines.py` a gép espeak-ng szintetizátorával generálja (ctypes, **100% self-authored, licenc-tiszta**). A dealerTotal kimarad (érték-template, sosem hangzik el).
- A hang a mester-mute-ot és Volume csúszkát követi (globális Howler); 🗣/🤐 toggle perzisztál.
- Élőben bizonyítva 0-hangos környezetben: placeBets/noMoreBets/houseWins fájlok HTTP 200-cal betöltöttek és lejátszottak.
- Megjegyzés: az espeak-ng hang gépies — a fájlok bármikor cserélhetők szebb hangra anélkül, hogy a kód változna.

## 5. Nyitott pontok az EMBER döntésére

1. **Commit + push** — javasolt üzenetek lent. ⚠️ A worktree-ben a sessionem ELŐTTI módosítások is vannak (lásd 6. pont) — azok NEM az én munkám, külön kezeld őket.
2. **`sudo npx playwright install-deps webkit`** — a webkit/mobile-webkit e2e profilok rendszerfüggőségei root-jogot kérnek; ezután `npx playwright test` teljes mátrix futtatható. (Jelszó kell, ezért nem futtattam.)
3. ⚠️ **Port-ütközési csapda (játszva + e2e egyszerre)**: a desktop-launcher korábban a 4173-as porton futott — ez az e2e dev-szerver portja. A Playwright `reuseExistingServer` miatt a preview-t (VITE_E2E nélküli dist!) kapta el webszervernek → látszólagos tömeges e2e-halál. **Javítva: a launcher mostantól a 4174-es portot használja** (`scripts/launch_desktop.sh`, `BLACKJACK_PORT` felülírható). Ha mégis portütközés gyanúja van: `ss -tlnp | grep 4173`.
4. **CLEAR gomb mindig látható** betting fázisban (tét nélkül letiltva) — a felhasználói visszajelzés alapján, így egyértelmű, hogy létezik.

## 5. Javasolt commit-bontás (GIT_WORKFLOW.md szerint, magyar, modul-prefix)

```
ui: élő kaszinó átalakítás 1. — design tokenek + renderelési hibajavítások (D1–D4, D21)
  - src/styles/tokens.css, index.css, types, constants/animations.ts
  - Chip redesign (D2), ellen-forgatások törlése, header/shoe az asztal geometriájában
  - Ellenőrzés: lint + tsc + 218 unit teszt + 16 e2e + quality gate PASS

ui: élő kaszinó átalakítás 2. — terem, rail, asztal-nyomat, shoe/discard/chip tray (Fázis 1)
ui: élő kaszinó átalakítás 3. — osztási koreográfia + hole card flip + osztó-felfedés (D9–D11)
domain: tét-zseton felbontás (decomposeBet) + D22 komment-javítás rules.ts-ben
ui: élő kaszinó átalakítás 4. — BetStack, kifizetés-animáció, egyenleg felszámolás, BetControls
ui: élő kaszinó átalakítás 5. — élő osztó: mondások, beszéd-buborék, idle animációk (D13, D17)
ui: élő kaszinó átalakítás 6. — dráma és eredmény-szalag (D5, D14–D16)
fix(sound): hang-pool párhuzamos példányokkal + variáció (D18–D19), 3 hang bekötése
ui: élő kaszinó átalakítás 7. — HUD, mobil layout, billentyűk, session stats (D4)
test: 81 új unit teszt (chips, dealerLines, shoe, soundPool, hookok, UI, clearBet, dealerVoice)
feat(ui): CLEAR gomb + clearBet store akció (C billentyű)
feat(sound): szintetizált ambience loop + ducking + AMB csúszka
feat(ui): osztó-hang TTS-sel (useDealerVoice, perzisztens toggle)
docs: vizuális baseline screenshotok + mérőszkript (scripts/measure_live.mjs)
```

(Egyetlen nagy commitban is vállalható: `ui: LIVE_CASINO_PLAN.md végrehajtása — élő kaszinó élmény (Fázis 0–8)`.)

## 6. Worktree-állapot

**Az én módosításaim:** minden `src/**` módosítás + új fájlok, `public/sounds/ambience.{ogg,mp3}`, `scripts/measure_live.mjs`, `docs/visual-live/` (6 PNG), ez a `HANDOFF.md`.

**NEM az enyém (session előtti állapot, érintetlenül hagytam):**
`törölt`: GLM_PR.md, SECURITY.md, SEC_AUDIT.md, docs/audit/PROMPT*.md (6 db), docs/jules_report.md, jules_report.md;
`módosított`: PRODUCTION_MANDATE.md;
`untracked`: .claude/, .repowise/, .vscode/, GIT_WORKFLOW.md, LIVE_CASINO_PLAN.md, docs/audit/PROMPT1_MAP_2026-07-27/.

**Secret-scan a commit előtt** (AGENTS.md): a saját diffem kizárólag forráskód/CSS/docs — jelszó, kulcs, DSN nincs benne; akkor is fussa le a `git diff --staged` átellenőrzés.

## 7. Futtatási gyorstábla

```bash
npm run lint && npm run typecheck && npm run test:run && npm run build   # ~30 s
npx playwright test --project=chromium --project=mobile-chrome           # ~8 s
./quality_gate.sh                                                        # PASS
VITE_E2E=1 npx vite --port 4199 &  node scripts/measure_live.mjs         # 12/12 kritérium + screenshotok
```

---

## 7. Profi élmény — 2. kör (2026-11-12, Claude Opus 5.5)

**Kapuk:** lint 0 · tsc 0 · **325 unit teszt** · **16/16 e2e** (chromium + mobile-chrome, rendszer-Chrome) · `./quality_gate.sh` **PASS** (97,08% lines / 97,87% functions) · build OK · `scripts/measure_live.mjs` **13/13** (új kritériumokkal).

| Terület | Mi változott | Fájlok |
|---|---|---|
| Nézőpont | Félhold-asztal a játékos székéből, osztói kellékek a hátsó peremen, terem-vignetta | `Table/BlackjackTable.*`, `TableMarkings.*` |
| Lapok | 92px (mobil 60px), nagy index, figurás keret, bordó hátlap, lépcsőzés, shoe-ból ívelő repülés | `Card/*`, tokenek: `--card-w`, `--hand-step` |
| Osztó | Törzs + névtábla + kezek (osztáskor a shoe-hoz nyúl), avatárok törölve | `Avatar/DealerFigure.*` |
| Pult | Bank (egyetlen egyenleg) · fázis-sor · beállítások; csak szabályos döntés; REBET & DEAL | `Table/TableConsole.*`, `UI/ActionButtons.*` |
| Zseton | Oldalnézet, nagy címlet alul, kifizetés a tét mellé; söprés csak a koreográfia végén | `Chip/BetStack.*`, `Table/PlayerArea.*` |
| Rendező | Feszült felfedés (emelés, kivárás, lassú flip, elcsendesülés), lap-hangok a felfedésben, ÉLŐ/GYORS tempó | `Table/useTableDirector.ts`, `hooks/useTableSpeed.ts` |
| Edző | Basic strategy (6D, S17, DAS), pontosság a pulton, eltérésnél halk jelzés | `logic/strategy.ts`, `hooks/useStrategyCoach.ts`, `UI/CoachToast.*` |
| Kézjel | Dupla koppintás = HIT, söprés = STAND, rezgés (egérrel kikapcsolva) | `logic/gestures.ts`, `hooks/useTableGestures.ts` |
| Hang | **Q-01 javítva** (közös mute-store), terem-zengés (convolver), neurális osztó (Piper joe, CC0, 3 take, ismétlés nélkül) | `hooks/muteStore.ts`, `hooks/roomReverb.ts`, `hooks/voiceLines.ts`, `public/sounds/voice/*.en.[1-3].*` |

**Ember döntésére vár:**
1. Commit (javasolt: `ui: profi kaszinó-élmény — ülő-nézőpont, pult, osztó, zsetonok`, `feat(coach): basic strategy edző`, `fix(sound): közös mute-store (Q-01) + terem-zengés + neurális osztó-hang`).
2. Chrome-ban a böngésző TTS-e szól (a `useDealerVoice.test.ts` „prefers TTS” spec szerint). Ha mindig a neurális hang kell: a spec módosítását jóvá kell hagyni.
3. Örökölt CI-sorkorlát: `soundManager.ts` 300, `gameStore.ts` 298 (> 250).

**Futtatás rendszer-Chrome-mal:** `VITE_E2E=1 npx vite --host 127.0.0.1 --port 4199 & PW_CHANNEL=chrome node scripts/measure_live.mjs`

