# ÉLŐ KASZINÓ TERV — blackjack frontend

**Verzió:** 1.0
**Dátum:** 2026-09-06
**Agent:** Claude Opus 5 (1_official_claude profil)
**Bázis commit:** `818fcaa` (main)
**Baseline állapot:** 151 unit teszt zöld (9 fájl, 1.18s), **8 e2e szcenárió** (13 assert), build OK
**Módszer:** forráskód-térképezés (repowise index + teljes olvasás) + **futó alkalmazás műszeres mérése**
(Playwright + rendszer Chrome, `getBoundingClientRect` / `getComputedStyle` mérések, 6 screenshot 3 fázisban,
desktop 1440×900 és mobil 390×844) — a diagnózis minden állítása mért adaton alapul, nem becslésen.

---

## 0. VEZETŐI ÖSSZEFOGLALÓ

**Ami jó:** a domain-réteg (`logic/`, `store/`) tiszta, tesztelt, framework-független. A szabályok
helyesek, a validáció szigorú, a hangrendszer race-mentes. Ez szilárd alap — **a terv egyetlen sort
sem javasol változtatni a blackjack-szabályokban.**

**A központi probléma:** a frontend jelenleg **egy helyes játék helyes megjelenítése, de nem egy hely.**
Nincs terem, nincs asztal-nyomat, a tét nem fizikai tárgy, az osztásnak nincs ideje és ritmusa, az osztó
nem él. Ehhez jön három **bizonyított renderelési hiba**, amelyek aktívan rontják a képet: egy elhagyott
3D-architektúra maradványa 11,7%-kal lapítja az osztó avatárját és az akciógombokat, a zsetonok 8 él-jelölése
egyetlen pontba omlik, a SHOE-jelző pedig az asztalon kívül, a hangvezérlőre csúszva jelenik meg.

**A legsúlyosabb funkcionális hiány:** *játék közben a játékos nem látja a saját lapértékét.*
(`PlayerArea.tsx:142` — a badge csak `finished` fázisban ír ki számot.) Ez nem stílus, hanem használhatóság.

**Javaslat:** 9 fázisú terv, fázisonként önállóan szállítható és quality gate-elhető. A **Fázis 0 + 5 quick win
(~1 nap)** önmagában látványosan feljebb viszi a hitelességet; a teljes terv **~12–16 agent-nap**.

---

# I. RÉSZ — PROJEKT-TÉRKÉP

## 1.1 Stack és méretek

| Jellemző | Érték |
|---|---|
| Stack | Vite 7 + React 19 + TypeScript 5.9 + Zustand 5 |
| Animáció | framer-motion 12 |
| Hang | howler 2.2.4 |
| Stílus | Tailwind 4 (`@import`) + **18 kézi CSS fájl** |
| Forrás | 81 fájl / ~7.300 sor (ebből `src/` ~5.667 sor) |
| Teszt | Vitest (151 teszt / 9 fájl) + Playwright (**8 e2e szcenárió** / 13 assert, 4 böngésző-profil) |
| Legnagyobb fájl | `useSound.ts` 302 sor, `gameStore.ts` 298 sor (limit: 300) |

## 1.2 Rétegek és függőségi irány

```
components/ ──► hooks/ ──► store/ ──► logic/ ──► types/
   (UI)        (Howler)   (Zustand)   (tiszta)   (típusok)
```

A függőségek **kizárólag befelé** mutatnak, a `logic/` React-mentes és I/O-mentes. Ez a terv szempontjából
kulcsfontosságú: **minden új „élő kaszinó" viselkedés a presentation-rétegbe kerül**, a domain érintetlen marad.

## 1.3 Komponens-leltár

| Fájl | Sor | Szerep | Kaszinó-hozzájárulás ma |
|---|---:|---|---|
| `Table/BlackjackTable.tsx` | 273 | Fő layout, fázis-vezérlés, hang-trigger | Váz — de a header az asztalon kívül |
| `Table/BlackjackTable.css` | 280 | Filc, 3D réteg, deal gomb, error toast | Filc-textúra megvan, terem nincs |
| `Table/PlayerArea.tsx` | 182 | Kezek, tét, akciógombok, hangulat | Tét fiktív, lapérték rejtett |
| `Table/DealerArea.tsx` | 34 | Osztó keze, hole card, érték | Hole card statikus, nincs flip |
| `Card/Card.tsx` | 75 | Lap előlap/hátlap | Tisztes, de rang-index túl kicsi |
| `Card/Hand.tsx` | 52 | Kéz-elrendezés, belépő animáció | 35px offset 70px lapon = 50% takarás |
| `Card/CardFlip.tsx` | 33 | 3D lapfordítás | **Gyakorlatilag halott** (ld. D10) |
| `Chip/Chip.tsx` | 36 | Zseton | Él-jelölések egy pontba omlanak |
| `Chip/ChipAnimations.tsx` | 104 | Animált zseton-stack | `animateWin/Lose` sosem kap `true`-t |
| `Chip/ChipStack.tsx` | 36 | Zseton-stack | **Sehol nem használt duplikátum** |
| `UI/ActionButtons.tsx` | 75 | HIT/STAND/DOUBLE/SPLIT | Működik, de lapított (D1) |
| `UI/ChipSelector.tsx` | 38 | Tét-zsetonok | Nincs kijelölt állapot, nincs törlés/rebet |
| `UI/GameResult.tsx` | 65 | Eredmény-overlay | Az egész képernyőt elsötétíti |
| `UI/Balance.tsx` | 29 | Egyenleg | Ugrik, nem számol fel |
| `UI/InsuranceDialog.tsx` | 54 | Biztosítás | Rendben, de nem asztali elem |
| `UI/SoundSettings.tsx` | 67 | Hang | Mobilon kilóg a képernyőről |
| `Avatar/PlayerAvatar.tsx` | 151 | Játékos SVG, 5 hangulat | Statikus — nincs mozgás |
| `Avatar/DealerAvatar.tsx` | 104 | Osztó SVG, 3 hangulat | Statikus + lapított |

## 1.4 Állapotgép

```
betting ──deal()──► [insurance] ──► playing ──► finished ──newRound()──► betting
```

| Fázis | Mit lát a játékos ma |
|---|---|
| `betting` | 4 zseton, „PLACE YOUR BET TO START", 1 db fix $25-ös zseton tétként |
| `insurance` | Középre úszó modal |
| `playing` | Lapok, akciógombok, **saját lapérték NEM látszik**, osztó értéke `?`, tét eltűnt |
| `finished` | Teljes képernyős sötétítés + eredménykártya, azonnali egyenlegugrás |

## 1.5 Eszközök és szerződések

**Hangkészlet (`public/sounds/`, ogg+mp3 párban, mind megvan):**
`card-place`, `card-slide`*, `chip-drop`, `chip-stack`*, `chip-win`*, `win`, `lose`, `blackjack`,
`deal-start`, `button-click` — a *-gal jelölt **3 hang készen áll, de soha nem szólal meg**.

**Quality gate (`.quality_gate.conf` — MÓDOSÍTANI TILOS):**
coverage ≥85% (CI 90%), max 300 sor/fájl (CI 250), lint 0 warning, typecheck 0 hiba.

**E2E testid-szerződés (nem törhető) — ld. Függelék B.**

---

# II. RÉSZ — DIAGNÓZIS

> Minden alábbi állítás **futó alkalmazáson mért**. A mérőszkript a Függelék A-ban, reprodukálható.

## 2.1 Renderelési és architekturális hibák (P0 — bizonyított)

### D1 — Elhagyott 3D-architektúra maradványa lapítja a UI-t ⚠️ GYÖKÉR OK

A `BlackjackTable` **két rétegre** bomlik: egy `rotateX(28deg)`-kel döntött háttér (`__felt-3d`) és egy
**el nem forgatott** overlay (`__overlay`), amiben minden interaktív elem él. Az overlay gyermekei viszont
még mindig **ellen-forgatnak** egy olyan forgatást, amit az ősük soha nem alkalmaz:

