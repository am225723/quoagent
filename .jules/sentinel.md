<<<<<<< SEARCH
**Prevention:**
1.  All API routes must start with an authentication/authorization check.
2.  Use middleware or a higher-order function to enforce auth on sensitive routes.
3.  Never assume an endpoint is hidden or safe just because it's intended for cron jobs.
=======
**Prevention:**
1.  All API routes must start with an authentication/authorization check.
2.  Use middleware or a higher-order function to enforce auth on sensitive routes.
3.  Never assume an endpoint is hidden or safe just because it's intended for cron jobs.

## 2025-02-17 - Missing Middleware Exposed Admin API
**Vulnerability:** The `middleware.ts` file was missing, causing global Basic Authentication to be absent. This left sensitive admin endpoints like `/api/approve` completely exposed to the public Internet, allowing unauthorized data modification.
**Learning:** Reliance on a single global middleware for security is risky if the file can be accidentally deleted or excluded. Defense in depth (checking auth in route handlers too) would have mitigated this.
**Prevention:**
1.  Implement CI checks to ensure critical security files (like middleware) exist.
2.  Consider adding a fallback auth check in a shared wrapper for all API routes.
3.  Regularly audit route protection.
>>>>>>> REPLACE
