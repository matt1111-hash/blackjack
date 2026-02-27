# WORKFLOW.md – AI Munkamegosztás
**Verzió:** 1.0 | **Frissítve:** 2026-02-24

---

## Szerepek

### 👤 Harold (Ember – döntéshozó)
- Prioritások meghatározása
- Architektúrális döntések jóváhagyása
- Sprint indítás és lezárás
- Promptok megírása Claude Code-nak és Jules-nak

### 🖥️ Claude Code / Opus 4.5 (Lokális ügynök)
**Felelősség: Működőképesség és Clean Architecture**

| Feladat | Részletek |
|---------|-----------|
| Merge conflict feloldás | Mindig a `refactor` ág verzióját tartja meg |
| Clean Architecture violations | Import-linter hibák javítása |
| Ruff lint hibák | Zero lint error elérése |
| Quality gate | `./quality_gate.sh --no-coverage` zöld |
| Entry point javítás | `src/__main__.py` és `pyproject.toml` konzisztencia |
| God file bontás | Max 300 sor/fájl, SRP betartása |
| Commit és push | Minden lépés után a `refactor` ágra |

**NEM feladata:**
- ❌ Tesztek írása
- ❌ conftest.py létrehozása
- ❌ CI/CD pipeline
- ❌ 85%+ coverage elérése

---

### 🤖 Jules (Aszinkron ügynök – GitHub)
**Felelősség: Tesztelhetőség és CI/CD**

| Feladat | Részletek |
|---------|-----------|
| conftest.py | Shared fixture-ök, mock-ok |
| Unit tesztek | Minden modulhoz minimum 1 teszt fájl |
| Coverage | ≥85% (lokális), ≥90% (CI) |
| CI/CD pipeline | `.github/workflows/quality.yml` |
| Docstring hibák | D102, D103 javítása |
| Integration tesztek | External API mock-ok |

**Aktiválás feltétele:**
- ✅ Claude Code befejezte a lokális munkát
- ✅ `./quality_gate.sh --no-coverage` zöld
- ✅ Commit pusholva a `refactor` ágra

---

### 🧠 Web Claude (Mentor/Advisor)
- Refaktorálási stratégia
- Prompt javaslatok Claude Code-nak és Jules-nak
- Audit dokumentumok értelmezése
- Architektúrális döntések magyarázata

---

## Quality Gate szabályok

```
Lokális (Claude Code):   ./quality_gate.sh --no-coverage
CI (Jules):              ./quality_gate.sh --ci
```

| Metrika | Lokális | CI |
|---------|---------|-----|
| Ruff lint | 0 hiba | 0 hiba |
| Import-linter | PASS | PASS |
| Max fájl méret | 300 sor | 250 sor |
| Coverage | ❌ nem ellenőrzött | ≥90% |

---

## Git stratégia

```
main          ← stabil, csak merge után
refactor      ← aktív fejlesztési ág
  └── minden commit ide megy
```

- Commit üzenet formátum: `fix:`, `refactor:`, `feat:`, `test:`
- Push: minden lépés után, nem csak a végén

---

## Promptolási szabályok

- Claude Code és Jules promptok **magyarul** írandók
- Magas szintű utasítás – az ügynök dönti el az implementációt
- Nem prescriptív – nem kell minden sort megmondani
- Jules csak akkor aktiválandó, ha Claude Code munkája kész

---

## Projekt státusz táblázat

| Projekt | Claude Code | Jules | Quality Gate |
|---------|-------------|-------|--------------|
| wiseprofi-rtx3050-benchmark | ✅ Kész | ⏳ Vár | ✅ Zöld |
| wiseprofi | 🔄 Folyamatban | ⏳ Vár | ❌ |
| energia_monitoring | ⏳ | ⏳ | ❌ |
| health_explorer | ⏳ | ⏳ | ❌ |
| budget | ⏳ | ⏳ | ❌ |
| weather_energy_analyzer | ⏳ | ⏳ | ❌ |
| meteo-analytics | ⏳ | ⏳ | ❌ |
| weather_widget | ⏳ | ⏳ | ❌ |
| home_energy | ⏳ | ⏳ | ❌ |
| blackjack | ⏳ | ⏳ | ❌ |

---

*Ez a fájl a `_toolchain` masterből van deploy-olva. Módosítani csak ott kell, majd `./deploy_toolkit.sh`.*