| Elem | Fájl | Deklarált transzformáció |
|---|---|---|
| Akciógombok | `UI/ActionButtons.css:7` | `rotateX(-28deg) translateZ(20px)` |
| Osztó felirat | `Table/DealerArea.css:19` | `rotateX(-28deg) translateZ(10px)` |
| Osztó érték-badge | `Table/DealerArea.css:32` | `rotateX(-28deg) translateZ(10px)` |
| Osztó avatár | `Table/DealerArea.css:38` | `rotateX(-28deg) translateZ(15px)` |
| Eredmény-overlay | `UI/GameResult.css:12` | `rotateX(-28deg) translateZ(40px)` |

**Mért bizonyíték:** ezeken az elemeken a szülő `perspective` értéke `none`, ezért a `rotateX` nem
perspektivikus döntés, hanem **ortografikus lapítás**, a `translateZ` pedig hatástalan:

```
.action-buttons      renderedH/layoutH = 0.883   (perspectiveOnParent: none)
.dealer-area__value  renderedH/layoutH = 0.883
.dealer-avatar       renderedH = 49.4px  (kért méret: 56px)
.player-avatar       renderedH = 56.0px  (nincs transzformáció)
cos(28°) = 0.883                            ← pontos egyezés
```

**Következmény:** az osztó avatárja **11,7%-kal alacsonyabb**, mint a játékosé — aszimmetrikus, „nyomott"
arc; a gombok és a badge-ek ugyanígy összenyomottak. Ez nem elírás egy fájlban, hanem **egy korábbi,
egyrétegű 3D-modell maradványa 5 helyen** — pontosan az a fajta architektúra-inkonzisztencia, amit
gyökér-okként kell kezelni, nem tünetenként.

### D2 — A zseton 8 él-jelölése egyetlen pontba omlik

`Chip.css:159-166` a 8 jelölést `rotate(Ndeg) translateY(0)`-val helyezné el, de a `transform-origin`
alapértéke **az elem saját közepe**, nem a zseton közepe, és a `translateY` nulla.

**Mért bizonyíték** — a 8 jelölés befoglaló doboza (60px átmérőjű zsetonon):
```
[602,716] [601.8,714] [604,714.3] [601.8,714] [602,716] [601.8,714] [604,714.3] [601.8,714]
→ 8 elem, 4 különböző pozíció, mind egy ~9×9 px-es foltban a zseton tetején
```
**Következmény:** a zsetonok nem kaszinó-zsetonnak látszanak, hanem sötét koronggal, egyetlen ponttal
12 óránál. Ehhez jön, hogy a zseton **teste mindig sötétszürke**, csak a *kerete* színes — valódi zsetonnál
fordítva van. `CHIP_COLORS[100] = '#1E1E1E'`, azaz a fekete zseton fekete kerete gyakorlatilag láthatatlan.

### D3 — A SHOE-jelző az asztalon kívül van és a hangvezérlőre csúszik

**Mért befoglaló dobozok (1440×900):**
```
felt  : x 245–1195,  y 117–909      ← az asztal
shoe  : x 1321–1404, y  78–124      ← 126 px-rel az asztal JOBB SZÉLÉN KÍVÜL
sound : x 1172–1404, y  33– 85      ← átfedés: x 1321–1404, y 78–85
```
Ok: `BlackjackTable.css:206-215` a shoe-t `position:absolute; top:70px; right:28px`-szel az **overlay**-hez
köti, az overlay viszont a teljes viewportot fedi, nem az asztalt.

### D4 — A header az asztalon kívül lebeg, mobilon összecsúszik

**Mért:** `header: x 8–1432` — a teljes viewport szélessége, miközben az asztal `x 245–1195`.
A BALANCE panel, a cím és a hangvezérlő a „szoba" üres zöldjén úszik, nem az asztal peremén.
Mobilon (390px) ez összeomlik: a BALANCE panel **ráfut a „BLACKJACK" címre**, a hangvezérlő `+` gombja
**félig kilóg a képernyőről**, a SHOE felirat pedig a hangvezérlő alá csúszik (ld. 05-mobile screenshot).

### D5 — Az eredmény-overlay a termet sötétíti, nem az asztalt

`GameResult.css:2-15`: `position:absolute; inset:0` az overlay-ben → `rgba(0,0,0,0.6)` a **teljes
viewportra**, plusz `border-radius:48px` egy nem-lekerekített területen, plusz a D1-es fölösleges
ellen-forgatás. Az eredmény pillanatában a lapok — amiket épp nézni akarunk — elsötétülnek.

## 2.2 Hiányzó kaszinó-szemantika

### D6 — Nincs asztal-nyomat
Egy valódi blackjack-asztalon **nyomtatott információ** van: `BLACKJACK PAYS 3 TO 2`,
`DEALER MUST STAND ON 17 AND DRAW TO 16`, `INSURANCE PAYS 2 TO 1`, tétkör(ök), biztosítási ív.
Ma összesen **egy halvány arany vízszintes vonal** van (`__center-line-3d`). Az asztal ezért „zöld felület",
nem „blackjack-asztal". Ez a legolcsóbb, legnagyobb hatású hiányzó elem.

### D7 — A tét nem fizikai tárgy
`PlayerArea.tsx:82-86`:
```tsx
<AnimatedChipStack chips={[{ value: 25, id: 'bet-chip' }]} vertical={false} />
```
A tét **mindig egyetlen $25-ös zseton**, függetlenül attól, hogy $5-öt vagy $500-at tettél
(a screenshoton $100 tét → zöld $25-ös korong), ráadásul `scale(0.6)`-tal.
És ami rosszabb: **`playing` fázisban a tét teljesen eltűnik az asztalról** (mérve: a `.player-area__bet-chips`
elem nem létezik a DOM-ban játék közben). Kaszinóban a zsetonjaid végig a körben vannak — ez az egyetlen
vizuális kapcsod a kockázathoz.

### D8 — Nincs shoe, nincs discard tray, nincs chip tray; a penetráció halott adat
A store **kiszámolja** a shoe-penetrációt (`gameStore.ts:87`), de **egyetlen komponens sem olvassa** —
kész adat egy kész funkcióhoz, ingyen. Az asztalról hiányzik az osztó három fizikai tárgya: a shoe (ahonnan
a lap jön), a discard tray (ahová megy) és a chip tray (ahonnan a nyeremény jön). Enélkül a lapok a semmiből
születnek és a semmibe tűnnek.

## 2.3 Hiányzó „élet" — mozgás, idő, ritmus

### D9 — Az osztásnak nincs koreográfiája
A `deal()` egyetlen state-frissítésben 4 lapot ad. A `Hand.tsx:30` `delay: index * 0.1` csak
kézen belül lépcsőz — a játékos és az osztó keze **párhuzamosan** jelenik meg. Valódi osztás sorrendje:
játékos → osztó → játékos → osztó(hátlappal), külön-külön csúszással és hanggal. Ma ez ~0,2 másodperc
alatt lezajlik, ritmus nélkül.

### D10 — Nincs hole card fordítás — a `CardFlip` halott kód
`DealerArea.tsx:14` a hole cardot úgy „takarja", hogy `faceUp:false`-ra állítja a második lapot, a `Hand`
pedig `showBack={false}` alapértékkel megy (`Hand.tsx:14`) — így a `CardFlip` ág (`Hand.tsx:20-34`)
**soha nem fut le**. A hátlap statikus `div`, a felfedés pillanatszerű csere. A `HOLE_CARD_REVEAL_DURATION`
konstans (`animations.ts:3`) ezért **sehol nincs használva**. A hole card megfordítása a blackjack
legdrámaibb pillanata — jelenleg nulla dramaturgiával.

### D11 — Az osztó keze atomikusan oldódik meg
`rules.ts:14-37` (`dealerPlay`) egy ciklusban lehúzza az osztó **összes** lapját, és a store egyetlen
`set()`-ben publikálja. A képernyőn 3 lap egyszerre jelenik meg. A kaszinó feszültsége épp abból jön,
hogy az osztó **egyesével** húz, és minden lap után van egy szünet.
*(Fontos: a domain-logika helyes, nem kell hozzányúlni — a lejátszás presentation-feladat, ld. Fázis 2.)*

