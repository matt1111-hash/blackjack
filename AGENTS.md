# AI CODING RULES — Terminal CLI Edition
**Version: 2.4 (2025-12-23)**
**Toolchain: Modern (Ruff + Pytest + Mypy)**

---

## 🔴 HIERARCHIA — LEGFONTOSABB!

| Szerep | Felelősség |
|--------|------------|
| EMBER | Megrendelő, döntéshozó |
| AGENT | Végrehajtó, kódoló, debuggoló |

**AGENT KÖTELESSÉGEI:**
- Az EMBER NEM DEBUGOL — az agent dolga
- Az EMBER NEM BÖNGÉSZIK — kódelemzés az agent feladata
- Az EMBER NEM CSELÉD — ne kérj tőle futtatást amit te is tudsz

---

## 🚨 CRITICAL RULES

### ❌ TILOS:
- Guessing — kérdezz, max 2 kérdés
- Incomplete code — befejezni vagy INCOMPLETE.md
- Placeholder comments — `# TODO`, `// FIXME`, `pass`
- Code snippets — mindig teljes, futtatható fájl
- Truncation — SOHA `...` vagy "rest unchanged"
- God classes — >300 sor tilos
- Unsafe code — `eval/exec/os.system` BANNED
- Modifying tests — tesztek definiálják a spec-et!
- Config manipulation — `.quality_gate.conf` TILOS módosítani!

### ✅ KÖTELEZŐ:
- Complete files — első sortól az utolsóig
- Type hints — minden függvény, minden paraméter
- Tesztek — MANDATORY, nincs kivétel
- Clean Architecture — domain/application/infrastructure/presentation
- Git status check — minden új mappa után

---

## 📊 QUALITY GATE (B OPCIÓ)

### Küszöbök:
| Metrika | Local | CI |
|---------|-------|-----|
| Coverage | ≥85% | ≥95% |
| Max LOC/file | 300 | 250 |
| Ruff errors | 0 | 0 |
| Mypy | Warning | Strict |

### Futtatás:
```bash
./quality_gate.sh          # Local (B opció)
./quality_gate.sh --ci     # CI mód (szigorú)
```

### PASS után jelenthetsz KÉSZ-t!

---

## 🛠️ MODERN TOOLCHAIN

### Ruff (linting + formatting)
```bash
# Lint check
python -m ruff check src/

# Auto-fix
python -m ruff check --fix src/

# Format
python -m ruff format src/
```

### Pytest + Coverage
```bash
# Tesztek futtatása
python -m pytest tests/ -v --cov=src --cov-report=term-missing

# Coverage HTML report
python -m pytest tests/ --cov=src --cov-report=html
```

### Mypy
```bash
python -m mypy src/ --ignore-missing-imports
```

---

## 🏗️ CLEAN ARCHITECTURE

```
src/
├── domain/          # Entities, repository interfaces (no I/O!)
├── application/     # Use cases, services
├── infrastructure/  # SQLite, APIs, external services
└── presentation/    # CLI, GUI (PySide6)

tests/
└── test_*.py        # Tesztek - tükrözik a src/ struktúrát
```

### Szabályok:
- Dependencies point INWARD only
- Domain SOHA nem importál infrastructure-t
- Egy fájl = egy felelősség
- Max 300 sor / fájl

---

## 🔧 CODE QUALITY

### Kötelező elemek:
- Full type hints (params + returns)
- Docstrings (brief, 1-2 sor)
- Alphabetical imports (stdlib → third-party → internal)

### Metrikák:
| Metrika | Target |
|---------|--------|
| Lines/function | ≤50 |
| Lines/class | ≤200 |
| Lines/file | ≤300 |
| Cyclomatic complexity | <8 |
| Nesting depth | ≤3 |

---

## 🧪 TESTING RULES

- **TESTS ARE MANDATORY** — nincs kivétel!
- Coverage target: ≥85% (local), ≥95% (CI)
- One test = one behavior
- Arrange-Act-Assert pattern
- Test file mirrors source: `src/foo.py` → `tests/test_foo.py`
- **NO test modification** — tesztek definiálják a spec-et!

---

## 🔒 SECURITY

### SQL Safety:
```python
# ✅ CORRECT - parameterized
cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))

# ❌ FORBIDDEN - SQL injection
cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
```

### Secrets:
- ✅ Environment variables
- ❌ NEVER hardcode API keys, passwords

---

## 📋 WORKFLOW

### Session Start:
```bash
pwd
git status
ls -la
cat AGENTS.md
```

### Every Layer Complete:
```bash
./quality_gate.sh
# CSAK PASS után mész tovább!
```

### Before "KÉSZ":
```bash
git status
# Ha nincs commit → NEM KÉSZ!
```

---

## ⚠️ CONFIG MANIPULATION = CHEATING

A következő fájlok **CSAK OLVASHATÓK**:
- `.quality_gate.conf`
- `quality_gate.sh`
- `pyproject.toml`

Ha a modell módosítja ezeket a coverage/lint elkerülésére = **AZONNALI FAIL**.

---

## 🎯 TL;DR

1. 🔥 CHECK git status — minden új mappa után
2. 📝 Write complete files — nincs truncation
3. 🎯 Clean Architecture — modular, nem microservices
4. ✅ Pass quality gate — ≥85% coverage, Ruff clean
5. 🧪 Write tests — MANDATORY
6. 📐 Respect limits — ≤300 lines/file
7. 🚫 NO config manipulation — csalás!
8. 🔍 DEBUG IN CODE — soha ne delegálj embernek

**Remember: Code is written once, read many times. Git tracks everything - or it doesn't exist.** 🚀
### 🔍 PROJEKT INTEGRITÁS — AGENT FELELŐSSÉGE:
- Az agent MINDIG végigkövet minden hívási láncot: 
  frontend → endpoint → DI → factory → inicializálás
- Tünet alapú debuggolás TILOS — a gyökér okot kell megtalálni
- Az agent MAGA fedezi fel az architektúra inkonzisztenciákat 
  (párhuzamos singleton-ok, dupla factory, stb.)
- Ha hibát keres: először a teljes dependency graph-ot térképezi fel, 
  AZTÁN javasol megoldást
- Az EMBER SOHA nem mutat rá a hibára — ez az agent dolga

## Jules PR Review
Lásd: [JULES_REVIEW.md](./JULES_REVIEW.md)
