# Neon Managed Better Auth integration

Veltron Digital is being prepared to use Neon Managed Better Auth (powered by Better Auth) alongside its existing PostgreSQL/Prisma application.

## Current status

- The Neon Better Auth SDK is installed.
- The server SDK and same-origin `/api/auth/*` proxy are added.
- The proxy is **disabled by default**. Set `NEON_AUTH_ENABLED=true` only after completing the readiness checks below.
- Existing `/sign-in`, `/sign-up`, local password hashes, Prisma sessions, TOTP/recovery codes, user statuses, roles, and admin bootstrap are unchanged.
- No database schema, production records, payment settings, or email settings are changed by this integration.

## Vercel environment

In the **veltron-digital** Vercel project, configure these server-side variables:

- `NEON_AUTH_BASE_URL`: the Neon Auth URL supplied for this project:
  `https://ep-floral-breeze-b5o4y4s0.neonauth.c-7.us-east-2.aws.neon.tech/neondb/auth`
- `NEON_AUTH_COOKIE_SECRET`: a newly generated random secret of at least 32 characters. Generate it privately with `openssl rand -base64 32`. Do not reuse any secret posted in chat or source control.
- `NEON_AUTH_ENABLED`: keep `false` during validation.

Do not add the cookie secret to GitHub, client-side variables, or this document. Keep existing `AUTH_SECRET` unchanged while legacy sessions may still be active. Email-related variables are intentionally outside the scope of this change.

## Required before switching production sign-in

Neon Auth creates identities and sessions in the Neon `neon_auth` schema. Veltron's business data, authorization roles, orders, wallets, and audit trail use the existing Prisma `User` record. A Neon identity must not be trusted as an admin/customer business identity merely because it has a verified email.

Before changing the existing sign-in routes:

1. Decide and test a deterministic mapping from Neon user IDs to existing Prisma `User.id` values; email-only matching must account for verified email, uniqueness, account status, and takeover risks.
2. Preserve existing SUPER_ADMIN/ADMIN/SUPPORT roles, suspended/pending status, TOTP and recovery-code enforcement, and audit events.
3. Implement a server-side authorization adapter that resolves every Neon session to an active local user and fails closed when no safe mapping exists.
4. Plan a tested migration/onboarding path for existing password accounts. Do not copy password hashes into Neon Auth or assume existing sessions are portable.
5. Test new registration, sign-in, sign-out, verification/recovery, 2FA, suspended accounts, admin access, and payment/order API authorization in preview before activation.
6. Keep the legacy sign-in routes available as a rollback path until the new flow has been verified with real test accounts.

The SDK integration is intentionally not switched on by this commit. This avoids locking out existing users or weakening role checks while the identity mapping is still missing.
