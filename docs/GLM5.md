# Audit Jelentés: Harold's Blackjack Casino 3D Upgrade

**Dátum:** 2026-02-27  
**Készítette:** GLM-5 (Senior Frontend Architect)

---

## 1. Jelenlegi Architektúra

### Komponens Struktúra (2D felülnézet)

| Fájl | Funkció | Layout |
|------|---------|--------|
| `BlackjackTable.tsx` | Main container | Flexbox vertikális (dealer ↑ player ↓) |
| `DealerArea.tsx` | Dealer oldal | Avatar + Hand + érték, centrált |
| `PlayerArea.tsx` | Játékos oldal | Avatar + hands + action buttons |
| `Hand.tsx` | Kártyák | `position: absolute`, `left: index * offset` |
| `Card.tsx` | Egy kártya | 56x78px, statikus |
| `CardAnimations.tsx` | Deal animáció | `x/y/rotate/scale` 2D transzformáció |

### State Management

- Zustand store **tiszta játéklogikát** tartalmaz
- **Nincs UI pozicionálás** a store-ban ✓
- Phase-based: `betting → playing → finished`
- Jól el van választva, nem igényel módosítást

### Tailwind

- Tailwind 4.1.18 telepítve, de **nincs config fájl**
- Tailwind 4 postcss plugin módban működik (config-less)
- **Nincsenek egyedi perspective/rotate segédosztályok**

### Framer Motion

- **Már használatban van** ✓
- Jelenlegi animációk: 2D `x, y, rotate, scale`
- `rotateY` csak a flip animációban van (`cardFlipVariants`)
- Hiányzik: `translateZ`, `rotateX`, `perspective`

---

## 2. Breaking Changes a 3D nézethez

| Prioritás | Fájl | Változtatás | Indok |
|-----------|------|-------------|-------|
| **Kritikus** | `BlackjackTable.css` | `perspective` + `transform-style: preserve-3d` + `rotateX` | Ez az alapja mindennek |
| **Kritikus** | `DealerArea.tsx/css` | `translateZ(-100px)` + `scale(0.8)` | Dealer távolabb legyen |
| **Kritikus** | `PlayerArea.tsx/css` | `translateZ(50px)` | Játékos közelebb |
| **Fontos** | `Card.css` | `rotateX` kompenzáció + mélyebb árnyék | Kártyák ne tűnjenek laposnak |
| **Fontos** | `Hand.css` | `transform-style: preserve-3d` a wrapper-en | Kártyák 3D elhelyezése |
| **Közepes** | `CardAnimations.tsx` | 3D trajektória (`translateZ` progresszió) | Deal animáció shoe → cél |
| **Közepes** | UI elemek (Balance, Buttons) | `translateZ` vagy `position: fixed` | Ne dőljön el az asztallal |
| **Alacsony** | `ChipStack` | 3D elhelyezés | Zsetonok "álljanak" |

---

## 3. Implementációs Sorrend

```
1. FOUNDATION    ──→  BlackjackTable: perspective + rotateX(25°)
                     (ezzel azonnal látható a 3D hatás)

2. Z-POSITIONING ──→  DealerArea: translateZ(-120px) + scale(0.75)
                     PlayerArea: translateZ(40px)

3. CARD CORRECTION──→ Card: rotateX(-25°) kompenzáció
                     (hogy a kártyák merőlegesek legyenek a nézetre)
                     
4. HAND UPDATE   ──→  Hand: 3D card stacking
                     (kártyák minimális translateZ offset egymás után)

5. ANIMATIONS    ──→  CardAnimations: 3D trajectory
                     (shoe position: translateZ + translateX, majd cél)

6. UI OVERLAYS   ──→  Balance, SoundSettings, Deal button
                     (translateZ vagy fixed, hogy ne dőljenek)

7. POLISH        ──→  Shadows, gradients, chip 3D
```

---

## 4. Kockázatok

- **UI elemek**: A header (Balance, SoundSettings) és a Deal gomb is az asztalon belül van → ezek "elfekszenek" a rotateX-szel
- **Split hands**: Ha 2+ hand van, azok elhelyezése X-tengelyen bonyolultabb lesz
- **Click targets**: A 3D transzformációk ne befolyásolják a kattintható területeket

---

## 5. Függőségek

- `framer-motion: ^12.29.0` - már telepítve, támogatja a 3D transzformációkat
- `tailwindcss: ^4.1.18` - config-less mód, inline style-okat kell használni
- `react: ^19.2.0` + `zustand: ^5.0.10` - nem igényel változtatást

---

## 6. Összegzés

A projekt jelenlegi állapota **kedvező a 3D upgrade-hez**:

- A state management tiszta, nem keveredik UI logikával
- Framer Motion már telepítve van
- A komponens struktúra moduláris

A fő kihívás a CSS transzformációk helyes alkalmazása és az UI overlay elemek kezelése lesz.