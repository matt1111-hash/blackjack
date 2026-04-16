# Security Policy

## Threat Model

This project is a **client-side single-player blackjack game** (Vite + React + TypeScript). There is no backend, no API layer, no user authentication, and no server-side state.

### Trust Boundaries

| Boundary | Trust Level |
|---|---|
| Browser runtime | **Untrusted** — user controls DevTools, localStorage, network |
| Source code / build pipeline | **Trusted** — CI-enforced, locked dependencies |
| localStorage | **Untrusted** — user can read/write arbitrarily |

### In-Scope Concerns

- Build integrity (locked deps, CI SCA, no secrets in bundle)
- Input validation on client-side game state
- No `eval`, `dangerouslySetInnerHTML`, or dynamic code execution
- No hardcoded credentials or API keys

### Out of Scope

- Authentication / authorization (single-player, no backend)
- Server-side injection (no server)
- CORS / CSRF (no API)
- Rate limiting (no shared service)

## Reporting

If you find a security issue, open an issue or contact the maintainer directly.
