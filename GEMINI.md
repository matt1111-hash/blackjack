# Harold's Blackjack Casino - 3D Vizuális Upgrade Audit és Akcióterv

## 1. Jelenlegi Architektúra Elemzése

*   **Komponens struktúra (`src/components/Table/`, `src/components/Card/`):** 
    A jelenlegi asztal (`BlackjackTable.tsx`) egy teljesen lapos, 2D Flexbox alapú elrendezést használ (`.blackjack-table__felt`). A kártyák és zsetonok sík DOM elemek. Nincs semmilyen térbeli mélység (z-indexek csak a 2D takarást szolgálják), és a DOM fa nincs felkészítve a 3D transzformációk öröklésére (`transform-style`).
*   **State Management (`src/store/gameStore.ts`):** 
    **Kiváló hír!** A játéklogika (Zustand) tökéletesen el van választva a UI pozicionálástól. A store tisztán logikai állapotokat (`balance`, `shoe`, `playerHands`, `phase`) tárol, nincsenek benne pixel koordináták vagy vizuális kötések. Emiatt a 3D-s átállás során a `gameStore.ts`-hez egyáltalán nem kell nyúlnunk.
*   **Tailwind konfiguráció:** 
    A projekt **Tailwind V4**-et használ (`@tailwindcss/postcss` a `package.json`-ben és `@import "tailwindcss"` az `index.css`-ben), így nincs klasszikus `tailwind.config.js/ts` fájl. Jelenleg a projekt nagyrészt dedikált CSS fájlokra (`BlackjackTable.css`, `Card.css`) támaszkodik a BEM elnevezési konvenciókat követve, ahelyett, hogy utility class-okat használna. Nincsenek még 3D perspective vagy rotate segédosztályok definiálva a CSS-ben.
*   **Framer Motion (`CardAnimations.tsx` & Chip animációk):** 
    A jelenlegi animációk tisztán 2D-s `x` és `y` eltolásokat, illetve a kártyaforgatáshoz egyszerű `rotateY`-t használnak. A 2D-s slide-ok 3D-re cserélése **mérsékelten bonyolult lesz**. Ha az asztalt megdöntjük (`rotateX`), a sima `x/y` animációk a dőlt síkon fognak csúszni (ami alapvetően jó), de a "repülés" illúziójához (kártyaosztás levegőben) be kell vezetnünk a `z` (mélység) tengely menti animációkat is, amihez fel kell venni a `translateZ`-t a Framer Motion variant-okba.

---

## 2. "Breaking Changes" Lista (Mit kell mindenképpen módosítani?)

1.  **DOM Kontextus & Perspective:** A fő konténernek meg kell kapnia a `perspective` értéket, az asztalnak (`__felt`) pedig a `rotateX` döntést. Ehhez minden köztes szülő elemnek meg kell kapnia a `transform-style: preserve-3d` szabályt, különben a 3D tér "ellaposodik".
2.  **HUD és UI Elemek Torzulása:** A feliratok, gombok (Deal, Hit, Stand), avatarok és a tét-kijelzők jelenleg az asztal síkjában vannak. Ha az asztalt megdöntjük, ezek is dőlni fognak (torzulnak, olvashatatlanná válnak). Ezeket vagy ki kell emelni egy abszolút pozicionált, 2D-s overlay rétegbe, vagy kapniuk kell egy ellenkező irányú forgatást (counter-rotation: `rotateX(negatív fok)`), hogy a kamera felé nézzenek.
3.  **Kártyák és Zsetonok Vastagsága (Volume):** A megdöntött asztalon a papírvékony 2D kártyák és zsetonok furcsán fognak kinézni, különösen a zsetonoszlopok. Többrétegű div-ekkel vagy okos `box-shadow` / `drop-shadow` trükkökkel vastagságot (3D extrudálást) kell adnunk nekik.
4.  **Animációs Koordináta-rendszer:** A Framer Motion `y` tengelyes animációi (pl. osztó felől a játékos felé) a dőlés miatt vizuálisan megrövidülnek. Újra kell kalibrálni a távolságokat és bevezetni a `z`-tengelyt.

---

## 3. Javasolt Implementációs Sorrend

A legbiztonságosabb és leglátványosabb haladás érdekében a következő iterációkat javaslom:

1.  **Térbeli Alapok (Container & Asztal):** A `BlackjackTable.css` módosítása. `perspective` beállítása a gyökéren, majd az asztal megdöntése (`transform: rotateX(60deg)` körül). A `transform-style: preserve-3d` végigvezetése.
2.  **HUD & UI Korrekció:** A torzult szövegek, a játékos/osztó avatarok és a vezérlőgombok (ActionButtons) "felállítása" (counter-rotation) vagy overlay rétegbe mozgatása, hogy tökéletesen használhatóak maradjanak.
3.  **Kártyák & Zsetonok 3D-sítése:** A zsetonoszlopok átalakítása, hogy valódi 3D hengereknek vagy vastag korongoknak tűnjenek a térben. A kártyáknak minimális vastagság és térbeli árnyék (`translateZ`) adása.
4.  **Animációk Újrahangolása:** A `CardAnimations.tsx` és `ChipAnimations.tsx` frissítése. A kártyák osztásánál a `z` érték animálása (repülési ív), hogy a kártyák "ráessenek" az asztalra, ne csak rácsússzanak.
