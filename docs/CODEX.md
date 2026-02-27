# Harold's Blackjack Casino - 3D Perspektíva Audit (Codex)

## Rövid architektúra-audit

- Az asztal layout jelenleg 2D, flex + abszolút pozicionálás alapú.
  - Fő konténer és felt: `src/components/Table/BlackjackTable.tsx`, `src/components/Table/BlackjackTable.css`
  - Dealer / center line / player vertikális szeletelés: ugyanitt
  - Deal/New Round gombok és shoe overlay abszolút rétegen vannak

- A kártya és kéz megjelenítés:
  - `Hand` komponens abszolút wrapperrel és `left` offsettel rakja ki a lapokat (`spread`)
  - `CardFlip` már használ 3D flip technikát (`perspective`, `preserve-3d`, `rotateY`)

- State management (`src/store/gameStore.ts`):
  - Játéklogika és UI pozicionálás jelenleg jól elkülönül
  - A store nem tartalmaz vizuális koordinátákat/layout state-et
  - UI-hoz kötöttebb adatok: `phase`, `activeHandIndex`, `roundResults`

- Tailwind helyzet:
  - Tailwind telepítve van és `@import "tailwindcss"` szerepel
  - Nincs `tailwind.config.js/ts` fájl
  - A Table/Card réteg most komponens-CSS-t használ, nem utility-first megközelítést
  - Egyedi `perspective/rotateX` utility rendszer jelenleg nincs

- Framer Motion:
  - Aktív animációk főleg 2D translate/scale alapúak
  - `CardFlip` 3D flip működik
  - `CardAnimations.tsx` jelenleg nem látszik használatban, ezért potenciális holt ág

## Breaking changes lista (kötelező módosítások 3D nézethez)

1. Új 3D scene-hierarchia bevezetése (`perspective` parent + `transform-style: preserve-3d` lánc).
2. A teljes table/felt döntése `rotateX`-szel, és a HUD/overlay réteg leválasztása.
3. A `Hand` jelenlegi 2D `left` offsetes elrendezésének 3D-kompatibilis átalakítása.
4. Framer Motion animációk refaktorja (2D `x/y` slide -> 3D térben stabil mozgás).
5. Z-index/stacking context újratervezése a transformált rétegek miatt.
6. Mobil/reszponzív perspektíva- és dőlésszög-korrekció bevezetése.

## Javasolt implementációs sorrend

1. Scene container: külső perspektíva + belső 3D root.
2. Table tilt: `felt` döntése (`rotateX`) és alap mélységhatás.
3. Overlay split: gombok/szövegek leválasztása nem-döntött HUD rétegre.
4. Hand/Card positioning: kéz- és kártyaelhelyezés 3D-kompatibilis korrekciója.
5. Motion migration: dealing/hit/stand animációk átállítása 3D mozgásra.
6. Visual polish: árnyék, mélység, mobil breakpoint finomhangolás.
