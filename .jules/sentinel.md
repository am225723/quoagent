## 2026-01-16 - Hardcoded Secrets in Example Config
**Vulnerability:** Found real API keys and secrets hardcoded in `.env.example`.
**Learning:** Developers often copy their local `.env` to `.env.example` without scrubbing sensitive values.
**Prevention:** Use pre-commit hooks or CI checks to scan for high-entropy strings or known key patterns in non-secret files.

## 2026-02-17 - Missing Authentication on Critical Agent Endpoint
**Vulnerability:** The `/api/run` endpoint, which triggers the expensive and sensitive agent process, was completely unprotected. It allowed any caller to trigger agent runs, potentially leading to DoS, financial loss (LLM costs), and database state corruption.
**Learning:** "Force-dynamic" API routes in Next.js do not imply any security. Functions that perform sensitive operations (like `runAgent` using `SUPABASE_SERVICE_ROLE_KEY`) must have explicit authorization checks at the entry point. The presence of a `CRON_SECRET` in the environment is useless if the code doesn't check it.
**Prevention:**
1.  All API routes must start with an authentication/authorization check.
2.  Use middleware or a higher-order function to enforce auth on sensitive routes.
3.  Never assume an endpoint is hidden or safe just because it's intended for cron jobs.

## 2026-02-18 - Restored Missing Global Authentication
**Vulnerability:** The `middleware.ts` file was missing, leaving all Admin UI routes (`/review`, `/history`, etc.) and sensitive API endpoints (`/api/drafts`, `/api/contacts/*`) completely unprotected. Anyone with the URL could view sensitive data or perform actions.
**Learning:** Build artifacts or accidental deletions can silently remove critical security layers. Always verify that security infrastructure files (like middleware) exist and are active in production builds. The absence of a file can be as dangerous as bad code.
**Prevention:**
1. Add a "canary" test that fails if `middleware.ts` is missing or if a protected endpoint returns 200 without auth.
2. Treat `middleware.ts` as a critical security asset.
