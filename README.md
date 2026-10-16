# Veltron Digital

Original digital services marketplace built with Next.js App Router, TypeScript, PostgreSQL, and Prisma. The supplied GlobalGle PDFs are used as functional reference material; this repository is not a clone of GlobalGle.

## Implemented foundation
- Password registration/sign-in with bcrypt password hashing and revocable HttpOnly sessions.
- Optional authenticator-based TOTP two-factor authentication with encrypted secret storage.
- Customer workspace and database-backed service catalog.
- Role-protected admin overview and one-time token-protected super-admin bootstrap endpoint.
- PostgreSQL models for users, orders, payments, webhook events, audit logs, wallet accounts, ledger entries, hosted sites, telephony records and generated documents.
- Paystack signature verification groundwork. Payment settlement, wallet posting and fulfilment are not enabled by webhook receipt alone.

## Important readiness limitations
This is an actively developed foundation, **not yet production-ready**. Public registration currently lacks email verification and durable abuse/rate limiting. Admin user management, order creation/fulfilment, balanced ledger posting, payment reconciliation, hosted-site provisioning, telephony provider integration, document rendering, recovery codes, and end-to-end coverage remain to be completed and reviewed.

Do not enable public production registration or real money movement until those controls are implemented and tested. Do not claim telephony, hosting, payment settlement, or document generation is live merely because its schema exists.

## Local development
1. Use Node.js 20+ and PostgreSQL.
2. Copy `.env.example` to `.env`; configure `DATABASE_URL`, a random `AUTH_SECRET` of at least 32 characters, and `APP_URL`.
3. Run `npm install`, `npx prisma generate`, `npx prisma migrate dev`, then `npm run dev`.
4. Run `npm run typecheck`, `npm run lint`, and `npm test`.

## Initial super-admin
Set a unique random `ADMIN_BOOTSTRAP_TOKEN` of at least 32 characters as a server-side environment variable. Send a POST request to `/api/admin/bootstrap` with JSON fields `token`, `email`, `password` (at least 16 characters), and optional `name`. The endpoint is available only while no SUPER_ADMIN exists. After successful setup, remove `ADMIN_BOOTSTRAP_TOKEN` from the deployment environment. Never put the token or credentials in source control or a public client.

## Database safety
The new platform-core migration is additive. Review it and take a database backup before applying it to any production database. Use `npx prisma migrate deploy` for reviewed production migrations; never use `prisma migrate reset` on production.

## Payments
Paystack remains disabled until merchant eligibility and server-side credentials are confirmed. Validate provider reference, amount, currency and order association; make reconciliation and ledger posting idempotent and transactional before activating funding or fulfilment.

See [docs/PLATFORM_ROADMAP.md](docs/PLATFORM_ROADMAP.md) and [docs/SECURITY.md](docs/SECURITY.md).
