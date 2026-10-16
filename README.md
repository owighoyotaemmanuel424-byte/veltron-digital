# Veltron Digital

Original digital services marketplace built with Next.js App Router, TypeScript, PostgreSQL, and Prisma. The supplied GlobalGle PDFs are used as functional reference material; this repository is not a clone of GlobalGle.

## Implemented foundation
- Password registration/sign-in with bcrypt password hashing and revocable HttpOnly sessions.
- Email verification for new registrations using one-time, hashed tokens that expire after 24 hours; resend endpoint is rate-limited and avoids account enumeration.
- Durable per-email and per-network rate limits on registration, sign-in and verification resend.
- Daily protected cleanup for expired/revoked sessions, old verification tokens and stale rate-limit rows.
- Email delivery through Resend; registration fails closed when the required email settings are missing. Email delivery configuration was intentionally left unchanged.
- Optional authenticator-based TOTP two-factor authentication with encrypted secret storage and ten single-use recovery codes stored only as hashes.
- Customer workspace and database-backed service catalog.
- Role-protected admin overview and one-time token-protected super-admin bootstrap endpoint.
- PostgreSQL models for users, orders, payments, webhook events, audit logs, wallet accounts, ledger entries, hosted sites, telephony records and generated documents.
- Paystack signature verification groundwork. Payment settlement, wallet posting and fulfilment are not enabled by webhook receipt alone.

## Important readiness limitations
This is an actively developed platform, **not yet production-ready**. Admin catalog/user management and pending order review are implemented. Remaining gates include balanced ledger posting and payment reconciliation, provider-backed order fulfilment, hosted-site provisioning, telephony integration, document rendering, password/account recovery, device-level abuse monitoring, broader CSRF review, end-to-end coverage, production migrations, and verified deployment.

Do not enable real money movement until the required controls are implemented and tested. Do not claim telephony, hosting, payment settlement, or document generation is live merely because its schema exists.

Configure `CRON_SECRET` (at least 32 random characters) in Vercel to authorize the daily `/api/cron/cleanup` schedule. See `docs/PLATFORM_ROADMAP.md` for remaining production gates.

## Local development
1. Use Node.js 20+ and PostgreSQL.
2. Copy `.env.example` to `.env`; configure `DATABASE_URL`, a random `AUTH_SECRET` of at least 32 characters, and `APP_URL`.
3. Configure `RESEND_API_KEY` and `EMAIL_FROM` using a sender/domain verified by Resend to test registration emails.
4. Run `npm install`, `npx prisma generate`, `npx prisma migrate dev`, then `npm run dev`.
5. Run `npm run typecheck`, `npm run lint`, and `npm test`.

## Initial super-admin
Set a unique random `ADMIN_BOOTSTRAP_TOKEN` of at least 32 characters as a server-side environment variable. Send a POST request to `/api/admin/bootstrap` with JSON fields `token`, `email`, `password` (at least 16 characters), and optional `name`. The endpoint is available only while no SUPER_ADMIN exists. After successful setup, remove `ADMIN_BOOTSTRAP_TOKEN` from the deployment environment. Never put the token or credentials in source control or a public client.

## Database safety
The new platform-core, authentication-rate-limit, and email-verification migrations are additive. The email-verification migration marks existing ACTIVE accounts as verified to preserve access; newly registered accounts remain PENDING until verification. Review migrations and take a database backup before applying them to any production database. Use `npx prisma migrate deploy` for reviewed production migrations; never use `prisma migrate reset` on production.

## Payments
Paystack remains disabled until merchant eligibility and server-side credentials are confirmed. Validate provider reference, amount, currency and order association; make reconciliation and ledger posting idempotent and transactional before activating funding or fulfilment.

See [docs/PLATFORM_ROADMAP.md](docs/PLATFORM_ROADMAP.md) and [docs/SECURITY.md](docs/SECURITY.md).


## Neon Managed Better Auth

A staged integration for Neon Managed Better Auth is available. It is disabled by default while the app's local user roles, existing accounts, two-factor authentication, and admin authorization are mapped safely to Neon identities. See [docs/NEON_BETTER_AUTH_MIGRATION.md](docs/NEON_BETTER_AUTH_MIGRATION.md) before enabling it. Keep `NEON_AUTH_ENABLED=false` until the documented migration and authorization checks pass. Email configuration is unchanged.
