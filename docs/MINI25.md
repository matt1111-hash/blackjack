# Harold's Blackjack Casino - 3D Visual Upgrade Audit

## Jelenlegi architektúra

### Komponens struktúra
```
BlackjackTable (2D flex column)
├── DealerArea → Hand → Card / CardFlip
├── PlayerArea → Hand → Card / CardFlip  
└── CardAnimations (Framer Motion x/y/rotate/scale)
```

### Stack
- **Styling**: Tiszta CSS + CSS Modules (NEM Tailwind)
- **Layout**: 2D Flexbox (dealer felül, player lent)
- **3D meglévő**: `rotateY` + `perspective` már létezik `CardFlip`-ben
- **State**: Tiszta - játéklogika ELKÜLÖNÜL a UI pozícionálástól ✓

### Pozícionálás jelenleg
- Minden `left: index * offset` alapú - nincs 3D koordináta
- Flexbox column layout - nincs transform context

---

## Breaking Changes lista

| # | Fájl | Módosítás |
|---|------|-----------|
| 1 | `src/components/Table/BlackjackTable.css` | Container `perspective`, felt `rotateX(25deg)` |
| 2 | `src/components/Table/BlackjackTable.tsx` | Z-index rétegek dealer/player/CenterOverlay |
| 3 | `src/components/Card/Hand.tsx` | `translateZ` + `rotateX` offset számítás |
| 4 | `src/components/Card/CardAnimations.tsx` | `translateZ`, `rotateX` variánsok |
| 5 | `src/components/Card/Card.tsx` | `backface-visibility` tuning 3D-ben |
| 6 | `src/components/Table/DealerArea.css` / `PlayerArea.css` | 3D transform kontextus |

---

## Implementáció sorrend

```
1. BlackjackTable.css      → perspective + rotateX container
2. DealerArea/PlayerArea   → Z-depth beállítás
3. Hand.tsx               → translateZ offset + rotateX
4. CardAnimations.tsx     → x/y → x/y/z + rotateX/Y
5. Card.tsx               → 3D backface finomhangolás
6. Quality gate check     → ./quality_gate.sh
```

---

## Megjegyzések

- A `gameStore.ts` (Zustand) NEM igényel módosítást - UI logika tiszta
- `CardFlip` mintaként szolgál a meglévő 3D transform kódra
- Framer Motion már támogatja a 3D transform tulajdonságokat
- Max 1-2 nap implementáció várható