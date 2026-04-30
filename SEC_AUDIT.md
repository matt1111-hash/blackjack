# Security Audit Report
Date: 2026-04-15
Scope: `/workspace/blackjack` frontend repository (Vite + React + TypeScript)
Method: Manual SAST review + pattern scan + dependency metadata review.

## Executive Summary
- **Critical:** 0
- **High:** 0
- **Medium:** 1
- **Low:** 1
- **Informational / Not applicable:** multiple

The project is primarily a client-side game with no backend/API layer in this repository. Most classical server-side injection and auth issues are therefore not present in scope.

---

## 1) Input Validation and Injection

### Finding 1.1 — Local storage controlled shoe can be abused for client-side game integrity manipulation
- **Severity:** MEDIUM
- **CWE:** CWE-345 (Insufficient Verification of Data Authenticity), CWE-20 (Improper Input Validation)
- **Where:** `src/store/gameHelpers.ts` lines 74-86, 92-93
- **Details:** The deck/shoe can be loaded from `localStorage` (`blackjack:e2e-shoe`) and used as runtime game input. Validation exists for card schema (`isValidCard`), but there is no environment gate ensuring this only works for test mode; any user can set this key and influence outcomes client-side.
- **Impact:** Cheating / business-logic manipulation in production browser session.
- **Fix recommendation:**
  1. Gate `getConfiguredShoe()` behind a test-only condition (e.g., `if (import.meta.env.MODE !== 'test') return null;`).
  2. Use deterministic test-only injection via test harness instead of production code path.
  3. Consider removing `localStorage` shoe override from production bundle entirely.

### Injection vectors checked with no direct vulnerable sink found
- **SQL injection:** No SQL/query execution paths found in `src/`.
- **Command injection:** No `eval`, `exec`, `new Function`, Node `child_process`, or `shell=True` equivalent in app code. `scripts/launch_desktop.sh` runs fixed commands with quoted vars.
- **Path traversal:** No user-controlled filesystem path handling in runtime app code.
- **Template injection:** No `dangerouslySetInnerHTML`; React JSX rendering path used.

---

## 2) Authentication and Authorization

### Finding 2.1 — No authentication/authorization layer (scope note)
- **Severity:** LOW
- **CWE:** CWE-306 (Missing Authentication for Critical Function) — *context dependent*
- **Where:** `src/App.tsx` lines 3-5; `src/components/Table/BlackjackTable.tsx` lines 13-31
- **Details:** Application is a local single-player frontend game and exposes gameplay actions without auth boundaries.
- **Impact:** In current scope, likely acceptable. If this code is reused in a networked/multi-user environment, missing authz/authn becomes a security gap (IDOR/privilege checks absent by design).
- **Fix recommendation:**
  - If future backend/API is introduced, enforce session-based or token-based auth and per-resource authorization checks server-side.

### Hardcoded credentials review
- **Result:** No hardcoded API keys, passwords, or tokens found in reviewed source files.

---

## 3) Data Handling

### Sensitive logging / PII
- **Result:** No obvious logging of credentials/tokens/PII in reviewed app source.

### Plaintext sensitive data storage/transit
- **Result:** `localStorage` usage is present for test shoe injection only (`src/store/gameHelpers.ts` line 74), but no sensitive secret material found.
- **Recommendation:** Keep secrets out of client storage; if future auth tokens are added, prefer `HttpOnly` secure cookies.

### Insecure deserialization
- **Result:** `JSON.parse` on local storage data is followed by type/shape checks (`isValidCard`), lowering deserialization risk.

---

## 4) Dependency Security

### Finding 4.1 — React version should be bumped as hardening baseline
- **Severity:** LOW
- **CWE:** CWE-1104 (Use of Unmaintained/Outdated Third Party Components)
- **Where:** `package.json` lines 20-21
- **Details:** Project pins `react`/`react-dom` at `^19.2.0`. A December 3, 2025 React security advisory (CVE-2025-55182) affects RSC-related packages in the 19.2.0 line. This repository appears to be client-only and not using RSC packages, so **direct exploitability appears unlikely**.
- **Fix recommendation:**
  1. Upgrade to patched React line (`>=19.2.1`) for defense in depth.
  2. Add automated dependency scanning in CI (`npm audit`/SCA tool) and fail on high/critical vulns.

### Dependency scanning limitation
- `npm audit` could not run successfully in this environment due registry `403 Forbidden`, so online advisory correlation was used.

### Dev dependencies in production bundle
- Build scripts separate dependencies/devDependencies correctly in `package.json`.

### Typosquatting review
- No suspicious package names observed in direct dependency list.

---

## 5) Configuration and Infrastructure

### Debug mode in production
- **Result:** No explicit production debug toggle found in Vite config.

### CORS misconfiguration
- **Result:** No backend server/CORS policy code present in this repository (frontend-only scope).

### Exposed admin endpoints
- **Result:** No API/admin endpoints in repository scope.

---

## Prioritized Remediation Plan
1. **(M1)** Restrict or remove localStorage-driven shoe override from production runtime.
2. **(L1)** Upgrade React/React-DOM to patched baseline (`>=19.2.1`) and add CI SCA step.
3. **(Hygiene)** Add a short `SECURITY.md` with threat model boundaries (frontend-only trust assumptions).