### D12 — Nincs zseton-mozgás és nincs egyenleg-felszámolás
Nyerésnél a `balance` azonnal átugrik ($4900 → $5100). Nincs kifizetés: nem jönnek zsetonok az osztó
tálcájából, nem repül semmi az egyenlegbe, vesztésnél nem tolja el az osztó a tétet. Az
`AnimatedChipStack` `animateWin`/`animateLose` variánsai **készen vannak és soha nincsenek bekapcsolva**
(`ChipAnimations.tsx:29-60`).

### D13 — Az avatárok statikusak, a hozzájuk írt animációk halottak
Az `Avatar.css:27-37` definiál `player-avatar--excited` (bounce), `player-avatar--sad` (shake),
`dealer-avatar--dealing` (pulse) osztályokat — **egyik sem kerül fel soha egyetlen elemre sem**.
A hangulat-váltás így csak egy statikus száj-ív cseréje. Nincs pislogás, nincs légzés, nincs mozdulat.

## 2.4 Visszajelzési hiányok

### D14 — A játékos nem látja a saját lapértékét játék közben ⚠️ HASZNÁLHATÓSÁGI HIBA
`PlayerArea.tsx:142`:
```tsx
{isBusted ? 'BUST' : isFinished ? value : ''}
```
`playing` fázisban a badge **üres string**. A screenshot igazolja: a K♠+9♣ alatt nincs szám.
A játékosnak fejben kell összeadnia, miközben az osztó értéke `?`. Ez nem stílus-kérdés — ez a
játszhatóságot rontja, és minden más fejlesztés előtt javítandó.

### D15 — Az osztó besokallása nincs jelölve
A `DealerArea` csak a számot írja ki. A screenshoton az osztó `26`-ot mutat — ami BUST — de semmi nem
jelzi. A játékos kezén van `BUST` badge, az osztóén nincs.

### D16 — Nincs dramaturgia a kritikus eseményeknél
Bust, blackjack, push, dealer-bust — mind ugyanazt a kis kártyát kapja középen. Nincs bélyegző-animáció,
nincs arany részecske-robbanás blackjacknél, nincs piros villanás bustnál.

### D17 — Az osztó néma
Egy élő asztal legerősebb „élő" jelzése az osztó beszéde: *„Tegyék meg tétjeiket"*, *„Nincs több tét"*,
*„Az osztónak 17"*, *„Biztosítás nyitva"*, *„Blackjack, 3:2"*. Ma nulla szöveges kommunikáció van a
játék felől — csak gombok.

## 2.5 Hang

### D18 — Az egyidejű hangokat elnyeli a lejátszó
`useSound.ts:165`: `if (!sound.playing()) sound.play();`
Ha 4 lapot osztunk 200ms-enként, a `card-place` **csak egyszer szólal meg** — a 2–4. hívás eldobódik,
mert az első példány még játszik. Egy Howl-példány = egy hang. Kell hangonként több párhuzamos példány
(vagy `Howl` sprite pool).

### D19 — Nincs terem-hang, nincs variáció, 3 hang kihasználatlan
Nincs ambient loop (halk beszéd-moraj, távoli zsetonok, terem-zaj). Minden lapdobás **pontosan ugyanaz**
a minta ugyanazon a hangmagasságon — géppuska-hatás. A `card-slide`, `chip-stack`, `chip-win` fájlok
lemezen vannak, `useGameSounds` ki is ajánlja őket (`soundHelpers.ts:36-39`), de **egyetlen komponens
sem hívja őket**.

## 2.6 Karbantarthatóság

### D20 — Nincs design token-rendszer
**Mért:** 73 hex színkonstans a CSS-ekben (42 egyedi érték) + 68 hardkódolt hex a TSX-ekben = **141
színliterál**, 18 CSS fájlra szórva. Egyetlen `:root` token-készlet sincs (az `index.css` csak
`--perspective` és `--rotate-x-table` Tailwind-tokent definiál). Egy „kaszinó-hangolás" (filc árnyalata,
arany hőmérséklete, fény iránya) ma **18 fájl kézi átírását** jelentené. Ez a terv első technikai blokkolója.

### D21 — Halott kód és halott állapot
| Elem | Hely | Státusz |
|---|---|---|
| `ChipStack.tsx` | `Chip/ChipStack.tsx` | Sehol nem importált duplikátuma az `AnimatedChipStack`-nek |
| `Chip.selected` prop + `.chip--selected` | `Chip.tsx:10`, `Chip.css:67` | Soha nem kap értéket |
| `Hand.showBack` + `CardFlip` | `Hand.tsx:14`, `CardFlip.tsx` | Soha nem `true` |
| `HOLE_CARD_REVEAL_DURATION`, `DEAL_STAGGER_DELAY` | `animations.ts:3,11` | Sehol nem használt |
| `animateWin` / `animateLose` | `ChipAnimations.tsx:65-66` | Soha nem `true` |
| `shoePenetration` | `gameStore.ts:87` | Írva, sosem olvasva |
| Avatár animációs osztályok | `Avatar.css:27-37` | Sosem alkalmazva |

**Ez jó hír:** a fejlesztők korábban már megépítették a fél infrastruktúrát ehhez a tervhez — csak
sosem lett bekötve. Több fázis ezért lényegesen olcsóbb, mint nulláról indulva.

### D22 — Halott ág és félrevezető komment a domain-ben (nem frontend, de a nyomatot érinti)

