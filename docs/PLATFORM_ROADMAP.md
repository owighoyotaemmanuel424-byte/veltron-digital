# Veltron Digital platform roadmap

This is an original product using the supplied GlobalGle documentation as a functional reference. It does not copy GlobalGle branding or source code.

## Implemented in this milestone
- PostgreSQL/Prisma foundation for users, services, orders, payments, webhook events and audit records.
- Password-based registration and sign-in; random opaque server sessions stored as SHA-256 hashes, HttpOnly cookies, and revocable sign-out.
- Email verification for new registrations using single-use, hashed 24-hour tokens; resend requests use a privacy-preserving response and durable per-email rate limiting.
- Email delivery through the Resend API; requires server-side RESEND_API_KEY, EMAIL_FROM and APP_URL configuration. Registration fails closed if these are missing.
- Existing ACTIVE accounts are marked verified by the additive migration to preserve access; one-time bootstrapped super-admin accounts are also marked verified.
- Optional TOTP two-factor setup with AES-256-GCM encrypted secret storage and server-side verification.
- Customer dashboard reads order counts, recent orders, wallet balances and platform record counts from PostgreSQL.
- Service catalog reads only administrator-activated services.
- Additive schema foundations for wallet accounts, ledger transactions/entries, hosted sites, telephony logs and generated documents.
- Paystack remains disabled until merchant eligibility and credentials are confirmed. A signed webhook is not itself proof of settled payment.

## Not yet production-ready
- Registration, sign-in and verification resend apply durable PostgreSQL-backed per-email and per-network rate limits. Raw email addresses and IP addresses are HMACed before storage. A protected daily cleanup endpoint removes expired/revoked sessions, old verification tokens and stale limiter rows; configure CRON_SECRET in Vercel and verify the scheduled invocation. Device-level controls and broader abuse monitoring remain outstanding.
- Add single-use recovery codes, TOTP recovery, password reset and secure account recovery before requiring 2FA.
- Wallet top-ups, subscriptions, document charges and voice overage are not enabled. Do not change balances until a reviewed double-entry posting service and reconciliation worker exist.
- Customer order requests can now be created idempotently against active catalog items and appear in the customer dashboard. They remain PENDING: payment and provider fulfilment are intentionally not enabled.
- Hosted-site provisioning, registrar/DNS, container orchestration and telephony require provider selection, credentials, quotas, secure callback validation and integration tests.
- Document generation must not create fake financial records or imitate third-party bank statements/receipts. Generate clearly identified documents for legitimate use.
- Admins can now create/edit catalog services, control catalog status, search users, and suspend/reactivate accounts; role changes are restricted to super-admins and protected actions are audit-logged. Order administration now supports review and safe cancellation of unpaid pending orders. Still add append-only audit enforcement, broader origin/CSRF review, monitoring and end-to-end tests before production launch.

## Deployment requirements
- Configure CRON_SECRET as a high-entropy server-side Vercel environment variable. Vercel invokes `/api/cron/cleanup` daily; missing or invalid authorization fails closed.
- Node.js 20+, PostgreSQL and a strong AUTH_SECRET of at least 32 characters.
- Configure RESEND_API_KEY, EMAIL_FROM with a sender/domain verified by Resend, and APP_URL pointing to the public HTTPS application URL in production.
- Run npx prisma generate and apply the additive migration with npx prisma migrate deploy after reviewing it against the target database.
- Never run prisma migrate reset on production. Keep a database backup and review migration effects before deployment.
- Store Paystack credentials as server-side Vercel environment variables only; never commit them.
