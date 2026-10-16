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
- Registration and sign-in apply durable PostgreSQL-backed per-email rate limits (registration: 5 attempts/hour; sign-in: 8 attempts/15 minutes; verification resend: 3/hour). Raw email addresses are not stored in the limiter table. IP/device-level controls and automated retention cleanup still need implementation.
- Add recovery codes, TOTP recovery, and secure account recovery before requiring 2FA.
- Wallet top-ups, subscriptions, document charges and voice overage are not enabled. Do not change balances until a reviewed double-entry posting service and reconciliation worker exist.
- Orders do not yet trigger provider fulfilment.
- Hosted-site provisioning, registrar/DNS, container orchestration and telephony require provider selection, credentials, quotas, secure callback validation and integration tests.
- Document generation must not create fake financial records or imitate third-party bank statements/receipts. Generate clearly identified documents for legitimate use.
- Add admin routes with server-side role checks, immutable audit events, origin/CSRF review, monitoring and end-to-end tests before production launch.

## Deployment requirements
- Node.js 20+, PostgreSQL and a strong AUTH_SECRET of at least 32 characters.
- Configure RESEND_API_KEY, EMAIL_FROM with a sender/domain verified by Resend, and APP_URL pointing to the public HTTPS application URL in production.
- Run npx prisma generate and apply the additive migration with npx prisma migrate deploy after reviewing it against the target database.
- Never run prisma migrate reset on production. Keep a database backup and review migration effects before deployment.
- Store Paystack credentials as server-side Vercel environment variables only; never commit them.
