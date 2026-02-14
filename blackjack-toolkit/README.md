# Code Health Toolkit v1.0 (TypeScript/React Edition)

Python Code Health Toolkit v3.0 alapján, TypeScript/React-re adaptálva.

## Tool Mapping

| Python | TypeScript |
|--------|------------|
| Ruff lint | ESLint |
| Ruff format | Prettier (ESLint-en keresztül) |
| Mypy | TypeScript (tsc) |
| Pytest | Vitest |
| Coverage.py | @vitest/coverage-v8 |
| Vulture | knip (optional) |
| Bandit | npm audit |

## Setup

```bash
# Másold a fájlokat a projektbe:
cp quality_gate.sh /path/to/project/
cp .quality_gate.conf /path/to/project/
cp Makefile /path/to/project/
cp AGENTS_TS.md /path/to/project/
cp vitest.config.ts /path/to/project/

# Hozd létre a test setup fájlt:
mkdir -p src/test
cp src-test-setup.ts /path/to/project/src/test/setup.ts

# Telepítsd a coverage provider-t:
npm install -D @vitest/coverage-v8

# Tedd futtathatóvá:
chmod +x quality_gate.sh
```

## Napi Workflow

```bash
# Munka közben - gyors fix
make check

# Commit előtt - teljes gate
make quality

# CI-ban
make ci
```

## Parancsok

| Parancs | Leírás |
|---------|--------|
| `make check` | Gyors lint fix |
| `make quality` | Teljes quality gate |
| `make ci` | CI mód (strict) |
| `make test` | Tesztek (watch) |
| `make test-run` | Tesztek (single run) |
| `make coverage` | Coverage report |
| `make health` | Full health report |
| `make dev` | Dev server |
| `make build` | Production build |

## Quality Gate Script

```bash
./quality_gate.sh --quick    # Gyors lint fix
./quality_gate.sh --full     # Teljes (default)
./quality_gate.sh --ci       # CI mód (strict)
./quality_gate.sh --health   # Full report
```

## Thresholds

| Metrika | Local | CI |
|---------|-------|-----|
| Coverage | 85% | 90% |
| Max file lines | 300 | 250 |
| ESLint errors | 0 | 0 |
| TypeScript errors | 0 | 0 |

Testreszabás: `.quality_gate.conf`

## Architecture Rules

```
✅ components/ → hooks/ → store/ → logic/ → types/
❌ logic/ → store/ (TILOS)
❌ logic/ → components/ (TILOS)
```

A `logic/` mappa tisztán TypeScript, React-mentes — könnyen tesztelhető.

## Fájlok

```
.
├── quality_gate.sh         # Fő script
├── Makefile                # Parancsok
├── .quality_gate.conf      # Thresholds
├── vitest.config.ts        # Vitest + coverage config
├── AGENTS_TS.md            # Agent szabályok
└── src/test/setup.ts       # Vitest setup
```

---

*"Type safety prevents bugs. Tests prove correctness."*
