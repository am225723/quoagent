## 2026-01-16 - Hardcoded Secrets in Example Config
**Vulnerability:** Found real API keys and secrets hardcoded in `.env.example`.
**Learning:** Developers often copy their local `.env` to `.env.example` without scrubbing sensitive values.
**Prevention:** Use pre-commit hooks or CI checks to scan for high-entropy strings or known key patterns in non-secret files.

## 2025-02-17 - Missing Authentication on Critical Agent Endpoint
**Vulnerability:** The `/api/run` endpoint, which triggers the expensive and sensitive agent process, was completely unprotected.
**Learning:** "Force-dynamic" API routes in Next.js do not imply any security. Functions that perform sensitive operations must have explicit authorization checks.
**Prevention:**
1. All API routes must start with an authentication/authorization check.
2. Use middleware to enforce auth on sensitive routes.

## 2026-01-27 - Missing Global Authentication Layer
**Vulnerability:** The entire API surface (except `/api/run`) was exposed because `middleware.ts` was missing. Endpoints like `/api/approve` allowed unauthenticated database writes.
**Learning:** Relying solely on per-route authentication is error-prone. A missing `middleware.ts` in a Next.js project can silently leave "internal" APIs wide open.
**Prevention:** Always implement a "deny by default" middleware that requires authentication for all `/api/` routes, whitelist specific public routes explicitly.
