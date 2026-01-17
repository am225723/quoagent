<<<<<<< HEAD
## 2026-01-16 - Hardcoded Secrets in Example Config
**Vulnerability:** Found real API keys and secrets hardcoded in `.env.example`.
**Learning:** Developers often copy their local `.env` to `.env.example` without scrubbing sensitive values.
**Prevention:** Use pre-commit hooks or CI checks to scan for high-entropy strings or known key patterns in non-secret files.
=======
## 2025-02-17 - Missing Authentication on Critical Agent Endpoint

**Vulnerability:** The `/api/run` endpoint, which triggers the expensive and sensitive agent process, was completely unprotected. It allowed any caller to trigger agent runs, potentially leading to DoS, financial loss (LLM costs), and database state corruption.

**Learning:** "Force-dynamic" API routes in Next.js do not imply any security. Functions that perform sensitive operations (like `runAgent` using `SUPABASE_SERVICE_ROLE_KEY`) must have explicit authorization checks at the entry point. The presence of a `CRON_SECRET` in the environment is useless if the code doesn't check it.

**Prevention:**
1.  All API routes must start with an authentication/authorization check.
2.  Use middleware or a higher-order function to enforce auth on sensitive routes.
3.  Never assume an endpoint is hidden or safe just because it's intended for cron jobs.
>>>>>>> origin/sentinel-fix-run-auth-13580378670000090596
