# learnings.md — permanens projekt-állapot

> Harness- és modellfüggetlen memória. Session-elején ELŐSZÖR ezt olvassa
> (főleg az `AKTUÁLIS ÁLLAPOT` blokkot); session-végén / váltás előtt frissítsd.
> Az AGENTS.md / CLAUDE.md írja le a pontos kötelező lépéseket.

---

## AKTUÁLIS ÁLLAPOT
<!-- Ezt a blokkot minden váltás előtt FELÜLÍRJÁK (nem append). Ez a folytatási pointer. -->

- **Aktív feladat:** Prompt 5 független verifikációs audit (Verification Gate) elkészült
- **Hol tartok most:** `docs/audit/PROMPT5_VERIFY_glm-5-2_2026-07-24.md` — a Prompt 0–3 auditok ~104 állítása verifikálva a kód ellen
- **Következő lépés:** Döntés az emberé: elinduljon-e a P0/P1 javítási sor (Zustand selectorok 4.1, canDouble/canSplit 5.9, setTimeout cleanup 4.2, volume szinkron 5.8). A verifikáció megerősítette, hogy ezek a finding-ek valósak és javíthatók.
- **Nyitott kérdések / fenntartások:** A PROMPT 1 3.1 és PROMPT 2 7.2 téves — ezekre NE hagyatkozz. A "validátor vs domain szigorúság" kérdésben a PROMPT 3 5.4 az elsődleges forrás (a domain `canPlayerDouble/Split` a szigorúbb, `validateSplit` NEM nézi az isDoubled-ot).
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