`rules.ts:39-46`:
```ts
function shouldDealerHit(value: number, soft: boolean): boolean {
  if (soft) {
    // Soft 17: hit (since dealer stands on soft 17 is false)
    return value < DEALER_STAND_VALUE;   // 17 < 17 → false → MEGÁLL
  }
  // Hard hand: hit if less than 17
  return value < DEALER_STAND_VALUE;     // ugyanaz a kifejezés
}
```
A két ág **azonos kifejezést** ad vissza, a `soft` paraméter tehát funkcionálisan használatlan.
A tényleges viselkedés: az osztó **megáll soft 17-en** (S17) — ez egyezik a `dealerPlay`
docstringjével (`stand on soft 17`), viszont **ellentmond a belső kommentnek** („Soft 17: hit").

Ez a terv szempontjából azért számít, mert a Fázis 1 asztal-nyomata a valós szabályt kell hirdesse.
A nyomat (`DEALER MUST STAND ON 17 AND DRAW TO 16`) a kódnak megfelel; **a komment javítandó és a
halott ág összevonandó** — viselkedésváltozás nélkül, tehát a 151 teszt zöld marad.
Kapcsolódó megfigyelés: az `isSoftHand()` (`hand.ts`) **csak a tesztekből** hívódik — a soft-információ
kiszámolt, tesztelt, de a felületre soha nem jut el (ld. Fázis 5/1., „7 / 17" kijelzés).

## 2.7 Findings összefoglaló

| # | Finding | Súly | Hatás a „kaszinó-érzésre" | Ráfordítás |
|---|---|---|---|---|
| D14 | Lapérték rejtve játék közben | **P0** | Használhatóság | S |
| D1 | Elhagyott 3D ellen-forgatások (5 hely) | **P0** | Magas | S |
| D2 | Zseton él-jelölések összeomlása | **P0** | Magas | S |
| D7 | Tét nem fizikai / eltűnik | **P0** | Nagyon magas | M |
| D3 | SHOE az asztalon kívül + átfedés | P1 | Közepes | S |
| D4 | Header az asztalon kívül / mobil törés | P1 | Magas | M |
| D6 | Nincs asztal-nyomat | P1 | **Nagyon magas** | M |
| D9 | Nincs osztási koreográfia | P1 | **Nagyon magas** | M |
| D10 | Nincs hole card flip | P1 | Nagyon magas | S |
| D11 | Osztó keze atomikus | P1 | Nagyon magas | M |
| D12 | Nincs zseton-mozgás / egyenleg-ugrás | P1 | Nagyon magas | M |
| D17 | Osztó néma | P1 | Nagyon magas | M |
| D18 | Egyidejű hangok elnyelése | P1 | Közepes | S |
| D5 | Eredmény-overlay a termet sötétíti | P2 | Közepes | S |
| D8 | Nincs shoe/tray, penetráció halott | P2 | Magas | M |
| D13 | Statikus avatárok | P2 | Magas | M |
| D15 | Osztó bust nincs jelölve | P2 | Közepes | S |
| D16 | Nincs dramaturgia | P2 | Magas | M |
| D19 | Nincs ambience / variáció | P2 | Magas | M |
| D20 | Nincs design token | P2 | Közvetve minden | M |
| D21 | Halott kód | P3 | — | S |
| D22 | Halott ág + félrevezető komment (`shouldDealerHit`) | P3 | Közvetve (asztal-nyomat hitelessége) | S |

---

# III. RÉSZ — IRÁNY-DÖNTÉS

Mielőtt bármit építünk, egy kérdést el kell dönteni, mert **minden fázis erre épül**:
mit kezdjünk a 3D-vel?

### „A" opció — Egy koherens 3D színpad ✅ **JAVASOLT**

Egyetlen `perspective`-es szülő, benne **egy** döntött színpad (`stage`), amiben a filc, a nyomat, a
lapok, a zsetonok és az osztó tárgyai **ugyanabban a térben** élnek. A HUD (egyenleg, gombok, dialógusok)
külön, **nem forgatott** képernyő-rétegben marad, fölötte.

- A lapok tényleg **az asztalon fekszenek**, nem előtte lebegnek üvegen.
- A zseton-stack valódi magasságot kap (`translateZ`), a kontakt-árnyék az asztalhoz köti.
- A D1-es lapítás **megszűnik**, mert a HUD-nak nincs mit ellen-forgatnia.
- Kockázat: a döntött síkon a szövegek kisebbek hátul → a lapok rangját nagyobbra kell venni, a
  találati felületeket ellenőrizni kell.

### „B" opció — Prémium 2D felülnézet

Elhagyjuk a döntést, tiszta felülnézeti asztalt csinálunk erős fény-szimulációval, árnyékokkal, textúrával.
Alacsonyabb kockázat, gyorsabb, és attól még nagyon kaszinó-szerű (a legtöbb online blackjack így néz ki).
Ekkor a `rotateX` mindenhonnan törlendő, a mélységet kizárólag árnyék és fény adja.

**Ajánlás: „A".** A projektben már benne van a szándék (`--rotate-x-table`, `preserve-3d`, `translateZ`)
és a 28°-os döntés jó szög — csak sosem lett végigvíve. A „A" opcióval a meglévő eszközök a helyükre
kerülnek, nem törlünk munkát. **Ha az EMBER a kisebb kockázatot választja, a „B" opció is teljes értékű —
csak a Fázis 0 tartalma változik, a többi fázis mindkét irányban érvényes.**

---

# IV. RÉSZ — A TERV

> Minden fázis: önállóan szállítható, quality gate-elhető, saját elfogadási kritériummal.
> Effort-skála: **S** <2h · **M** 2–6h · **L** 1–2 nap · **XL** 3+ nap (agent-idő).

---

## FÁZIS 0 — Fundamentum: tokenek + renderelés kijavítása

**Cél:** olyan alap, amin a többi fázis olcsó. Nulla új funkció, mérhetően jobb kép.

**Munka:**
1. **`src/styles/tokens.css`** (új, ~90 sor): a 141 színliterál helyett egyetlen forrás.
   - filc: `--felt-900/700/500`, fény: `--table-light-x/y`, arany: `--gold-400/600`,
     zseton-testszínek: `--chip-5/25/100/500` + kontraszt-párjaik,
     magasság-árnyékok: `--elev-card/chip/tray`, időzítés: `--t-deal/flip/chip/result`.
   - A 18 CSS fájl átvezetése a tokenekre (mechanikus, tesztelhető: vizuális regresszió).
2. **D1 javítása:** a vestigiális `rotateX(-28deg) translateZ(...)` törlése 5 helyről
   (`ActionButtons.css:7`, `DealerArea.css:19,32,38`, `GameResult.css:12`), és a döntés egyetlen
   helyre — a színpad-konténerre — költöztetése („A" opció szerint).
3. **D2 javítása:** `Chip.css` él-jelölések → `transform-origin: 50% 30px` + `rotate(N*45deg)`,
   zseton **teste** kapja a színt (`CHIP_COLORS` → világos/sötét pár), fehér él-betétek.
4. **D3/D4 javítása:** a header és a shoe-jelző az asztal geometriájához kötése; a HUD saját
   `screen-layer`-be kerül, `env(safe-area-inset-*)` figyelembevételével.
5. **D21 takarítás:** `ChipStack.tsx` törlése, nem használt konstansok bekötése vagy törlése.

**Új fájlok:** `src/styles/tokens.css`
**Érintett:** mind a 18 CSS + `Chip.tsx`, `BlackjackTable.tsx`
**Tesztek:** `chips.test.ts` (színpár-leképezés), vizuális regresszió-alap felvétele (ld. 8. szakasz)
**Elfogadás:** `renderedH/layoutH === 1.000` minden HUD-elemen (ma 0.883); a 8 zseton-jelölés 8 külön
pozíción; `shoe` befoglaló doboza a `felt` dobozán **belül**; mobil 390px-en nulla vízszintes túlcsordulás.
**Effort:** M–L · **Kockázat:** alacsony (nincs viselkedésváltozás, e2e érintetlen)

---

## FÁZIS 1 — A terem és az asztal

**Cél:** az asztal ne felület legyen, hanem hely.

**Munka:**
1. **Terem:** `body` háttere mély, meleg sötét (bordó/szén) + vignetta + halvány szőnyeg-minta;
   fentről **fénykúp** az asztalra (`radial-gradient` + `mix-blend-mode`), a filc világosabb középen,
   sötétebb a széleken — így az asztal *ki van világítva*, nem *zöldre van festve*.
2. **Perem (rail):** párnázott bőr-korlát az asztal körül, öltés-mintával, felső fénycsíkkal;
   a `10px solid #1a1a1a` „fakeret" helyett. A HUD ide kerülhet (egyenleg a peremen).
3. **Filc-textúra újrahangolása:** a jelenlegi `feTurbulence baseFrequency=0.9 + overlay` blend
   éles zöld szemcsét ad (TV-zaj hatás). Finomabb frekvencia + alacsonyabb opacitás + irányfüggő
   szövet-csík = valódi filc.
4. **Asztal-nyomat** (`TableMarkings.tsx`, ~120 sor SVG): ív alakú arany felirat
   `BLACKJACK PAYS 3 TO 2`, alatta `DEALER MUST STAND ON 17 AND DRAW TO 16`,
   `INSURANCE PAYS 2 TO 1` a biztosítási íven, tétkör(ök) körvonala, osztó-vonal.
   *Szabály-ellenőrzés elvégezve: a `rules.ts` osztója **megáll soft 17-en** (S17-szabály),
   tehát a fenti nyomat szabály-helyes és hazugság nélkül kiírható. A kódbeli komment viszont
   az ellenkezőjét állítja — ld. D22.*
5. **Osztó tárgyai:** `Shoe.tsx` (jobb oldalt, a maradék lapok magasságával — **`shoePenetration`
   végre hasznosul**), `DiscardTray.tsx` (bal oldalt, telik a körök során), `ChipTray.tsx`
   (osztó előtt, színenkénti rekeszekkel).

**Új fájlok:** `Table/TableMarkings.tsx`, `Table/Shoe.tsx`, `Table/DiscardTray.tsx`,
`Table/ChipTray.tsx`, `Table/Rail.tsx` (+ CSS-eik)
**Elfogadás:** screenshot-összevetés a baseline-nal; a `shoePenetration` vizuálisan követi a húzásokat;
6 filc-alrendszer tokenekből, nulla új hex literál.
**Effort:** L · **Kockázat:** alacsony

---

## FÁZIS 2 — Az osztás koreográfiája

**Cél:** az osztásnak legyen ideje, sorrendje és hangja. Ez a legnagyobb egyszeri „élő" ugrás.

**Munka:**
1. **`useDealChoreography.ts`** (új hook, ~80 sor): a store-tól kapott végállapotból **lejátszási
   ütemtervet** csinál — nem nyúl a domainhez.
   Sorrend: `játékos1 → osztó1 → játékos2 → osztó2(hátlap)`, lépésköz ~180–220ms.
   Minden lépés: repülés a **shoe koordinátájáról** a cél-slotra (framer-motion `layoutId`),
   ív + forgás közben, landolásnál ±2–3° véletlen dőlés és kontakt-árnyék, `card-slide` majd
   `card-place` hang.
2. **Hole card valódi fordítás (D10):** a `CardFlip` bekötése (`showBack` használatba vétele),
   `HOLE_CARD_REVEAL_DURATION` végre használva; a fordítás közben az osztó értéke `?`-ről
   **felszámol** a valódi értékre.
3. **`useDealerReveal.ts`** (új hook, ~60 sor) **D11 megoldása domain-érintés nélkül:** a store már
   birtokolja az osztó teljes kezét; a hook csak azt szabályozza, **hány lap látszik belőle**, és
   lépteti időzítve (~400ms/lap). Az érték-badge minden lap után frissül. Így megmarad a feszültség,
   miközben a `rules.ts` egy sora sem változik és a 151 teszt érintetlen.
4. **Hit/double lap:** ugyanaz a repülési pálya a shoe-ból, `card-place` hanggal.
5. **Sebesség-kapcsoló:** `src/constants/animations.ts` bővítése egy `CHOREO_SPEED` szorzóval,
   ami `prefers-reduced-motion` esetén 0-ra, `VITE_E2E` alatt gyorsra vált (e2e időbüdzsé, ld. 7. szakasz).

**Új fájlok:** `hooks/useDealChoreography.ts`, `hooks/useDealerReveal.ts`
**Érintett:** `Hand.tsx`, `DealerArea.tsx`, `PlayerArea.tsx`, `constants/animations.ts`
**Tesztek:** a két hook tiszta időzítés-logikája `vi.useFakeTimers()`-szel egységtesztelhető
(lépések száma, sorrend, végállapot-konvergencia) — ez tartja a coverage-t.
**Elfogadás:** a teljes osztás 0,9–1,2s alatt lefut; az osztó lapjai egyesével jelennek meg;
a hole card 3D-ben fordul; **mind a 8 e2e szcenárió zöld marad** időtúllépés nélkül.
**Effort:** L · **Kockázat:** **közepes — a 3. e2e szcenárió (blackjack) 5 s-os ablaka a kemény
korlát: a kezdő osztás ≤2,5 s. Ld. 7.1 a teljes, assertenkénti elemzésért.**

---

## FÁZIS 3 — A tét mint fizikai zseton

**Cél:** a kockázat láthatóvá és tapinthatóvá tétele.

**Munka:**
1. **`src/logic/chips.ts`** (új, tiszta függvény, ~40 sor):
   `decomposeBet(amount: number): ChipValue[]` — mohó felbontás 500/100/25/5-re.
   Domain-réteg, I/O-mentes, triviálisan tesztelhető → coverage-barát.
2. **`Chip/BetStack.tsx`** (új, ~70 sor): a valódi tét zseton-oszlopa a tétkörben — minden zseton
   apró véletlen x/y eltolással és forgással (kézzel rakott stack), valódi magassággal,
   `chip-stack` hanggal minden hozzáadásnál. **D7 megoldva.**
3. **A tét végig az asztalon marad** (`betting` → `insurance` → `playing` → `finished`).
4. **Double:** második oszlop csúszik az első mellé (`chip-drop`).
   **Split:** a tét-oszlop duplázódik és a második kézhez csúszik.
5. **Kifizetés (D12):** nyerésnél a `ChipTray`-ből zsetonok repülnek a tétkörbe (framer-motion
   `layoutId` shared-element), majd az egész oszlop az egyenleg-panelbe — `chip-win` hanggal;
   vesztésnél a stack az osztó tálcájába csúszik. Az `AnimatedChipStack` meglévő
   `winChipVariants`/`loseChipVariants` **végre bekötve**.
6. **`useCountUp.ts`** (új, ~40 sor): az egyenleg rugós felszámolása a kifizetés ütemére.
7. **Tét-vezérlők:** `ChipSelector` kijelölt állapot (`selected` prop **végre használva**),
   `CLEAR` / `REBET` / `DOUBLE BET` gombok — ez valódi kaszinó-UX és gyorsítja a játékot.

**Új fájlok:** `logic/chips.ts`, `components/Chip/BetStack.tsx`, `hooks/useCountUp.ts`,
`components/UI/BetControls.tsx`
**Tesztek:** `chips.test.ts` (felbontás minden határesetre: 0, 5, 130, 999, nem osztható maradék),
`useCountUp` időzítés-teszt
**Elfogadás:** $130 tét → 1×100 + 1×25 + 1×5 vizuálisan; a tét minden fázisban látszik;
a `bet-chip-*` és `deal-button` testid-ek változatlanok.
**Effort:** L · **Kockázat:** közepes (a `layoutId`-repülés jsdom-ban nem tesztelhető → e2e/screenshot fedi)

---

## FÁZIS 4 — Az élő osztó

**Cél:** legyen valaki az asztal túloldalán.

**Munka:**
1. **Idle élet:** pislogás (véletlen 3–6s), halk légzés-mozgás, fej-mikromozgás. SVG-ben olcsó:
   a szem-ellipszisek `ry` animálása + a törzs 1–2px-es `translateY` ciklusa.
2. **Reaktív mozdulatok:** osztáskor kéz-mozdulat + a meglévő `dealer-avatar--dealing` osztály
   **végre alkalmazva**; hole card felfedésekor „belenéz"; ász esetén lesi a lapot;
   a játékos blackjackjére biccent. Ugyanígy a játékos-avatárnál: `--excited` / `--sad` bekötése (**D13**).
3. **`src/logic/dealerLines.ts`** (új, tiszta leképezés ~60 sor):
   `(phase, context) => string` — pl.
   `betting` → „Tegyék meg tétjeiket", `deal` → „Nincs több tét",
   `insurance` → „Biztosítás nyitva", `dealerReveal` → „Az osztónak 17",
   `blackjack` → „Blackjack, fizet három a kettőhöz", `bust` → „Besokallt".
   Magyar és angol változat egy `Record`-ban, nyelvváltásra készen.
4. **`Avatar/DealerSpeech.tsx`** (új, ~60 sor): buborék az osztó fölött, be/kiúszó animációval,
   sorbaállított üzenetekkel (egyszerre egy). **D17 megoldva.**
   *Bővítés opcionálisan később: Web Speech API TTS — külön döntés, mert hangzási minőség-kockázat.*

**Új fájlok:** `logic/dealerLines.ts`, `components/Avatar/DealerSpeech.tsx`,
`hooks/useIdleAnimation.ts`
**Tesztek:** `dealerLines.test.ts` — minden fázis+kontextus kombinációra van sor, nincs `undefined`
**Elfogadás:** az osztó minden fázisváltásnál mond valamit; idle-ben mozog; `prefers-reduced-motion`
alatt a buborék marad, a mozgás megáll.
**Effort:** M–L · **Kockázat:** alacsony

---

## FÁZIS 5 — Dráma és visszajelzés

**Cél:** a fontos pillanatok érződjenek fontosnak. **Itt javul a D14 is — de azt már a Day-1-ben megcsináljuk.**

**Munka:**
1. **Élő lapérték (D14):** a badge minden fázisban mutassa az értéket; soft kéznél „7 / 17" formátum
   (a `calculateHandDetails` már számol `isSoft`-ot — újabb kész, kihasználatlan adat).
   *Vigyázat: a `player-hand-value-0` testid szövegét e2e ellenőrzi `BUST`-ra — a bust-ág szövege
   nem változhat.*
2. **Osztó bust jelölése (D15):** piros `BUST` badge az osztónál is, azonos vizuális nyelven.
3. **Bust:** a kéz piros villanása, lapok apró rázkódása, gumibélyegző-szerű `BUST` lenyomat.
4. **Blackjack:** arany fénykitörés, részecske-zápor, arany tábla — a legnagyobb ünnep.
5. **Win/Push:** zöld perem-ragyogás a nyertes kézen / semleges visszacsúszás push-nál.
6. **Eredmény-overlay újratervezése (D5):** **ne sötétítse a termet.** Helyette: a nyertes kézre
   szűkülő fénykör, a lapok végig olvashatók maradnak, az eredmény kompakt szalagként jelenik meg
   az asztal alsó harmadában. A `game-result-overlay`, `game-result-card-*`, `game-result-badge-*`
   testid-ek és szövegek **változatlanok maradnak** (e2e szerződés).
7. **Aktív kéz jelölése:** a jelenlegi féláttetsző fehér tábla helyett arany fénykör a tétkör körül
   + finom pulzálás.

**Érintett:** `PlayerArea.tsx`, `DealerArea.tsx`, `GameResult.tsx` + CSS-eik
**Új:** `components/UI/HandValueBadge.tsx`, `components/UI/ResultBanner.tsx`
**Elfogadás:** e2e mind a 8 zöld (a badge-szövegek betű szerint azonosak); a lapok az eredmény
pillanatában is olvashatók (kontraszt-mérés); az eredmény→betting átmenet ≤400 ms és nem
blokkolja a `ChipSelector` mountolását (8. szcenárió, `bet-chip-100` láthatósági assert — ld. 7.1).
**Effort:** M–L · **Kockázat:** **közepes — e2e-érzékeny terület, szövegváltoztatás tilos**

---

## FÁZIS 6 — Hangkép

**Cél:** a terem hallatszódjon.

**Munka:**
1. **D18 javítása:** a `play()` ne dobja el az egyidejű hívást. Hangonként kis példány-pool
   (2–4 `Howl`, körbeforgó kiosztás) vagy `Howl` sprite-ok. **Figyelem:** a `useSound.ts` ma
   302 sor a 300-as limitnél — a pool-logika **külön fájlba** (`hooks/soundPool.ts`) kell kerüljön,
   ez egyben a fájl darabolását is megoldja.
2. **Variáció:** minden lapdobásnál ±6% véletlen `rate` és ±10% `volume` → nem géppuska.
3. **A 3 kihasználatlan hang bekötése:** `card-slide` (repülő lap), `chip-stack` (tét építése),
   `chip-win` (kifizetés).
4. **Ambience:** halk terem-loop (moraj, távoli zseton-csörgés), ~0,12 hangerőn, a fontos
   eseményeknél 300ms-os duckinggal. Új asset kell (`public/sounds/ambience.*`) —
   **licenc-tiszta forrás kötelező, az EMBER dönt a beszerzésről.**
5. **Hang-mix:** a `SoundSettings` bővítése külön ambience/effekt csúszkával.

**Új fájlok:** `hooks/soundPool.ts`, esetleg `public/sounds/ambience.{ogg,mp3}`
**Tesztek:** a `useSound` ma mockolva van a komponens-tesztekben — a pool tiszta logikája
(kiosztás, körbeforgás) **külön unit-tesztet kap**, ez zárja a `learnings.md`-ben rögzített rést,
ami miatt a korábbi hang-race hetekig rejtve maradt.
**Elfogadás:** 4 gyors `card-place` hívás → 4 megszólalás (Howler `playing()` példányszám mérve);
`useSound.ts` ≤300 sor.
**Effort:** M · **Kockázat:** alacsony, **de** ambience-asset nélkül a 4. pont csúszik

---

## FÁZIS 7 — HUD, mobil, kényelem

**Munka:**
1. **HUD az asztal peremére:** egyenleg és beállítások a rail-en, nem a szoba levegőjében (**D4**).
2. **Mobil layout:** 390px-en a header függőleges elrendezésbe vált, a hangvezérlő ikonra
   csuklik össze (fiók), az asztal portré-optimalizált, safe-area figyelembevétele.
3. **Session-sáv:** kezek száma, nyerési arány, legnagyobb nyeremény, aktuális széria — halk,
   diszkrét adat, ami az „ülésben létet" adja.
4. **Billentyűk:** `H`/`S`/`D`/`P`, `Space` = deal/new round, `1-4` = zseton-választás.
   Kaszinó-tempó egérrel is: a döntés gyorsasága maga is élmény.
5. **Shoe-újrakeverés jelzése:** a store `newRound()`-ja 25% alatt új shoe-t húz — ma **néma**.
   Legyen látható: az osztó bejelenti („Új pakli"), a shoe feltöltődik, keverés-animáció.

**Új fájlok:** `components/UI/SessionStats.tsx`, `hooks/useKeyboardShortcuts.ts`
**Elfogadás:** 390px-en nulla túlcsordulás és nulla átfedés (mérve); billentyűk minden fázisban
a helyes akciót hívják és letiltott állapotban nem tüzelnek.
**Effort:** M · **Kockázat:** alacsony

---

## FÁZIS 8 — Minőség, akadálymentesség, teljesítmény

**Munka:**
1. **`prefers-reduced-motion`:** a globális CSS-szabály (`index.css:22-30`) csak CSS-animációt fog;
   a framer-motion és a JS-időzítők **külön kapcsolót** igényelnek → `useReducedMotion()` hook,
   `CHOREO_SPEED = 0` esetén azonnali végállapot.
2. **ARIA:** `aria-live="polite"` régió, ami bemondja az osztó lépéseit, a lapértéket és az eredményt —
   így a képernyőolvasós játék is követhető. Az osztó-buborék szövege ide is bekerül.
3. **Kontraszt:** a `rgba(255,255,255,0.4–0.6)` feliratok (`shoe__label`, `player-area__empty`,
   `hand-label`) a filcen nem érik el a WCAG AA-t — token-alapú javítás.
4. **Teljesítmény-büdzsé:** csak `transform`/`opacity` animál; `will-change` mértékkel;
   a részecske-effektek maximum 60 elem, `requestAnimationFrame`-ből, `content-visibility` a
   nem látható rétegeken. Cél: 60fps közepes gépen, a főszál blokkolás <8ms/frame.
5. **Vizuális regresszió:** Playwright screenshot-teszt fázisonként (betting / playing / finished,
   desktop + mobil), hogy a jövőbeli változtatás ne rontsa vissza észrevétlenül.

**Elfogadás:** quality gate zöld (coverage ≥85%, lint 0, typecheck 0, ≤300 sor/fájl),
`prefers-reduced-motion` alatt nulla mozgás és **teljes játszhatóság**, Lighthouse a11y ≥95.
**Effort:** M · **Kockázat:** alacsony

---

# V. RÉSZ — AZONNALI QUICK WINEK (Day 1, ~1 nap)

Ezek fázis-függetlenek, azonnal szállíthatók, és külön-külön is érezhetők:

| # | Mit | Hol | Effort |
|---|---|---|---|
| 1 | **Lapérték látszik játék közben** | `PlayerArea.tsx:142` | 10 perc |
| 2 | **Zseton él-jelölések szétosztása** (`transform-origin`) | `Chip.css:143-166` | 20 perc |
| 3 | **Zseton teste kapjon színt**, ne csak a kerete | `types/index.ts:34-40`, `Chip.css` | 45 perc |
| 4 | **Vestigiális ellen-forgatások törlése** (osztó avatár 11,7% lapítás) | 5 CSS hely (D1) | 30 perc |
| 5 | **SHOE-jelző az asztalra**, átfedés megszüntetése | `BlackjackTable.css:206-215` | 30 perc |
| 6 | **Valódi tét-zseton felbontás** a fix $25 helyett | `logic/chips.ts` + `PlayerArea.tsx:82` | 1,5 óra |
| 7 | **Hole card valódi fordítás** (`CardFlip` bekötése) | `DealerArea.tsx:14`, `Hand.tsx:14` | 1 óra |
| 8 | **Egyidejű hangok engedése** | `useSound.ts:165` + `soundPool.ts` | 1,5 óra |
| 9 | **Avatár-animációk bekötése** (kész CSS, sosem használt) | `PlayerAvatar/DealerAvatar` + `Avatar.css` | 45 perc |
| 10 | **Egyenleg felszámolása** ugrás helyett | `Balance.tsx` + `useCountUp.ts` | 1 óra |
| 11 | **Osztó BUST badge** | `DealerArea.tsx` | 20 perc |
| 12 | **Lap-takarás lazítása** (35px → 44px spread) | `Hand.tsx:15` | 10 perc |

---

# VI. RÉSZ — ARCHITEKTÚRA-HATÁS

## Új fájlok és rétegbesorolás

```
src/
├── styles/
│   └── tokens.css                 ← ÚJ: egyetlen design-forrás (Fázis 0)
├── logic/                          (domain — tiszta, tesztelt)
│   ├── chips.ts                   ← ÚJ: decomposeBet()          (Fázis 3)
│   └── dealerLines.ts             ← ÚJ: fázis → osztó-szöveg    (Fázis 4)
├── hooks/
│   ├── soundPool.ts               ← ÚJ: párhuzamos hang-példányok (Fázis 6)
│   ├── useDealChoreography.ts     ← ÚJ: osztási ütemterv         (Fázis 2)
│   ├── useDealerReveal.ts         ← ÚJ: osztó lapjai egyesével   (Fázis 2)
│   ├── useCountUp.ts              ← ÚJ: egyenleg-felszámolás     (Fázis 3)
│   ├── useIdleAnimation.ts        ← ÚJ: pislogás/légzés          (Fázis 4)
│   └── useKeyboardShortcuts.ts    ← ÚJ                           (Fázis 7)
└── components/
    ├── Table/{Rail,TableMarkings,Shoe,DiscardTray,ChipTray}.tsx  (Fázis 1)
    ├── Chip/BetStack.tsx                                          (Fázis 3)
    ├── Avatar/DealerSpeech.tsx                                    (Fázis 4)
    └── UI/{HandValueBadge,ResultBanner,BetControls,SessionStats}.tsx
```

## Amit **nem** érintünk

- `logic/deck.ts`, `logic/hand.ts`, `logic/rules.ts` — a blackjack-szabályok. *(Egyetlen kivétel
  megfontolásra: a soft-17 szabály és az asztal-nyomat összhangja, ld. Fázis 1/4.)*
- `store/gameStore.ts`, `store/validators.ts` — a játékmenet és a validáció.
- Meglévő tesztfájlok — az AGENTS.md szerint a tesztek definiálják a specifikációt.
- `.quality_gate.conf`, `quality_gate.sh` — csak olvasható.

## Fájlméret-büdzsé

A `useSound.ts` (302) és a `gameStore.ts` (298) **már a 300-as limiten van**. A Fázis 6 ezért
kötelezően kiszervezi a pool-logikát külön fájlba. Minden új komponens célja ≤150 sor.

---

# VII. RÉSZ — KOCKÁZATOK ÉS KORLÁTOK

## 7.1 ⚠️ E2E időbüdzsé — a terv legnagyobb technikai kockázata

Az `e2e/game-flow.spec.ts` **8 szcenáriót / 13 assertet** tartalmaz. A `playwright.config.ts` **nem
állít globális `expect.timeout`-ot**, ezért az explicit timeout nélküli assertek a Playwright
**default 5000 ms**-án futnak. Verifikálva, assertenként:

| # | Szcenárió | Assert (sor) | Timeout | Az 5s-os ablak **kezdete** | Mit kell tartalmaznia |
|---|---|---|---|---|---|
| 1 | stand → dealer bust | `game-result-badge-0`=WIN (42) | **default 5000** | `action-stand` klikk | hole flip + 1 osztó-húzás + eredmény |
| 1 | stand → dealer bust | `dealer-value`=26 (43) | **default 5000** | (42 után, már teljesült) | — |
| 2 | hit → player bust | `player-hand-value-0`=BUST (57) | **default 5000** | `action-hit` klikk | 1 lap repülés + bust-bélyeg |
| 2 | hit → player bust | `game-result-badge-0`=LOSE (58) | **default 5000** | (57 után) | hole flip + eredmény |
| **3** | **blackjack 3:2** | **`game-result-badge-0`=BLACKJACK! (75)** | **default 5000** | **`deal-button` klikk** | **a TELJES kezdő osztás + hole flip + eredmény** |
| 4 | double down | `…`=WIN (96) | 15000 | `action-double` | bőven elég |
| 5 | split | `…`=WIN ×2 (119,120) | 15000 | `action-stand` ×2 | bőven elég |
| **6** | **insurance buy** | **`game-result-badge-0`=LOSE (136)** | **default 5000** | **`insurance-buy` klikk** | **hole flip + osztó-BJ + eredmény** |
| 7 | insurance decline | `…`=WIN (154) | 15000 | `action-stand` | bőven elég |
| 8 | full round cycle | `…`=WIN (176) | 15000 | `action-stand` | bőven elég |
| **8** | **full round cycle** | **`bet-chip-100` toBeVisible (180)** | **default 5000** | **`new-round-button` klikk** | **eredmény-kilépés + betting UI belépés** |
| 8 | full round cycle | `…`=WIN (186) | 15000 | `action-stand` | bőven elég |

**Összesen 7 assert fut 5000 ms-on, 5 különböző szcenárióban.**

### A szűk keresztmetszet: a 3. szcenárió (blackjack)

Ez az **egyetlen** default-timeoutos assert, amelynek ablaka a **teljes kezdő osztási koreográfiát**
tartalmazza. A `deal-button` klikk után a store azonnal `finished` fázisba megy (`gameStore.ts:66-83`,
természetes blackjack), tehát az 5 másodpercbe bele kell férnie:

```
kezdő osztás (4 lap × ~200ms)   ~0,8–1,0 s
hole card fordítás              ~0,5 s
RESULT_SOUND_DELAY_MS           ~0,5 s
eredmény-szalag megjelenés      ~0,3 s
------------------------------------------
összesen                        ~2,1–2,3 s   (5,0 s-ból)
```

**Ez ~2,2× tartalék — elfogadható, de ez a terv kemény felső korlátja: a kezdő osztás
koreográfiája nem nyúlhat 2,5 s fölé** még akkor sem, ha a lassabb ütem szebb lenne.

### A mechanizmus, ami a koreográfiát az e2e-hez köti

Vizuálisan az eredmény-szalag **nem jelenhet meg, amíg a lapok még repülnek** — tehát a
`GameResult` renderelését a koreográfia befejeződéséhez kell kapuzni, nem pusztán a
`phase === 'finished'`-hez. **Éppen ez a kapuzás teszi az e2e-t időzítés-érzékennyé.**
Ha nem kapuznánk, a badge azonnal megjelenne (az e2e triviálisan átmenne), de a kép hibás lenne.
Ezt a döntést a Fázis 2 és Fázis 5 tervezésekor tudatosan vállaljuk.

### A 8. szcenárió külön csapdája

A `bet-chip-100` láthatósági assert (180) az **eredmény→betting átmenet** ablakában fut. Ha a
Fázis 5 eredmény-szalagja `AnimatePresence` kilépő animációt kap, és a `ChipSelector` mountolása
a kilépés *után* történik, az átmenet teljes hossza is az 5 s-ba számít. **Korlát: az eredmény
kilépő animációja ≤400 ms, és a betting UI ne várja meg a kilépést** (párhuzamos átmenet).

### Kötelező mérséklés

`CHOREO_SPEED` szorzó a `constants/animations.ts`-ben:
- `VITE_E2E` alatt **×0,25** → mind a 7 kritikus ablak ~0,6 s alá esik (>8× tartalék),
- `prefers-reduced-motion` alatt **0** → azonnali végállapot,
- alapértelmezés **1,0**.

A Playwright már `VITE_E2E=1`-gyel indít (`playwright.config.ts:13`), így **az e2e fájl egyetlen
sora sem módosul** — csak a futásidejű animáció-sebesség.

*Fenntartás:* a `learnings.md` rögzíti, hogy a `VITE_E2E` kapu korábbi security auditban megjegyzést
kapott. Ez a szorzó **kizárólag időzítést** befolyásol — állapotot, shoe-t, kimenetelt nem. Ez a határ
nem léphető át.

*Alternatíva, ha a szorzó nem lenne elég:* a `playwright.config.ts`-be felvehető egy globális
`expect: { timeout: 15000 }` — ez **nem tesztmódosítás** (a spec-fájl érintetlen marad), viszont
konfigurációs változás, ezért csak az EMBER jóváhagyásával.

## 7.2 Coverage ≥85% animáció-nehéz kódon

A framer-motion és a `layoutId`-repülés jsdom-ban nem mérhető értelmesen. Ezért a terv szándékosan
**tiszta logikába** tolja a bonyolultat (`chips.ts`, `dealerLines.ts`, a hookok időzítés-magja
`vi.useFakeTimers()`-szel), és a vizuális részt screenshot-regresszióval fedi. Így a coverage nem
esik, és nem kell értelmetlen DOM-teszteket írni.

## 7.3 További kockázatok

| Kockázat | Mérséklés |
|---|---|
| A 3D-döntés rontja a lap-olvashatóságot | Nagyobb rang-index, kontraszt-mérés, „B" opció mint kiút |
| Teljesítmény gyengébb gépen (részecskék, árnyékok) | 60-elemes plafon, csak transform/opacity, fázis 8 büdzsé |
| Ambience-asset licenc | Beszerzés az EMBER döntése; a fázis enélkül is szállítható |
| Design-token migráció regresszió | Screenshot-baseline **a migráció előtt** felvéve (Fázis 0 első lépése) |
| `useSound.ts` túllépi a 300 sort | Pool külön fájlba — a fázis része, nem utólagos toldás |

---

# VIII. RÉSZ — MÉRÉS ÉS ELFOGADÁS

## Objektív kritériumok

| Mérés | Ma | Cél |
|---|---:|---:|
| HUD-elemek `renderedH/layoutH` | 0.883 | 1.000 |
| Zseton él-jelölések különböző pozíción | 4 / 8 | 8 / 8 |
| `shoe` doboza a `felt` dobozán belül | nem | igen |
| Vízszintes túlcsordulás 390px-en | van | nincs |
| Lapérték látható `playing` fázisban | nem | igen |
| Tét látható `playing` fázisban | nem | igen |
| Osztó lapjai egyesével jelennek meg | nem | igen |
| Egyidejű `card-place` megszólalás 4 hívásra | 1 | 4 |
| Kihasználatlan hangfájl | 3 | 0 |
| Színliterál a forrásban | 141 | ≤10 (token-fájlon kívül) |
| Unit teszt | 151 zöld | ≥151 zöld |
| E2E | 8 zöld (13 assert) | 8 zöld (13 assert) |

## Szubjektív ellenőrzőlista — „mitől élő?"

- [ ] Ha 3 másodpercig nem csinálok semmit, **történik-e valami a képernyőn?** (idle, pislogás, ambience)
- [ ] Meg tudom-e **mondani a tétem összegét ránézésre**, a szám elolvasása nélkül? (zseton-oszlop)
- [ ] **Vártam-e** a hole cardra? (van-e dramaturgiai szünet)
- [ ] Éreztem-e a nyereményt **mielőtt** elolvastam a számot? (zseton-mozgás, hang, fény)
- [ ] Tudom-e, **hol vagyok** — melyik körben, mennyi lap van a shoe-ban, mennyit nyertem eddig?
- [ ] **Mondott-e nekem valaki valamit** ebben a körben?

## Regressziós háló

Playwright screenshot-teszt fázisonként (betting / playing / finished × desktop + mobil = 6 kép),
determinisztikus shoe-val (`blackjack:e2e-shoe`) és `CHOREO_SPEED=0`-val, hogy a képek stabilak
legyenek. A Fázis 0 **első** lépése a mai állapot baseline-ként való rögzítése.

---

# IX. RÉSZ — ÜTEMTERV

| Mérföldkő | Tartalom | Effort | Eredmény |
|---|---|---:|---|
| **M0 — Day 1** | 12 quick win (V. rész) | ~1 nap | Azonnal láthatóan hitelesebb, nulla kockázat |
| **M1** | Fázis 0 (tokenek + renderelés) | 1–1,5 nap | Szilárd alap, minden hiba javítva |
| **M2** | Fázis 1 (terem + asztal) | 1,5–2 nap | **Ez már egy hely, nem egy felület** |
| **M3** | Fázis 2 (koreográfia) | 1,5–2 nap | **Ez már egy játszma, nem egy állapotváltás** |
| **M4** | Fázis 3 (zsetonok) | 1,5–2 nap | **Ez már pénz, nem egy szám** |
| **M5** | Fázis 4 (élő osztó) | 1–1,5 nap | **Ez már valaki, nem egy ikon** |
| **M6** | Fázis 5 + 6 (dráma + hang) | 2–2,5 nap | Érzelem és tér |
| **M7** | Fázis 7 + 8 (HUD, mobil, a11y, perf) | 1,5–2 nap | Kész termék |
| | **Összesen** | **~12–16 nap** | |

Minden mérföldkő végén: `npm run lint && npm run typecheck && npm run test:run && npm run test:e2e && npm run build`,
majd `./quality_gate.sh`. **PASS előtt nincs „KÉSZ".** A commitolást — a GIT_WORKFLOW.md szerint — az EMBER végzi.

---

# FÜGGELÉK A — A mérés reprodukálása

A diagnózis nem kódolvasásból, hanem futó alkalmazásból származik. Reprodukálás:

```bash
# 1) dev szerver determinisztikus shoe-val
VITE_E2E=1 npx vite --host 127.0.0.1 --port 5199

# 2) mérőszkript (rendszer Chrome-mal, letöltött Playwright-böngésző nélkül)
#    - chip él-jelölések befoglaló dobozai
#    - shoe / sound / felt / header átfedés-mérés
#    - renderedH / layoutH arány a counter-rotált elemeken
#    - screenshotok: betting / playing / finished, desktop + mobil
```

A szkript `chromium.launch({ channel: 'chrome' })`-t használ — a gépen nincs letöltött Playwright-böngésző,
de van rendszer Chrome (`/usr/bin/google-chrome`). Fontos csapda (a `learnings.md` is rögzíti):
**ellenőrizd, melyik szerver szolgálja a modult** — `vite dev` vagy `vite preview` (buildelt `dist/`).

# FÜGGELÉK B — E2E testid-szerződés (NEM TÖRHETŐ)

Ezek a `data-testid`-ek és a hozzájuk tartozó **szövegek** az `e2e/game-flow.spec.ts` szerződését képezik.
A terv egyik fázisa sem változtathatja meg őket:

```
deal-button              new-round-button        game-error
bet-chip-{5|25|100|500}  balance-reset           dealer-area
action-hit  action-stand  action-double  action-split
insurance-buy  insurance-decline
dealer-value              → szöveg: számérték vagy "?"
player-hand-{i}           player-hand-value-{i}  → szöveg: "BUST" | számérték
game-result-overlay       game-result-card-{i}
game-result-badge-{i}     → szöveg: "WIN" | "LOSE" | "PUSH" | "BLACKJACK!"
```

# FÜGGELÉK C — Bizonyíték-táblázat

| Állítás | Mért adat |
|---|---|
| HUD-elemek 11,7%-kal lapítottak | `ratio = 0.883`, `cos(28°) = 0.883`, `perspectiveOnParent: none` |
| Osztó avatár kisebb a játékosénál | `dealer-avatar: 49.4px` vs `player-avatar: 56.0px` (mindkettő `size={56}`) |
| Zseton-jelölések összeomlása | 8 elem → 4 pozíció, mind `x∈[601.8,604] y∈[714,716.3]` |
| SHOE az asztalon kívül | `shoe.left = 1321` vs `felt.right = 1195` → **+126px** |
| SHOE / hangvezérlő átfedés | metszet: `x 1321–1404`, `y 78–85` |
| Header az asztalon kívül | `header: x 8–1432` vs `felt: x 245–1195` |
| Tét eltűnik játék közben | `.player-area__bet-chips` a DOM-ban: `false` |
| Színliterálok | 73 hex a CSS-ekben (42 egyedi) + 68 a TSX-ekben = **141** |
| Teszt-baseline | 151 teszt / 9 fájl zöld, 1,18s |

---

**Készítette:** Claude Opus 5 · 2026-09-06 · bázis `818fcaa`
**Következő lépés az EMBER döntésére:** (1) „A" vagy „B" 3D-irány, (2) indulhat-e az M0 quick win csomag.
