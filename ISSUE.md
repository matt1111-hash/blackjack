# Production Mandate Report - blackjack

Date: 2026-05-15
Project: `blackjack`
Stack: Vite + React + TypeScript + Zustand
Scope: local single-player frontend game

## Summary

The project passes the customized local quality toolkit and the Playwright E2E smoke suite. It is not fully Production Mandate compliant yet because dependency security audit reports high-severity vulnerabilities, and CI/CD maturity is partial because no Dependabot configuration is present.

## Commands Run

### Quality toolkit

Command:

```bash
./quality_gate.sh
```

Result:

```text
Quality gate passed (local mode)
```

Key evidence:

- Lint: passed
- Typecheck: passed
- Vitest: 7 test files passed
- Unit/component tests: 137 passed
- Coverage lines: 92.42% (minimum: 80%)
- Coverage functions: 92.4% (minimum: 80%)
- Build: passed

Reliability: yes. The command ran the project-specific local gate: lint, TypeScript, tests, coverage threshold check, and production build.

### E2E smoke

Command:

```bash
npm run test:e2e
```

First result:

```text
2 failed
Error: browserType.launch: Executable doesn't exist at /home/tibor/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell
```

Remediation command:

```bash
npx playwright install chromium
```

Retry command:

```bash
npm run test:e2e
```

Final result:

```text
2 passed (2.5s)
```

Reliability: yes after installing the required Playwright Chromium binary. The initial failure was an environment/browser-installation issue, not an application assertion failure.

### Dependency security audit

Command:

```bash
npm audit --audit-level=high
```

Result:

```text
8 vulnerabilities (3 moderate, 5 high)
```

High-severity packages reported:

- `flatted`
- `minimatch`
- `picomatch`
- `rollup`
- `vite`

Reliability: yes. The command completed against the npm advisory service after network access was allowed.

### Secret pattern check

Command:

```bash
rg -n "(api[_-]?key|secret|password|token|BEGIN PRIVATE KEY|AKIA[0-9A-Z]{16})" src public scripts e2e package.json vite.config.ts vitest.config.ts playwright.config.ts
```

Result:

```text
no matches
```

Reliability: yes for the application source scope checked. This is a pattern scan, not a full secret scanner baseline.

## Production Mandate Status

| Criterion | Status | Evidence |
|---|---:|---|
| 1. Main user flows work | PASS | Vitest and Playwright cover critical blackjack flows. |
| 2. No known blocker or critical bug | PARTIAL | App gate is green, but high dependency vulnerabilities remain. |
| 3. Graceful degradation | PASS / N/A | No backend/API dependency; client-side validation and error state exist. |
| 4. Idempotency/concurrency reviewed | PASS / N/A | Single-player client app, no shared backend write boundary. |
| 5. Critical business logic unit-tested | PASS | `src/logic` and `src/store` tests passed. |
| 6. Integration tests at boundaries | PASS / N/A | No DB/API; component/store boundary tests exist. |
| 7. E2E smoke on critical flows | PASS | Playwright: 2 passed. |
| 13. CI/CD and reproducible build | PARTIAL | `.github/workflows/ci.yml` and `package-lock.json` exist; Dependabot config not found. |
| 17. Config separated from code, secrets via env | PASS | No source-scope secret pattern matches found. |
| 20. No repo secrets and dependency audit clean | FAIL | Secret pattern check clean, but `npm audit` found 5 high and 3 moderate vulnerabilities. |
| 22. README local run steps | PASS | `README.md` documents install/dev/check/build basics. |
| 26. Dependency rule / architecture | PASS | App separates logic, store, and components for this frontend-only stack. |

## Worktree

Current relevant status before this report file:

```text
 M .quality_gate.conf
 M quality_gate.sh
?? Makefile
```

Those changes are the customized toolkit integration. This report adds `ISSUE.md`.

## Blocking Items

1. Run and review `npm audit fix`, then rerun:

```bash
npm audit --audit-level=high
./quality_gate.sh
npm run test:e2e
```

2. Add Dependabot configuration for npm dependencies to close the CI/CD maturity gap.

## Decision

Quality toolkit: PASS.
E2E smoke: PASS.
Production Mandate: FAIL until high-severity npm audit findings are resolved.
