# Code Health Toolkit v4.0 (Monorepo Edition)

v3.2 Python toolkit + React/Vite frontend support = egy gate, két világ.

## Várt projekt struktúra

```
repo-gyökér/          ← toolkit fájlok ide kerülnek
├── backend/          ← Python kód (saját venv-vel)
└── frontend/         ← React/Vite projekt
```

## Tartalom

| Forrás | Funkció |
|--------|---------|
| **v3.2 (változatlan)** | Ruff, Mypy, Bandit, import-linter, radon/xenon, wily, vulture, mutmut |
| **v4.0 – új** | ESLint, Prettier, TypeScript, Vitest a frontendhez |
| **v4.0 – új** | `--backend` / `--frontend` flagek a quality_gate.sh-ban |
| **v4.0 – új** | `make check-be` / `make check-fe` szeparált targetekkel |

## Setup

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements-dev.txt
cd ..
pre-commit install
detect-secrets scan > .secrets.baseline
```

### Frontend
```bash
# 1. Másold a frontend-configs/ tartalmát a frontend/ mappába:
cp frontend-configs/eslint.config.js frontend/
cp frontend-configs/.prettierrc frontend/
cp frontend-configs/tsconfig.json frontend/   # ha még nincs

# 2. Telepítés:
make install-fe

# 3. vite.config.ts-be add hozzá a test blokkot (README-ben lent)
```

**`frontend/vite.config.ts`** – test blokk:
```ts
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/test-setup.ts'],
  coverage: {
    provider: 'v8',
    thresholds: { lines: 85, functions: 85, branches: 80 },
  },
}
```

**`frontend/src/test-setup.ts`** – új fájl:
```ts
import '@testing-library/jest-dom'
```

## Napi workflow

```bash
make check          # gyors fix, mindkét oldal
make check-be       # csak backend
make check-fe       # csak frontend

make quality        # teljes gate, mindkét oldal
make quality-be     # csak backend
make quality-fe     # csak frontend

make ci             # strict CI, mindkét oldal
```

## Parancsok

| Parancs | Mit csinál |
|---------|-----------|
| `make install` | Mindkét oldal telepítése |
| `make check` / `check-be` / `check-fe` | Gyors lint+format |
| `make quality` / `quality-be` / `quality-fe` | Teljes gate |
| `make ci` / `ci-be` / `ci-fe` | CI mód |
| `make strict` | Strict mód (be), CI mód (fe) |
| `make test` / `test-be` / `test-fe` | Tesztek |
| `make coverage` / `coverage-be` / `coverage-fe` | Coverage |
| `make typecheck` | TypeScript tsc --noEmit |
| `make trend` | Wily trendek (backend only) |
| `make health` | Full health report (backend only) |
| `make mutation` | Mutation testing (backend only) |

## quality_gate.sh flagek

```bash
./quality_gate.sh --full              # mindkét oldal (default)
./quality_gate.sh --backend --full    # csak Python
./quality_gate.sh --frontend --full   # csak React
./quality_gate.sh --backend --ci
./quality_gate.sh --frontend --ci
./quality_gate.sh --backend --strict
./quality_gate.sh --trend             # backend only
./quality_gate.sh --health            # backend only
```

## Strictness szintek

### Frontend (új)

| Check | Local | CI |
|-------|-------|----|
| ESLint | FAIL | FAIL |
| Prettier | warn | FAIL |
| TypeScript | warn | FAIL |
| Vitest | FAIL | FAIL + coverage |

### Backend – változatlan v3.2-ről (lásd eredeti README)

## Pre-commit: mi mikor fut?

| Trigger | Backend hookjai | Frontend hookjai |
|---------|----------------|-----------------|
| `.py` fájl módosítva | ruff, mypy, complexity, pytest | – |
| `.ts/.tsx` módosítva | – | eslint, prettier, tsc, vitest |

## frontend-configs/ mappa

Másold a `frontend/` projekt gyökerébe:

| Fájl | Cél |
|------|-----|
| `eslint.config.js` | ESLint + TypeScript + React szabályok |
| `.prettierrc` | Formázási beállítások |
| `tsconfig.json` | TypeScript strict konfig |

## v4.0 Changelog

- **NEW**: Frontend quality gate (ESLint, Prettier, TypeScript, Vitest)
- **NEW**: `--backend` / `--frontend` flagek quality_gate.sh-ban
- **NEW**: `make *-be` / `make *-fe` targetpárok minden főparancshoz
- **NEW**: `frontend-configs/` mappa
- **CHANGE**: `.pre-commit-config.yaml` – `files:` filterek szeparálják a két oldalt
- **KEEP**: Minden v3.2 Python funkció változatlan

---
*„A jó kód nem véletlen."*
