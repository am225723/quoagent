## 2026-01-16 - Hardcoded Secrets in Example Config
**Vulnerability:** Found real API keys and secrets hardcoded in `.env.example`.
**Learning:** Developers often copy their local `.env` to `.env.example` without scrubbing sensitive values.
**Prevention:** Use pre-commit hooks or CI checks to scan for high-entropy strings or known key patterns in non-secret files.
