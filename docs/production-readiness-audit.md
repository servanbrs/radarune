# Radarune production readiness audit

Date: 2026-07-28

## Current architecture

- Next.js App Router, React 19 and strict TypeScript
- Prisma 7 with MySQL and repository/service separation
- Better Auth session context, organization membership and system RBAC
- Feature modules for releases, storage, distribution, provider webhooks, finance, growth/discover, notifications, intelligence and mobile API v1
- Database-backed distribution queue with atomic reservation, heartbeat, stale-lock recovery, retry scheduling and manual-review terminal state
- Provider registry with INTERNAL, ONE_RPM, FUGA, SYMPHONIC and REVELATOR adapters; external adapters require configuration and do not report fake success
- Local/configuration-required storage adapters and organization-scoped upload records
- Vitest suite plus lint, typecheck, production-environment validation and Next.js build gates

## Verified working critical path

- Release draft creation and editing
- Track add/update/delete and ordering
- Artwork/audio upload association
- Server-side release validation and validation issue persistence
- Idempotent state-guarded submission for admin review
- Admin approve, reject and revision-request actions
- Distribution payload snapshot, idempotency key and job enqueue
- Atomic job reservation, heartbeat, retry scheduling and manual-review/DLQ transition
- Signed provider webhook verification and persisted webhook events
- Organization-scoped finance, discover and mobile service layers

## Completed after the initial audit

- Tenant-scoped upload attachment and release submission concurrency guard
- Atomic admin release moderation transitions
- Idempotent distribution enqueue under unique-key races
- Provider webhook provider validation, malformed-payload handling and replay window
- Tenant-scoped webhook release transitions
- Media upload readiness validation before release submission
- Creator artist application form, persistence, audit trail and admin review entrypoint
- Atomic artist-application moderation transitions
- Tenant-scoped Discover events, import moderation and mobile notifications
- Retry Operations Center page with real retry endpoint

## Highest-priority gaps

1. Release lifecycle names are coarser than the target contract (`PENDING_REVIEW`, `REVISION_REQUESTED`, `DISTRIBUTED`, `REMOVED`). Expanding these requires a non-destructive data migration and coordinated updates to state guards, UI labels, provider mapping and tests.
2. Upload persistence exists, but production media processing still needs complete codec/bit-depth/channel extraction, normalization, preview/waveform generation and cleanup-worker coverage.
3. Distribution Operations Center needs dedicated retry, worker and metrics views with cursor pagination. DLQ list/requeue is the first completed slice.
4. Internal LIVE-to-Discover behavior exists in the growth layer, but scheduled import, moderation and takedown synchronization need end-to-end tests.
5. The test suite is green but does not yet cover every requested concurrency, webhook replay, storage corruption and discover de-duplication scenario.
6. Several list screens use fixed bounded `take` values rather than user-facing cursor pagination.
7. Production deployment still requires real database, storage signing/encryption secrets and any enabled external provider credentials.

## Implementation order

1. Complete release lifecycle, optimistic concurrency and validation contract.
2. Complete media analysis/preview pipeline and private signed delivery.
3. Finish distribution operations APIs/UI, worker registry, metrics and webhook replay.
4. Finish internal Discover import, moderation and feed event integrity.
5. Close admin/artist/finance/notification gaps.
6. Add security and tenant-isolation regression tests.
7. Run migration validation, full test/lint/typecheck/build and production checklist.

Each phase must remain independently deployable and use a separate Conventional Commit.
