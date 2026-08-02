# Radarune V2 roadmap

## Critical

- Auth: secure redirect, 2FA resend/verify rate limits, session revoke, account state and audit coverage.
- Root environment validation and secret naming compatibility.
- Organization isolation and server-side RBAC integration tests.
- Secret masking/redaction and private artifact checks.
- Production smoke command and health endpoint verification.

## High Priority

- Central configuration resolver with platform/organization/env/default precedence.
- Encrypted secret storage, cache TTL/invalidation, connection-test contract and env migration.
- Shared admin shell and permission-aware admin navigation.
- Real queue/worker heartbeat and integration status reporting.
- Release draft persistence and upload limits propagated to server validation.

## Core Product

- User dashboard, artist application approval lifecycle and artist profile completeness.
- Release wizard for single/EP/album with canonical payload, validation and autosave.
- Discover card playback, event tracking, pagination and social actions.
- Notifications, moderation and content reporting.

## Admin V2

- Operational dashboard, user/application/release/distribution views.
- Integration Center, settings/setup wizard, logs, health and feature flags.
- Real platform analytics with consent, hashing, bot/admin exclusion and empty states.

## Configuration

- Email, AI, storage, OAuth, analytics, payments and distribution provider adapters use the resolver.
- Admin override source display, test connection, disable/remove secret and audit behavior.
- Site/CMS/SEO/maintenance flags propagate to public/auth/admin/email metadata.

## Distribution

- Provider capability/status registry, idempotent jobs, retry/backoff, dead-letter and webhook security.
- ONErpm MANUAL/AUTOMATION/API modes, session health, preview and human final approval.
- Do not automate CAPTCHA, OTP retrieval or irreversible submit.

## Analytics

- Platform visitor/session model, music engagement, store/country streams and finance reporting.
- Index review, date bucketing, privacy consent and export authorization.

## Security

- Headers/CSP, rate-limit matrix, upload MIME/size checks, secret redaction and audit logs.
- Dependency/build checks and private file CI guard.

## Production Readiness

- Deployment/backup/restore/runbook, worker process management, cron, health checks and observability.
- `npm run typecheck`, `npm test`, `npm run build`, E2E and production environment validation in CI.

## Execution order

1. Audit and baseline (complete on this branch).
2. Critical stabilization and security.
3. Configuration foundation.
4. Core product and admin consolidation.
5. Operations, distribution, finance and analytics.
6. Public/SEO polish, hardening, documentation and final verification.

