# Optional prototype backend

The Express/tRPC backend is inherited development infrastructure, not a Kinhold product API. The proof-flow simulation does not require authentication, a database, storage, LLM/image/voice helpers, notifications, or scheduled jobs.

Runtime routes:

- `/api/health` and the tRPC router are available when the server runs.
- Legacy OAuth routes are registered only with `AUTH_ENABLED=true`.
- The legacy storage download proxy is registered only with `STORAGE_PROXY_ENABLED=true` and requires an authenticated request.
- `system.notifyOwner` remains admin-authenticated but is unused by the app.

Unused files under `server/_core` are retained to avoid a broad, risky template deletion in this hardening pass. They should not be treated as configured or supported features.

See the root README and `.env.example` for the fail-closed security configuration.
